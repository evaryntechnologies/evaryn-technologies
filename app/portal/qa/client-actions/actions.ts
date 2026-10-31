"use server";
import { prisma } from "@/lib/db/prisma";
import { requireEmployee } from "@/lib/auth/require-employee";
import { saveOrderAttachment, removeOrderAttachment } from "@/lib/tasks/order-attachment";
import { revalidatePath } from "next/cache";

export async function finalizeClientAction(form: FormData) {
  const user = await requireEmployee(["QA", "ADMIN", "SUPER_ADMIN"]);
  const actor = await prisma.employeeProfile.findUnique({where:{authUserId:user.id},select:{id:true,status:true,role:true}});
  if (!actor || actor.status !== "ACTIVE" || !["QA","ADMIN","SUPER_ADMIN"].includes(actor.role)) throw new Error("Unauthorized");
  const id=String(form.get("taskId")??"");
  const action=String(form.get("action")??"");
  const note=String(form.get("note")??"").trim();
  const rawPercent=String(form.get("percentage")??"").trim();
  const percentage=Number(rawPercent);
  const ratingText=String(form.get("rating")??"").trim();
  const rating=Number(ratingText);
  if (!["PAID_FULL","PAID_PARTIAL","CANCELED","REVISION"].includes(action)) throw new Error("Invalid client action.");
  if (note.length>5000 || ((action==="REVISION"||action==="CANCELED") && note.length<10)) throw new Error("A reason of 10–5,000 characters is required.");
  if (action==="PAID_PARTIAL" && (rawPercent==="" || !Number.isFinite(percentage) || percentage<=0 || percentage>=100 || !/^\d+(?:\.\d{1,2})?$/.test(rawPercent))) throw new Error("Enter a partial payment percentage above 0 and below 100 (maximum two decimal places).");
  const paidPercent=action==="PAID_FULL"?100:action==="PAID_PARTIAL"?percentage:0;
  const next=action==="REVISION"?"REWORK_REQUIRED":action==="CANCELED"?"CANCELED":paidPercent>=50?"COMPLETED":"CANCELED";
  if (next==="COMPLETED" && (ratingText==="" || !Number.isInteger(rating) || rating<1 || rating>5)) throw new Error("Completed orders require a 1–5 star rating.");
  const task=await prisma.workTask.findFirst({where:{id,status:"DELIVERED_AWAITING_CLIENT"},select:{id:true,assignedToId:true,publicTaskId:true}});
  if (!task) throw new Error("This order is no longer awaiting client action.");
  if (action==="REVISION" && !task.assignedToId) throw new Error("No Tasker is assigned to receive this revision.");
  let attachment:Awaited<ReturnType<typeof saveOrderAttachment>>=null;
  if (action==="REVISION") attachment=await saveOrderAttachment(form,id,actor.id,false);
  try {
    await prisma.$transaction(async tx=>{
      const updated=await tx.workTask.updateMany({where:{id,status:"DELIVERED_AWAITING_CLIENT"},data:{
        status:next,clientActionAt:action==="REVISION"?null:new Date(),clientPaidPercent:action==="REVISION"?null:paidPercent,
        clientRevisionNote:action==="REVISION"?note:null,
        cancellationReason:next==="CANCELED"?(note || `Client paid ${paidPercent}% of the order value; below 50% threshold.`):null,
        clientRating:next==="COMPLETED"?rating:null,
        claimedReviewerId:action==="REVISION"?null:undefined,
        claimedQaId:action==="REVISION"?null:undefined,
      }});
      if(updated.count!==1) throw new Error("Order already processed; reload the page.");
      if(action==="REVISION"){
        await tx.taskMessage.create({data:{taskId:id,senderId:actor.id,body:`CLIENT REVISION REQUESTED: ${note}${attachment?` (Attachment: ${attachment.fileName})`:""}`,recipientRole:"TASKER"}});
        if(task.assignedToId) await tx.portalNotification.create({data:{recipientId:task.assignedToId,title:"Client revision requested",body:`Order ${task.publicTaskId??id} returned for revision. Open the task to read the client's instructions.`,href:`/portal/tasker/tasks/${id}`}});
      } else if(task.assignedToId && paidPercent>0 && paidPercent<100){
        await tx.portalNotification.create({data:{recipientId:task.assignedToId,title:"Client paid partially",body:`Order ${task.publicTaskId??id}: client paid ${paidPercent}%. Earnings are prorated to this percentage. Outcome: ${next.toLowerCase()}.`,href:`/portal/tasker/my-tasks`}});
      }
    });
  }catch(error){await removeOrderAttachment(attachment);throw error;}
  for(const route of ["/portal/qa/client-actions","/portal/task-hub","/portal/tasker/my-tasks","/portal/super-admin/payroll","/portal/reviewer/queue","/portal/qa/queue"]) revalidatePath(route);
}
