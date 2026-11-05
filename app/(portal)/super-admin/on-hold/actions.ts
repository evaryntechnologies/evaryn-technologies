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
  if (!UUID.test(id) || !["AMOUNT", "BONUS_PERCENT", "FINE_PERCENT", "DISMISS_ADMIN_TIME"].includes(kind)) {
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
