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
    WHERE c."eventKey" = ${key} AND (c."grossAmount" - c."fineAmount") > 0
      AND NOT EXISTS (SELECT 1 FROM public."WorkforcePayDecision" d WHERE d."eventKey"=c."eventKey")
      AND NOT EXISTS (SELECT 1 FROM public."WorkforcePayLedger" prior
        WHERE prior."taskId"=c."taskId" AND c."taskId" IS NOT NULL
        AND prior."employeeId"=c."employeeId" AND prior."sourceType"=c."sourceType"
        AND prior.status='PAID')
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
      AND NOT EXISTS(SELECT 1 FROM public."WorkforcePayDecision" d WHERE d."ledgerId"=l.id)
      AND NOT EXISTS(SELECT 1 FROM public."WorkforcePayLedger" prior
        WHERE prior.id<>l.id AND prior.status='PAID' AND prior."taskId"=l."taskId"
          AND l."taskId" IS NOT NULL AND prior."employeeId"=l."employeeId" AND prior."sourceType"=l."sourceType")
      AND l."payoutDate" <= (now() AT TIME ZONE 'Africa/Nairobi')::date
      AND EXISTS (SELECT 1 FROM public."EmployeePaymentMethod" m WHERE m."employeeId"=l."employeeId" AND length(btrim(m.details))>0)
      AND (l."taskId" IS NULL OR EXISTS (
        SELECT 1 FROM public."WorkTask" t
        WHERE t.id=l."taskId" AND t.status='COMPLETED' AND t."clientActionAt" IS NOT NULL))`;
  if (updated !== 1) throw new Error("Not payable: entry may be paid, not yet due, missing payment method, or order no longer completed.");
  revalidatePath("/portal/super-admin/payroll");
  revalidatePath("/portal/earnings");
}

/** Reject a candidate or unpaid approved item with a permanent reason, without changing paid history. */
export async function declineWorkforcePay(form:FormData):Promise<void> {
  const actor=await actorId();
  const eventKey=String(form.get("eventKey")??"");
  const ledgerId=String(form.get("ledgerId")??"");
  const reason=String(form.get("reason")??"").trim();
  if(reason.length<10||reason.length>1000) throw new Error("Provide a reason (10–1000 characters).");
  if(Boolean(eventKey)===Boolean(ledgerId)) throw new Error("Choose one payout target.");
  await prisma.$transaction(async tx=>{
    if(eventKey) {
      if(!/^(TASKER|REVIEWER|QA|ADMIN_TIME):[0-9a-f:-]+$/i.test(eventKey)) throw new Error("Invalid earnings event.");
      const inserted=await tx.$queryRaw<Array<{employeeId:string}>>`
        INSERT INTO public."WorkforcePayDecision" ("eventKey","employeeId","decision","reason","decidedById")
        SELECT c."eventKey",c."employeeId",'DECLINED',${reason},${actor}::uuid
        FROM public."WorkforcePayCandidates" c
        WHERE c."eventKey"=${eventKey}
          AND NOT EXISTS(SELECT 1 FROM public."WorkforcePayLedger" l WHERE l."eventKey"=c."eventKey")
        ON CONFLICT DO NOTHING RETURNING "employeeId"`;
      if(inserted.length!==1) throw new Error("Candidate was already decided or is no longer eligible.");
      await tx.portalNotification.create({data:{recipientId:inserted[0].employeeId,title:"Earnings request declined",body:`Your earnings request was declined. Reason: ${reason}`,href:"/portal/earnings"}});
    } else {
      if(!/^[0-9a-f-]{36}$/i.test(ledgerId)) throw new Error("Invalid ledger ID.");
      const inserted=await tx.$queryRaw<Array<{employeeId:string}>>`
        INSERT INTO public."WorkforcePayDecision" ("ledgerId","employeeId","decision","reason","decidedById")
        SELECT l.id,l."employeeId",'DECLINED',${reason},${actor}::uuid
        FROM public."WorkforcePayLedger" l WHERE l.id=${ledgerId}::uuid AND l.status='PENDING'
          AND NOT EXISTS(SELECT 1 FROM public."WorkforcePayDecision" d WHERE d."ledgerId"=l.id)
        ON CONFLICT DO NOTHING RETURNING "employeeId"`;
      if(inserted.length!==1) throw new Error("Entry is already paid or decided.");
      await tx.portalNotification.create({data:{recipientId:inserted[0].employeeId,title:"Pending payment declined",body:`A pending payment has been declined. Reason: ${reason}`,href:"/portal/earnings"}});
    }
  });
  revalidatePath("/portal/super-admin/payroll");
  revalidatePath("/portal/notifications");
}
