"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireEmployee } from "@/lib/auth/require-employee";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const AMOUNT = /^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/;

type LockedEntry = {
  id: string; taskId: string | null; employeeId: string; sourceType: string;
  grossAmount: unknown; fineAmount: unknown; payableAmount: unknown; status: string;
};

const toCents = (v: unknown) => Math.round(Number(v) * 100);
function parseMoney(text: string, maximum: number) {
  if (!AMOUNT.test(text)) throw new Error("Enter a nonnegative amount with no more than two decimal places.");
  const cents = toCents(text);
  if (!Number.isSafeInteger(cents) || cents > maximum) throw new Error("Adjustment amount exceeds the allowed range.");
  return cents;
}

export async function changeHold(form: FormData): Promise<void> {
  const auth = await requireEmployee(["SUPER_ADMIN"]);
  const id = String(form.get("ledgerId") ?? "").trim();
  const kind = String(form.get("kind") ?? "");
  const text = String(form.get("value") ?? "").trim();
  const reason = String(form.get("reason") ?? "").trim();
  if (!UUID.test(id) || !["AMOUNT", "DISMISS_ADMIN_TIME"].includes(kind)) {
    throw new Error("Invalid hold adjustment request.");
  }
  if (reason.length < 10 || reason.length > 2000) throw new Error("Explain this adjustment in 10–2000 characters.");
  const adjustmentCents = kind === "DISMISS_ADMIN_TIME" ? 0 : parseMoney(text, kind === "AMOUNT" ? 999999999999 : 1000000);
  if (kind !== "AMOUNT" && kind !== "DISMISS_ADMIN_TIME" && adjustmentCents <= 0) throw new Error("Enter a percentage above zero.");

  await prisma.$transaction(async (tx) => {
    const actor = await tx.employeeProfile.findUnique({where:{authUserId: auth.id},select:{id:true,role:true,status:true}});
    if (actor?.role !== "SUPER_ADMIN" || actor.status !== "ACTIVE") throw new Error("Super Admin access required.");

    // Lock the employee first, matching the Pay Team settlement lock ordering.
    const employee = await tx.$queryRaw<Array<{employeeId:string}>>`
      SELECT "employeeId" FROM public."WorkforcePayLedger" WHERE id=${id}::uuid`;
    if (employee.length !== 1) throw new Error("Payroll entry not found.");
    await tx.$queryRaw`SELECT id FROM public."EmployeeProfile" WHERE id=${employee[0].employeeId}::uuid FOR UPDATE`;
    const rows = await tx.$queryRaw<LockedEntry[]>`
      SELECT id,"taskId","employeeId","sourceType","grossAmount","fineAmount","payableAmount",status
      FROM public."WorkforcePayLedger" WHERE id=${id}::uuid FOR UPDATE`;
    const l = rows[0];
    if (!l || l.employeeId !== employee[0].employeeId || l.status !== "PENDING") throw new Error("This entry is no longer adjustable.");
    if (kind === "DISMISS_ADMIN_TIME" && l.sourceType !== "ADMIN_TIME") throw new Error("Only Admin time can be dismissed here.");
    if (kind !== "AMOUNT" && kind !== "DISMISS_ADMIN_TIME" && l.sourceType === "ADMIN_TIME") throw new Error("Use a direct amount correction for Admin time.");

    if (l.taskId) {
      const eligible = await tx.$queryRaw<Array<{ok:boolean}>>`
        SELECT (status='COMPLETED' AND "clientActionAt" IS NOT NULL) AS ok
        FROM public."WorkTask" WHERE id=${l.taskId}::uuid`;
      if (!eligible[0]?.ok) throw new Error("The order is not completed; its pending pay cannot be adjusted here.");
    }
    const prior = await tx.$queryRaw<Array<{blocked:boolean}>>`
      SELECT (
        EXISTS (SELECT 1 FROM public."PayTeamAllocation" WHERE "ledgerId"=${id}::uuid)
        OR EXISTS (SELECT 1 FROM public."WorkforcePayDecision" WHERE "ledgerId"=${id}::uuid)
        OR EXISTS (
          SELECT 1 FROM public."WorkforcePayLedger" p
          WHERE p.id<>${id}::uuid AND p.status='PAID'
            AND p."taskId"=${l.taskId}::uuid AND ${l.taskId}::uuid IS NOT NULL
            AND p."employeeId"=${l.employeeId}::uuid AND p."sourceType"=${l.sourceType}
        )
        OR EXISTS (
          SELECT 1 FROM public."PayrollEntry" p WHERE p."taskId"=${l.taskId}::uuid AND ${l.taskId}::uuid IS NOT NULL AND p.status='PAID'
        )
      ) AS blocked`;
    if (prior[0]?.blocked) throw new Error("This order or earnings entry already has a payment or final decision and is locked.");
    const oldGross = toCents(l.grossAmount), oldFine = toCents(l.fineAmount), oldNet = toCents(l.payableAmount);
    if (![oldGross,oldFine,oldNet].every(Number.isSafeInteger)) throw new Error("Existing ledger values are invalid.");
    let newGross = oldGross, newFine = oldFine;
    if (kind === "AMOUNT") newGross = oldFine + adjustmentCents;
    if (kind === "BONUS_PERCENT") newGross = oldGross + Math.round(oldGross * adjustmentCents / 10000);
    if (kind === "FINE_PERCENT") newFine = oldFine + Math.round(oldGross * adjustmentCents / 10000);
    if (kind === "DISMISS_ADMIN_TIME") { newGross = 0; newFine = 0; }
    const newNet = Math.max(0, newGross - newFine);
    if (![newGross,newFine,newNet].every(v => Number.isSafeInteger(v) && v >= 0 && v <= 999999999999)) throw new Error("New amount exceeds the ledger limits.");
    if (oldGross === newGross && oldFine === newFine) throw new Error("No change to save.");
    const decimal = (v:number) => (v / 100).toFixed(2);
    const changed = await tx.$executeRaw`
      UPDATE public."WorkforcePayLedger"
      SET "grossAmount"=${decimal(newGross)}::numeric, "fineAmount"=${decimal(newFine)}::numeric
      WHERE id=${id}::uuid AND status='PENDING'`;
    if (changed !== 1) throw new Error("Payroll entry was settled during this adjustment.");
    await tx.$executeRaw`
      INSERT INTO public."WorkforceHoldAdjustment"
      ("ledgerId","employeeId","taskId","sourceType","oldGross","newGross","oldFine","newFine","oldPayable","newPayable","adjustmentKind","adjustmentValue","reason","createdById")
      VALUES (${id}::uuid,${l.employeeId}::uuid,${l.taskId}::uuid,${l.sourceType},
      ${decimal(oldGross)}::numeric,${decimal(newGross)}::numeric,${decimal(oldFine)}::numeric,${decimal(newFine)}::numeric,
      ${decimal(oldNet)}::numeric,${decimal(newNet)}::numeric,${kind},${decimal(adjustmentCents)}::numeric,${reason},${actor.id}::uuid)`;
    await tx.portalNotification.create({data:{recipientId:l.employeeId,title:kind === "DISMISS_ADMIN_TIME" ? "Admin hours dismissed" : "Pending earnings adjusted",body:`Your unpaid ${l.sourceType.toLowerCase()} entitlement was revised from $${decimal(oldNet)} to $${decimal(newNet)}. Reason: ${reason}`,href:"/portal/earnings"}});
  }, {timeout:20000});
  revalidatePath("/portal/super-admin/on-hold");
  revalidatePath("/portal/super-admin/payroll");
  revalidatePath("/portal/super-admin/payroll/pay-team");
  revalidatePath("/portal/earnings");
  revalidatePath("/portal/notifications");
}

/** Named employee-wide adjustments. These never change an order's ledger amounts. */
export async function addFinalPayoutAdjustment(form: FormData): Promise<void> {
  const user = await requireEmployee(["SUPER_ADMIN"]);
  const employeeId = String(form.get("employeeId") ?? "");
  const payoutDate = String(form.get("payoutDate") ?? "");
  const label = String(form.get("label") ?? "").trim();
  const reason = String(form.get("reason") ?? "").trim();
  const signed = String(form.get("amount") ?? "").trim();
  if (!UUID.test(employeeId) || !/^\d{4}-\d{2}-\d{2}$/.test(payoutDate)) throw new Error("Select a valid employee and payout period.");
  if (label.length < 2 || label.length > 100 || reason.length < 10 || reason.length > 2000) throw new Error("Enter an adjustment name (2–100 characters) and explanation (10–2000 characters).");
  if (!/^[+-]?(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/.test(signed)) throw new Error("Enter a signed amount such as -2500.00 or +180.00.");
  const cents = Math.round(Number(signed) * 100);
  if (!Number.isSafeInteger(cents) || cents === 0) throw new Error("The adjustment must be a non-zero amount.");
  await prisma.$transaction(async tx => {
    const actor = await tx.employeeProfile.findUnique({where:{authUserId:user.id},select:{id:true,role:true,status:true}});
    if (actor?.role !== "SUPER_ADMIN" || actor.status !== "ACTIVE") throw new Error("Super Admin access required.");
    const staff = await tx.$queryRaw<Array<{id:string}>>`SELECT id FROM public."EmployeeProfile" WHERE id=${employeeId}::uuid FOR UPDATE`;
    if (!staff.length) throw new Error("Employee not found.");
    const state = await tx.$queryRaw<Array<{ledgerCount:bigint;settledCount:bigint;total:unknown}>>`
      SELECT count(*)::bigint AS "ledgerCount",
      count(*) FILTER (WHERE status='PAID' OR EXISTS (SELECT 1 FROM public."PayTeamAllocation" a WHERE a."ledgerId"=l.id))::bigint AS "settledCount",
      coalesce(sum(l."payableAmount") FILTER (WHERE l.status='PENDING' AND
      (l."taskId" IS NULL OR EXISTS(SELECT 1 FROM public."WorkTask" t WHERE t.id=l."taskId" AND t.status='COMPLETED' AND t."clientActionAt" IS NOT NULL))
      AND NOT EXISTS (SELECT 1 FROM public."WorkforcePayDecision" d WHERE d."ledgerId"=l.id)),0) AS total
      FROM public."WorkforcePayLedger" l WHERE l."employeeId"=${employeeId}::uuid AND l."payoutDate"=${payoutDate}::date`;
    if (!state[0] || state[0].ledgerCount===BigInt(0)) throw new Error("An approved payroll entry is required for this period.");
    if (state[0].settledCount>BigInt(0)) throw new Error("This payout period has already begun settlement and is locked.");
    const prior = await tx.$queryRaw<Array<{amount:unknown}>>`
      SELECT coalesce(sum(amount),0) AS amount FROM public."WorkforcePayoutAdjustment"
      WHERE "employeeId"=${employeeId}::uuid AND "payoutDate"=${payoutDate}::date AND "settlementId" IS NULL`;
    const base = Math.round(Number(state[0].total)*100);
    const existing = Math.round(Number(prior[0]?.amount??0)*100);
    if (![base,existing].every(Number.isSafeInteger) || base + existing + cents < 0) throw new Error("Final payout cannot become negative.");
    await tx.$executeRaw`
      INSERT INTO public."WorkforcePayoutAdjustment" ("employeeId","payoutDate","label","reason","amount","createdById")
      VALUES (${employeeId}::uuid,${payoutDate}::date,${label},${reason},${(cents/100).toFixed(2)}::numeric,${actor.id}::uuid)`;
    await tx.portalNotification.create({data:{recipientId:employeeId,title:"Final payout adjustment recorded",body:`${label}: ${cents>0?"+":""}$${(cents/100).toFixed(2)} for ${payoutDate}. ${reason}`,href:"/portal/earnings"}});
  },{timeout:20000});
  revalidatePath("/portal/super-admin/on-hold");
  revalidatePath("/portal/super-admin/payroll/pay-team");
  revalidatePath("/portal/earnings");
}

/** Order-level bonuses/fines: bonus reserves 30% for Evaryn; workers split the balance 50/30/20. */
export async function distributeOrderAdjustment(form: FormData): Promise<void> {
  const user = await requireEmployee(["SUPER_ADMIN"]);
  const taskId = String(form.get("taskId") ?? "");
  const kind = String(form.get("kind") ?? "");
  const amount = String(form.get("amount") ?? "");
  const reason = String(form.get("reason") ?? "").trim();
  if (!UUID.test(taskId) || !["BONUS","FINE"].includes(kind)) throw new Error("Invalid order adjustment.");
  if (reason.length < 10 || reason.length > 2000) throw new Error("Explain the bonus or fine in 10–2000 characters.");
  const total = parseMoney(amount, 99999999999);
  if (total <= 0) throw new Error("Enter a positive bonus or fine amount.");
  await prisma.$transaction(async tx => {
    const actor = await tx.employeeProfile.findUnique({where:{authUserId:user.id},select:{id:true,role:true,status:true}});
    if (actor?.role !== "SUPER_ADMIN" || actor.status !== "ACTIVE") throw new Error("Super Admin access required.");
    const source = await tx.$queryRaw<Array<{employeeId:string}>>`
      SELECT DISTINCT "employeeId" FROM public."WorkforcePayLedger"
      WHERE "taskId"=${taskId}::uuid AND "sourceType" IN ('TASKER','REVIEWER','QA') ORDER BY "employeeId"`;
    if (!source.length) throw new Error("No approved employees for this order.");
    for (const person of source) {
      await tx.$queryRaw`SELECT id FROM public."EmployeeProfile" WHERE id=${person.employeeId}::uuid FOR UPDATE`;
    }
    const task = await tx.$queryRaw<Array<{eligible:boolean}>>`
      SELECT (status='COMPLETED' AND "clientActionAt" IS NOT NULL) AS eligible
      FROM public."WorkTask" WHERE id=${taskId}::uuid`;
    if (!task[0]?.eligible) throw new Error("Order must be client-completed and approved before applying final payroll adjustments.");
    type Entry = {id:string;employeeId:string;sourceType:string;grossAmount:unknown;fineAmount:unknown;payableAmount:unknown;status:string;blocked:boolean};
    const entries = await tx.$queryRaw<Entry[]>`
      SELECT l.id,l."employeeId",l."sourceType",l."grossAmount",l."fineAmount",l."payableAmount",l.status,
      (EXISTS (SELECT 1 FROM public."PayTeamAllocation" a WHERE a."ledgerId"=l.id)
        OR EXISTS (SELECT 1 FROM public."WorkforcePayDecision" d WHERE d."ledgerId"=l.id)) AS blocked
      FROM public."WorkforcePayLedger" l
      WHERE l."taskId"=${taskId}::uuid AND l."sourceType" IN ('TASKER','REVIEWER','QA')
      ORDER BY l."sourceType",l.id FOR UPDATE OF l`;
    const matched = ["TASKER","REVIEWER","QA"].map(role=>entries.filter(e=>e.sourceType===role));
    if (matched.some(x=>x.length!==1)) throw new Error("Order must have exactly one approved, unpaid Tasker, Reviewer and QA ledger entry. Review duplicate or missing entries manually.");
    if (entries.some(e=>e.status!=="PENDING" || e.blocked)) throw new Error("An order participant has already been paid or settled; the order is locked.");
    const oldPaid = await tx.$queryRaw<Array<{blocked:boolean}>>`
      SELECT EXISTS(SELECT 1 FROM public."PayrollEntry" WHERE "taskId"=${taskId}::uuid AND status='PAID') AS blocked`;
    if (oldPaid[0]?.blocked) throw new Error("A legacy payment exists for this order; adjustments are locked.");
    const adminRetained = kind==="BONUS"?Math.round(total*30/100):0;
    const shareable = total-adminRetained;
    const t = Math.round(shareable*50/100), r = Math.round(shareable*30/100), q = shareable-t-r;
    const shares = [t,r,q];
    const decimal=(c:number)=>(c/100).toFixed(2);
    const distribution: Array<{role:string;employeeId:string;ledgerId:string;amount:string}> = [];
    for (let i=0;i<3;i++) {
      const e = matched[i][0];
      const oldGross=toCents(e.grossAmount),oldFine=toCents(e.fineAmount),oldNet=toCents(e.payableAmount);
      const newGross=kind==="BONUS"?oldGross+shares[i]:oldGross;
      const newFine=kind==="FINE"?oldFine+shares[i]:oldFine;
      if (![oldGross,oldFine,oldNet,newGross,newFine].every(Number.isSafeInteger) || newGross<newFine || newGross>999999999999) throw new Error("A fine exceeds an employee's available unpaid entitlement, or the amount is invalid.");
      const changed=await tx.$executeRaw`
        UPDATE public."WorkforcePayLedger" SET "grossAmount"=${decimal(newGross)}::numeric,"fineAmount"=${decimal(newFine)}::numeric
        WHERE id=${e.id}::uuid AND status='PENDING'`;
      if (changed!==1) throw new Error("Order ledger changed during adjustment.");
      await tx.$executeRaw`
        INSERT INTO public."WorkforceHoldAdjustment"
        ("ledgerId","employeeId","taskId","sourceType","oldGross","newGross","oldFine","newFine","oldPayable","newPayable","adjustmentKind","adjustmentValue","reason","createdById")
        VALUES (${e.id}::uuid,${e.employeeId}::uuid,${taskId}::uuid,${e.sourceType},
          ${decimal(oldGross)}::numeric,${decimal(newGross)}::numeric,${decimal(oldFine)}::numeric,${decimal(newFine)}::numeric,
          ${decimal(oldNet)}::numeric,${decimal(newGross-newFine)}::numeric,
          ${"AMOUNT"},${decimal(shares[i])}::numeric,${reason},${actor.id}::uuid)`;
      distribution.push({role:e.sourceType,employeeId:e.employeeId,ledgerId:e.id,amount:decimal(shares[i])});
      await tx.portalNotification.create({data:{recipientId:e.employeeId,title:kind==="BONUS"?"Order bonus allocated":"Order fine allocated",body:`${kind}: ${decimal(shares[i])} USD for an order. Reason: ${reason}`,href:"/portal/earnings"}});
    }
    await tx.$executeRaw`
      INSERT INTO public."WorkforceOrderDistribution" ("taskId","kind","totalAmount","adminRetained","distribution","reason","createdById")
      VALUES (${taskId}::uuid,${kind},${decimal(total)}::numeric,${decimal(adminRetained)}::numeric,${JSON.stringify(distribution)}::jsonb,${reason},${actor.id}::uuid)`;
  }, {timeout:20000});
  revalidatePath("/portal/super-admin/on-hold");
  revalidatePath("/portal/super-admin/payroll/pay-team");
  revalidatePath("/portal/earnings");
  revalidatePath("/portal/notifications");
}
