"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireEmployee } from "@/lib/auth/require-employee";

async function superAdmin() {
  const auth = await requireEmployee(["SUPER_ADMIN"]);
  const actor = await prisma.employeeProfile.findUnique({where:{authUserId:auth.id},select:{id:true,role:true,status:true}});
  if (!actor || actor.role!=="SUPER_ADMIN" || actor.status!=="ACTIVE") throw new Error("Super Admin access is required.");
  return actor.id;
}

export async function adjustClientSettlement(form:FormData) {
  const actor=await superAdmin();
  const taskId=String(form.get("taskId")??"");
  const pctText=String(form.get("percent")??"");
  const newPercent=Number(pctText);
  const ratingText=String(form.get("rating")??"");
  const newRating=Number(ratingText);
  const reason=String(form.get("reason")??"").trim();
  if(!/^[\da-f-]{36}$/i.test(taskId)||!/^\d{1,3}(?:\.\d{1,2})?$/.test(pctText)||!Number.isFinite(newPercent)||newPercent<0||newPercent>100) throw new Error("Enter a valid percentage from 0 to 100.");
  if(!/^[1-5]$/.test(ratingText)||!Number.isInteger(newRating)) throw new Error("Choose a 1–5 rating.");
  if(reason.length<10||reason.length>2000) throw new Error("Provide a reason of 10–2000 characters.");
  await prisma.$transaction(async tx=>{
    // Lock the task to serialize financial changes and prevent overlapping adjustments.
    const rows=await tx.$queryRaw<Array<{id:string;status:string;clientPaidPercent:unknown;clientRating:number|null;totalOrderCost:unknown;assignedToId:string|null}>>`
      SELECT id,status,"clientPaidPercent","clientRating","totalOrderCost","assignedToId"
      FROM public."WorkTask" WHERE id=${taskId}::uuid FOR UPDATE`;
    const task=rows[0];
    if(!task||!["COMPLETED","CANCELED"].includes(task.status)) throw new Error("Only settled completed/canceled orders can be adjusted.");
    // If the order has old unpaid approvals, resolving them must precede a new financial adjustment.
    const unsettled=await tx.$queryRaw<Array<{n:bigint}>>`SELECT COUNT(*)::bigint AS n FROM public."WorkforcePayLedger" WHERE "taskId"=${taskId}::uuid AND status='PENDING'`;
    if(Number(unsettled[0]?.n??0)>0) throw new Error("Resolve pending payroll approvals for this order first.");
    const oldPercent=task.clientPaidPercent===null?(task.status==="COMPLETED"?100:0):Number(task.clientPaidPercent);
    const oldRating=task.clientRating;
    if(oldPercent===newPercent&&oldRating===newRating) throw new Error("No changes to save.");
    const audit=await tx.$queryRaw<Array<{id:string}>>`
      INSERT INTO public."ClientPaymentAdjustment" ("taskId","oldPercent","newPercent","oldRating","newRating","reason","createdById","taskStatusBefore")
      VALUES (${taskId}::uuid,${oldPercent},${newPercent},${oldRating},${newRating},${reason},${actor}::uuid,${task.status}) RETURNING id`;
    const auditId=audit[0].id;
    if(oldPercent!==newPercent){
      // One allocation per unique role/employee, not one for every re-review/reinstatement.
      await tx.$executeRaw`
        WITH allocations AS (
          SELECT 'TASKER'::text AS role,${task.assignedToId}::uuid AS employee,COALESCE(${Number(task.totalOrderCost??0)},0)::numeric AS allocation
          UNION ALL
          SELECT DISTINCT 'REVIEWER',r."reviewerId",1.50::numeric FROM public."TaskReview" r JOIN public."TaskSubmission" s ON s.id=r."submissionId" WHERE s."taskId"=${taskId}::uuid AND r.stage='REVIEWER' AND r."reviewerId"<>s."employeeId"
          UNION ALL
          SELECT DISTINCT 'QA',r."reviewerId",1.00::numeric FROM public."TaskReview" r JOIN public."TaskSubmission" s ON s.id=r."submissionId" WHERE s."taskId"=${taskId}::uuid AND r.stage='QA' AND r."reviewerId"<>s."employeeId"
        )
        INSERT INTO public."ClientPaymentAdjustmentLine" ("adjustmentId","employeeId","sourceType","originalAllocation","deltaAmount")
        SELECT ${auditId}::uuid,employee,role,MAX(allocation),ROUND((MAX(allocation)*(${newPercent}-${oldPercent})/100)::numeric,2)
        FROM allocations WHERE employee IS NOT NULL AND allocation>0
        GROUP BY employee,role HAVING ROUND((MAX(allocation)*(${newPercent}-${oldPercent})/100)::numeric,2)<>0`;
    }
    await tx.$executeRaw`UPDATE public."WorkTask" SET "clientPaidPercent"=${newPercent},"clientRating"=${newRating},"updatedAt"=now() WHERE id=${taskId}::uuid`;
  });
  revalidatePath("/portal/super-admin/payment-adjustments");
  revalidatePath("/portal/super-admin/payroll");
  revalidatePath("/portal/earnings");
}

export async function resolveClientAdjustmentLine(form:FormData){
  const actor=await superAdmin();
  const id=String(form.get("id")??"");
  const outcome=String(form.get("outcome")??"");
  const ref=String(form.get("reference")??"").trim();
  const note=String(form.get("note")??"").trim();
  if(!/^[\da-f-]{36}$/i.test(id)||!["SETTLED","WAIVED"].includes(outcome)||note.length>1000||ref.length>150||(outcome==="SETTLED"&&ref.length<3)) throw new Error("Provide a valid decision and external reference for settlement.");
  const count=await prisma.$executeRaw`
    UPDATE public."ClientPaymentAdjustmentLine" SET status=${outcome},"resolvedById"=${actor}::uuid,"resolvedAt"=now(),reference=${ref||null},note=${note||null}
    WHERE id=${id}::uuid AND status='OPEN'`;
  if(count!==1) throw new Error("Adjustment is already resolved or missing.");
  revalidatePath("/portal/super-admin/payment-adjustments");
}
