"use server";

import { revalidatePath } from "next/cache";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const uuidPattern = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;
type Payable = { id: string; payableAmount: unknown };

async function performSettlement(form: FormData): Promise<void> {
  const user = await requireEmployee(["SUPER_ADMIN"]);
  const employeeId = String(form.get("employeeId") || "");
  const payoutDate = String(form.get("payoutDate") || "");
  const mode = String(form.get("mode") || "");
  const reason = String(form.get("reason") || "").trim();
  const reference = String(form.get("reference") || "").trim();
  const enteredAmount = String(form.get("amount") || "").trim();
  if (!uuidPattern.test(employeeId) || !datePattern.test(payoutDate) || !["FULL", "CUSTOM"].includes(mode)) throw new Error("Invalid payment request.");
  if (reference.length < 3 || reference.length > 150) throw new Error("Enter the external payment reference (3–150 characters).");
  if (mode === "CUSTOM" && (reason.length < 10 || reason.length > 1000)) throw new Error("Enter a payment adjustment reason (at least 10 characters).");
  if (mode === "CUSTOM" && !/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(enteredAmount)) throw new Error("Enter a valid nonnegative amount with up to two decimal places.");

  const actor = await prisma.employeeProfile.findUnique({where:{authUserId:user.id},select:{id:true,role:true,status:true}});
  if (!actor || actor.role !== "SUPER_ADMIN" || actor.status !== "ACTIVE") throw new Error("Not authorized.");

  await prisma.$transaction(async tx => {
    // Serialize all settlements for this employee, including concurrent browser submissions.
    await tx.$queryRaw`SELECT id FROM public."EmployeeProfile" WHERE id=${employeeId}::uuid FOR UPDATE`;
    const rows = await tx.$queryRaw<Payable[]>`
      SELECT l.id, l."payableAmount" FROM public."WorkforcePayLedger" l
      WHERE l."employeeId"=${employeeId}::uuid AND l."payoutDate"=${payoutDate}::date AND l.status='PENDING'
        AND (l."taskId" IS NULL OR EXISTS (SELECT 1 FROM public."WorkTask" t WHERE t.id=l."taskId" AND t.status='COMPLETED' AND t."clientActionAt" IS NOT NULL))
        AND NOT EXISTS (SELECT 1 FROM public."PayTeamAllocation" a WHERE a."ledgerId"=l.id)
        AND NOT EXISTS (SELECT 1 FROM public."WorkforcePayDecision" d WHERE d."ledgerId"=l.id)
        AND NOT EXISTS (SELECT 1 FROM public."WorkforcePayLedger" prior
          WHERE prior.id<>l.id AND prior.status='PAID' AND l."taskId" IS NOT NULL
            AND prior."taskId"=l."taskId" AND prior."employeeId"=l."employeeId" AND prior."sourceType"=l."sourceType")
      ORDER BY l."createdAt",l.id FOR UPDATE OF l`;
    if (!rows.length) throw new Error("Nothing payable for this employee and period. Refresh the page.");
    const methods=await tx.$queryRaw<Array<{hasMethod:boolean}>>`
      SELECT EXISTS(SELECT 1 FROM public."EmployeePaymentMethod" m WHERE m."employeeId"=${employeeId}::uuid AND length(btrim(m.details))>0) AS "hasMethod"`;
    if (!methods[0]?.hasMethod) throw new Error("Employee has no approved payment method.");
    const toCents=(v:unknown)=>Math.round(Number(v)*100);
    const due=rows.reduce((a,r)=>a+toCents(r.payableAmount),0);
    const extras = await tx.$queryRaw<Array<{id:string;amount:unknown}>>`
      SELECT id,amount FROM public."WorkforcePayoutAdjustment"
      WHERE "employeeId"=${employeeId}::uuid AND "payoutDate"=${payoutDate}::date AND "settlementId" IS NULL
      ORDER BY "createdAt",id FOR UPDATE`;
    const extrasTotal = extras.reduce((sum,a)=>sum+toCents(a.amount),0);
    const finalDue = due + extrasTotal;
    const statements=await tx.$queryRaw<Array<{state:string;accrued:unknown;adjustments:unknown;finalPayable:unknown;ready:boolean;fundsVerifiedAt:Date|null}>>`
      SELECT state,accrued,adjustments,"finalPayable","fundsVerifiedAt",("publishedAt" <= now()-interval '48 hours') AS ready
      FROM public."WorkforcePayStatement" WHERE "employeeId"=${employeeId}::uuid AND "payoutDate"=${payoutDate}::date FOR UPDATE`;
    const statement=statements[0];
    if(!statement||!["REVIEW","CLEARED"].includes(statement.state)||!statement.ready||!statement.fundsVerifiedAt||
      toCents(statement.accrued)!==due||toCents(statement.adjustments)!==extrasTotal||toCents(statement.finalPayable)!==finalDue)
      throw new Error("Publish the employee's unchanged statement for at least 48 hours before payment.");
    if (!Number.isSafeInteger(extrasTotal) || !Number.isSafeInteger(finalDue) || finalDue < 0) throw new Error("Invalid final payout total.");
    if (extras.length && mode === "CUSTOM") throw new Error("Use Pay in full for a period with named adjustments. Update the employee payout adjustment in Pay Team before settlement.");
    if (!Number.isSafeInteger(due)||due<0) throw new Error("Invalid outstanding balance.");
    const requested=mode==="FULL"?finalDue:Math.round(Number(enteredAmount)*100);
    if(requested!==finalDue)throw new Error("Custom final amounts must be recorded as named employee-level adjustments and republished before settlement.");
    if (!Number.isSafeInteger(requested)||requested<=0) throw new Error("Final payment must be greater than zero. Zero-payout closeout requires a separate audited workflow.");
    const batch=await tx.$queryRaw<Array<{id:string}>>`
      INSERT INTO public."PayTeamSettlement" ("employeeId","payoutDate","approvedTotal","paidTotal","reason","paymentReference","paidById")
      VALUES (${employeeId}::uuid,${payoutDate}::date,${(due/100).toFixed(2)}::numeric,${(requested/100).toFixed(2)}::numeric,${extras.length?"Named employee payout adjustments":mode==="FULL"?null:reason},${reference},${actor.id}::uuid)
      RETURNING id`;
    // Allocate a final settlement across all approved entries. For overpayments,
    // allocate the positive adjustment to the last row rather than opening employee debt.
    // The settlement approvedTotal/paidTotal preserves the original vs final totals.
    let remaining=extras.length?due:requested;
    for (const [index, row] of rows.entries()) {
      const cents=index === rows.length-1 ? remaining : Math.min(toCents(row.payableAmount),remaining);
      remaining-=cents;
      await tx.$executeRaw`
        INSERT INTO public."PayTeamAllocation" ("settlementId","ledgerId","paidAmount")
        VALUES (${batch[0].id}::uuid,${row.id}::uuid,${(cents/100).toFixed(2)}::numeric)`;
      const updated=await tx.$executeRaw`
        UPDATE public."WorkforcePayLedger" SET status='PAID',"paidAt"=now(),"paidById"=${actor.id}::uuid,
          "paymentReference"=${reference},"paymentNote"=${mode==="FULL"?"Paid in full via Pay Team":`Pay Team adjusted payment: ${reason}`}
        WHERE id=${row.id}::uuid AND status='PENDING'`;
      if (updated!==1) throw new Error("A payroll entry was updated during settlement; no payments were recorded.");
    }
    if (remaining!==0) throw new Error("Settlement allocation did not balance.");
    if (extras.length) {
      const updated = await tx.$executeRaw`
        UPDATE public."WorkforcePayoutAdjustment" SET "settlementId"=${batch[0].id}::uuid,"settledAt"=now()
        WHERE "employeeId"=${employeeId}::uuid AND "payoutDate"=${payoutDate}::date AND "settlementId" IS NULL`;
      if (updated!==extras.length) throw new Error("Payout adjustment list changed during settlement.");
    }
    const statementMarked=await tx.$executeRaw`UPDATE public."WorkforcePayStatement" SET state='PAID',"updatedAt"=now()
      WHERE "employeeId"=${employeeId}::uuid AND "payoutDate"=${payoutDate}::date AND state IN ('REVIEW','CLEARED')`;
    if(statementMarked!==1)throw new Error("Statement changed during settlement");
    await tx.$executeRaw`INSERT INTO public."WorkforcePayStatementEvent"("employeeId","payoutDate","eventKind","actorId",details)
      VALUES(${employeeId}::uuid,${payoutDate}::date,'PAID',${actor.id}::uuid,${reference})`;
    await tx.portalNotification.create({data:{recipientId:employeeId,title:mode==="FULL"?"Payroll payment recorded":"Payroll payment adjusted",body:mode==="FULL"?`A payment of $${(requested/100).toFixed(2)} was recorded for ${payoutDate}. Reference: ${reference}.`:`A payment of $${(requested/100).toFixed(2)} was recorded against $${(due/100).toFixed(2)} for ${payoutDate}. Reason: ${reason}. Reference: ${reference}. Contact administration if you wish to dispute this adjustment.`,href:"/earnings"}});
  }, {timeout:20000});
  revalidatePath("/super-admin/payroll/pay-team");
  revalidatePath("/super-admin/payroll");
  revalidatePath("/earnings");
  revalidatePath("/notifications");
}


export type SettlementFeedback = { status: "idle" | "success" | "error"; message: string };

/** Return the validation/database message to the form instead of an opaque failed Server Action. */
export async function settleTeamBalance(
  _previous: SettlementFeedback,
  form: FormData,
): Promise<SettlementFeedback> {
  try {
    await performSettlement(form);
    return {status:"success", message:"Payment recorded. This employee's selected payout-period balance is now settled."};
  } catch (error) {
    console.error("Pay Team settlement failed", error);
    const message = error instanceof Error ? error.message : "Unable to record payment. Check the server logs.";
    // Do not expose raw SQL and internal stack traces to the browser.
    const safe = /^(Invalid payment request|Enter |Nothing payable|Employee has no approved payment method|Not authorized|Final payment must|Invalid outstanding balance|Invalid final payout|Use Pay in full|Settlement allocation|A payroll entry was updated)/.test(message)
      ? message
      : "Payment could not be recorded. Verify the Pay Team migration and review the server logs.";
    return {status:"error", message:safe};
  }
}

/** Settle all eligible payout dates for one employee as one atomic operation.
 * The existing per-period action is retained for legacy callers, but the
 * consolidated Pay Team UI uses this action only.
 */
export async function settleEmployeeTotal(
  _previous: SettlementFeedback,
  form: FormData,
): Promise<SettlementFeedback> {
  try {
    const user = await requireEmployee(["SUPER_ADMIN"]);
    const employeeId = String(form.get("employeeId") ?? "");
    const reference = String(form.get("reference") ?? "").trim();
    if (!uuidPattern.test(employeeId) || reference.length < 3 || reference.length > 120)
      throw new Error("Enter a valid employee and payment reference (3–120 characters).");
    const actor = await prisma.employeeProfile.findUnique({where:{authUserId:user.id},select:{id:true,role:true,status:true}});
    if (!actor || actor.role !== "SUPER_ADMIN" || actor.status !== "ACTIVE") throw new Error("Not authorized.");

    await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM public."EmployeeProfile" WHERE id=${employeeId}::uuid FOR UPDATE`;
      const methods = await tx.$queryRaw<Array<{hasMethod:boolean}>>`
        SELECT EXISTS(SELECT 1 FROM public."EmployeePaymentMethod" m
          WHERE m."employeeId"=${employeeId}::uuid AND length(btrim(m.details))>0) AS "hasMethod"`;
      if (!methods[0]?.hasMethod) throw new Error("Employee has no approved payment method.");

      const periods = await tx.$queryRaw<Array<{payoutDate:Date}>>`
        SELECT DISTINCT l."payoutDate" FROM public."WorkforcePayLedger" l
        WHERE l."employeeId"=${employeeId}::uuid AND l.status='PENDING'
          AND NOT EXISTS(SELECT 1 FROM public."PayTeamAllocation" a WHERE a."ledgerId"=l.id)
          AND NOT EXISTS(SELECT 1 FROM public."WorkforcePayDecision" d WHERE d."ledgerId"=l.id)
          AND NOT EXISTS(SELECT 1 FROM public."WorkforcePayLedger" prior WHERE prior.id<>l.id AND prior.status='PAID'
            AND l."taskId" IS NOT NULL AND prior."taskId"=l."taskId" AND prior."employeeId"=l."employeeId" AND prior."sourceType"=l."sourceType")
          AND (l."taskId" IS NULL OR EXISTS(SELECT 1 FROM public."WorkTask" t WHERE t.id=l."taskId" AND t.status='COMPLETED' AND t."clientActionAt" IS NOT NULL))
        ORDER BY l."payoutDate"`;
      if (!periods.length) throw new Error("Nothing payable for this employee. Refresh Pay Team.");
      const cents = (n:unknown) => {
        const result = Math.round(Number(n)*100);
        if(!Number.isSafeInteger(result)) throw new Error("Invalid payout amount.");
        return result;
      };
      let total = 0;
      const batches: Array<{date:string;rows:Payable[];extras:Array<{id:string;amount:unknown}>;base:number;net:number}> = [];
      for (const item of periods) {
        const day = item.payoutDate instanceof Date ? item.payoutDate.toISOString().slice(0,10) : String(item.payoutDate).slice(0,10);
        if (!datePattern.test(day)) throw new Error("Invalid payout period.");
        const rows = await tx.$queryRaw<Payable[]>`
          SELECT l.id,l."payableAmount" FROM public."WorkforcePayLedger" l
          WHERE l."employeeId"=${employeeId}::uuid AND l."payoutDate"=${day}::date AND l.status='PENDING'
            AND (l."taskId" IS NULL OR EXISTS(SELECT 1 FROM public."WorkTask" t WHERE t.id=l."taskId" AND t.status='COMPLETED' AND t."clientActionAt" IS NOT NULL))
            AND NOT EXISTS(SELECT 1 FROM public."PayTeamAllocation" a WHERE a."ledgerId"=l.id)
            AND NOT EXISTS(SELECT 1 FROM public."WorkforcePayDecision" d WHERE d."ledgerId"=l.id)
            AND NOT EXISTS(SELECT 1 FROM public."WorkforcePayLedger" prior WHERE prior.id<>l.id AND prior.status='PAID'
              AND l."taskId" IS NOT NULL AND prior."taskId"=l."taskId" AND prior."employeeId"=l."employeeId" AND prior."sourceType"=l."sourceType")
          ORDER BY l."createdAt",l.id FOR UPDATE OF l`;
        if (!rows.length) throw new Error("Payroll balances changed. Refresh Pay Team.");
        const extras = await tx.$queryRaw<Array<{id:string;amount:unknown}>>`
          SELECT id,amount FROM public."WorkforcePayoutAdjustment"
          WHERE "employeeId"=${employeeId}::uuid AND "payoutDate"=${day}::date AND "settlementId" IS NULL
          ORDER BY "createdAt",id FOR UPDATE`;
        const base = rows.reduce((sum,row)=>sum+cents(row.payableAmount),0);
        const net = base + extras.reduce((sum,row)=>sum+cents(row.amount),0);
        if (!Number.isSafeInteger(base) || !Number.isSafeInteger(net) || net <= 0)
          throw new Error(`Payout period ${day} has no positive payable amount. Review the employee-level adjustments in Pay Team.`);
        // Enforce a published snapshot, open-issue resolution, and the 48-hour review window.
        const statements=await tx.$queryRaw<Array<{state:string;accrued:unknown;adjustments:unknown;finalPayable:unknown;ready:boolean;fundsVerifiedAt:Date|null}>>`
          SELECT state,accrued,adjustments,"finalPayable","fundsVerifiedAt",("publishedAt" <= now()-interval '48 hours') AS ready
          FROM public."WorkforcePayStatement" WHERE "employeeId"=${employeeId}::uuid AND "payoutDate"=${day}::date FOR UPDATE`;
        const statement=statements[0];
        if(!statement || !["REVIEW","CLEARED"].includes(statement.state) || !statement.ready||!statement.fundsVerifiedAt)
          throw new Error(`Payout period ${day} requires a published, undisputed statement and 48 hours of review.`);
        if(cents(statement.accrued)!==base || cents(statement.adjustments)!==(net-base) || cents(statement.finalPayable)!==net)
          throw new Error(`Payout period ${day} changed since publication. Republish the statement and restart the review window.`);
        total += net;
        if (!Number.isSafeInteger(total)) throw new Error("Invalid payout amount.");
        batches.push({date:day,rows,extras,base,net});
      }
      if(total<=0) throw new Error("Nothing payable for this employee.");
      // All transfers use the ONE externally verified reference. Each period's
      // ledger and adjustment amounts are settled once, under the employee lock.
      for (const batch of batches) {
        const settlement = await tx.$queryRaw<Array<{id:string}>>`
          INSERT INTO public."PayTeamSettlement" ("employeeId","payoutDate","approvedTotal","paidTotal","reason","paymentReference","paidById")
          VALUES (${employeeId}::uuid,${batch.date}::date,${(batch.base/100).toFixed(2)}::numeric,
            ${(batch.net/100).toFixed(2)}::numeric,${batch.extras.length?"Named employee payout adjustments":"Consolidated employee payment"},${reference},${actor.id}::uuid)
          RETURNING id`;
        const settlementId = settlement[0]?.id;
        if(!settlementId) throw new Error("Unable to record settlement.");
        for (const row of batch.rows) {
          const amount = cents(row.payableAmount);
          await tx.$executeRaw`
            INSERT INTO public."PayTeamAllocation" ("settlementId","ledgerId","paidAmount")
            VALUES (${settlementId}::uuid,${row.id}::uuid,${(amount/100).toFixed(2)}::numeric)`;
          const updated = await tx.$executeRaw`
            UPDATE public."WorkforcePayLedger" SET status='PAID',"paidAt"=now(),"paidById"=${actor.id}::uuid,
              "paymentReference"=${reference},"paymentNote"='Consolidated Pay Team settlement'
            WHERE id=${row.id}::uuid AND status='PENDING'`;
          if(updated!==1) throw new Error("Payroll changed during settlement. No payments were recorded.");
        }
        if(batch.extras.length){
          const updated = await tx.$executeRaw`
            UPDATE public."WorkforcePayoutAdjustment" SET "settlementId"=${settlementId}::uuid,"settledAt"=now()
            WHERE "employeeId"=${employeeId}::uuid AND "payoutDate"=${batch.date}::date AND "settlementId" IS NULL`;
          if(updated!==batch.extras.length) throw new Error("Payout adjustments changed during settlement.");
        }
      }
      for (const batch of batches) {
        const marked=await tx.$executeRaw`UPDATE public."WorkforcePayStatement" SET state='PAID',"updatedAt"=now()
          WHERE "employeeId"=${employeeId}::uuid AND "payoutDate"=${batch.date}::date AND state IN ('REVIEW','CLEARED')`;
        if(marked!==1)throw new Error("Published statement was modified during settlement.");
        await tx.$executeRaw`INSERT INTO public."WorkforcePayStatementEvent"("employeeId","payoutDate","eventKind","actorId",details)
          VALUES(${employeeId}::uuid,${batch.date}::date,'PAID',${actor.id}::uuid,${reference})`;
      }
      await tx.portalNotification.create({data:{recipientId:employeeId,title:"Payroll payment recorded",body:`A total payment of $${(total/100).toFixed(2)} was recorded across ${batches.length} payout period(s). Reference: ${reference}.`,href:"/earnings"}});
    },{timeout:30000});
    revalidatePath("/super-admin/payroll/pay-team");
    revalidatePath("/super-admin/on-hold");
    revalidatePath("/earnings");
    revalidatePath("/notifications");
    return {status:"success",message:"Full employee payment recorded across all eligible payout periods."};
  } catch(error){
    console.error("Consolidated Pay Team settlement failed",error);
    const msg=error instanceof Error?error.message:"Unable to record payment.";
    const safe = /^(Enter a valid|Not authorized|Employee has no|Nothing payable|Invalid payout|Payout period|Payroll balances changed|Payroll changed during|Payout adjustments changed)/.test(msg)
      ? msg : "Payment could not be recorded. Check settlement logs; no partial database settlement was committed.";
    return {status:"error",message:safe};
  }
}
