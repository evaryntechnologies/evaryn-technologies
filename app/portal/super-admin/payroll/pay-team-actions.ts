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
    if (!Number.isSafeInteger(due)||due<=0) throw new Error("Invalid outstanding balance.");
    const requested=mode==="FULL"?due:Math.round(Number(enteredAmount)*100);
    if (!Number.isSafeInteger(requested)||requested<=0||requested>due) throw new Error("Amount must be above zero and not exceed the employee's payable balance.");
    const batch=await tx.$queryRaw<Array<{id:string}>>`
      INSERT INTO public."PayTeamSettlement" ("employeeId","payoutDate","approvedTotal","paidTotal","reason","paymentReference","paidById")
      VALUES (${employeeId}::uuid,${payoutDate}::date,${(due/100).toFixed(2)}::numeric,${(requested/100).toFixed(2)}::numeric,${mode==="FULL"?null:reason},${reference},${actor.id}::uuid)
      RETURNING id`;
    // Distribute actual funds across entries in order and preserve differences as documented adjustments.
    let remaining=requested;
    for (const row of rows) {
      const cents=Math.min(toCents(row.payableAmount),remaining);
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
    await tx.portalNotification.create({data:{recipientId:employeeId,title:mode==="FULL"?"Payroll payment recorded":"Payroll payment adjusted",body:mode==="FULL"?`A payment of $${(requested/100).toFixed(2)} was recorded for ${payoutDate}. Reference: ${reference}.`:`A payment of $${(requested/100).toFixed(2)} was recorded against $${(due/100).toFixed(2)} for ${payoutDate}. Reason: ${reason}. Reference: ${reference}. Contact administration if you wish to dispute this adjustment.`,href:"/portal/earnings"}});
  }, {timeout:20000});
  revalidatePath("/portal/super-admin/payroll/pay-team");
  revalidatePath("/portal/super-admin/payroll");
  revalidatePath("/portal/earnings");
  revalidatePath("/portal/notifications");
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
    const safe = /^(Invalid payment request|Enter |Nothing payable|Employee has no approved payment method|Not authorized|Amount must|Invalid outstanding balance|Settlement allocation|A payroll entry was updated)/.test(message)
      ? message
      : "Payment could not be recorded. Verify the Pay Team migration and review the server logs.";
    return {status:"error", message:safe};
  }
}
