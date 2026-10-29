"use server";

import { revalidatePath } from "next/cache";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";

async function actorId(): Promise<string> {
  const auth = await requireEmployee(["SUPER_ADMIN"]);
  const actor = await prisma.employeeProfile.findUnique({
    where: { authUserId: auth.id },
    select: { id: true, role: true, status: true },
  });
  if (!actor || actor.role !== "SUPER_ADMIN" || actor.status !== "ACTIVE") throw new Error("Access denied.");
  return actor.id;
}

export async function approveWorkforcePay(form: FormData): Promise<void> {
  const actor = await actorId();
  const key = String(form.get("eventKey") ?? "");
  if (key.length < 6 || key.length > 160 || !/^(TASKER|REVIEWER|QA|ADMIN_TIME):[0-9a-f:-]+$/i.test(key)) throw new Error("Invalid pay event.");
  // Source values, financial sums and payout date always originate from the database view.
  // A unique eventKey makes concurrent approval idempotent; no client amount is trusted.
  const inserted = await prisma.$executeRaw`
    INSERT INTO public."WorkforcePayLedger"
      ("eventKey","sourceType","taskId","submissionId","reviewId","sessionId","employeeId","eligibleAt","payoutDate","grossAmount","fineAmount","approvedById")
    SELECT c."eventKey", c."sourceType", c."taskId", c."submissionId", c."reviewId", c."sessionId", c."employeeId", c."eligibleAt", c."payoutDate", c."grossAmount", c."fineAmount", ${actor}::uuid
    FROM public."WorkforcePayCandidates" c
    WHERE c."eventKey" = ${key} AND c."grossAmount" > 0
    ON CONFLICT ("eventKey") DO NOTHING`;
  if (inserted !== 1) throw new Error("Entry has already been approved or is no longer eligible.");
  revalidatePath("/portal/super-admin/payroll");
  revalidatePath("/portal/earnings");
}

export async function markWorkforcePaid(form: FormData): Promise<void> {
  const actor = await actorId();
  const id = String(form.get("id") ?? "");
  const ref = String(form.get("reference") ?? "").trim();
  const note = String(form.get("note") ?? "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(id) || ref.length < 3 || ref.length > 150 || note.length > 1000) {
    throw new Error("Valid payment ID and payment reference required.");
  }
  // Record payment only after its payout date and only when payment method is on file.
  const updated = await prisma.$executeRaw`
    UPDATE public."WorkforcePayLedger" l SET
      "status"='PAID',"paidAt"=now(),"paidById"=${actor}::uuid,
      "paymentReference"=${ref},"paymentNote"=${note}
    WHERE l.id=${id}::uuid AND l.status='PENDING'
      AND l."payoutDate" <= (now() AT TIME ZONE 'Africa/Nairobi')::date
      AND EXISTS (SELECT 1 FROM public."EmployeePaymentMethod" m WHERE m."employeeId"=l."employeeId" AND length(btrim(m.details))>0)
      AND (l."taskId" IS NULL OR EXISTS (
        SELECT 1 FROM public."WorkTask" t
        WHERE t.id=l."taskId" AND t.status='COMPLETED' AND t."clientActionAt" IS NOT NULL))`;
  if (updated !== 1) throw new Error("Not payable: entry may be paid, not yet due, missing payment method, or order no longer completed.");
  revalidatePath("/portal/super-admin/payroll");
  revalidatePath("/portal/earnings");
}

// A stateful version returns an actionable message instead of an error page.
export async function approveWorkforcePayWithFeedback(
  _previous: { ok: boolean; message: string },
  form: FormData,
): Promise<{ ok: boolean; message: string }> {
  try {
    await approveWorkforcePay(form);
    return { ok: true, message: "Earnings approved and added to the employee ledger." };
  } catch (error) {
    // Show a user-safe message; internal database details stay on the server.
    console.error("Workforce earnings approval failed", error);
    if (error instanceof Error && /already been approved or is no longer eligible/i.test(error.message)) {
      return { ok: false, message: "This entry is no longer eligible. Refresh the page to see its latest status." };
    }
    return { ok: false, message: "Approval failed. Please refresh the page and try again. If it continues, check the server logs." };
  }
}
