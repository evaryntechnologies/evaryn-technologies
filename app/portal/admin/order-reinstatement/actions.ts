"use server";

import { revalidatePath } from "next/cache";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";

type ActionResult = { success: boolean; message: string };
const isUuid = (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

async function administrator() {
  const user = await requireEmployee(["ADMIN", "SUPER_ADMIN"]);
  const profile = await prisma.employeeProfile.findUnique({where:{authUserId:user.id}, select:{id:true,role:true,status:true}});
  if (!profile || profile.status !== "ACTIVE" || !["ADMIN", "SUPER_ADMIN"].includes(profile.role)) throw new Error("Administrator access required.");
  return profile;
}

function refresh() {
  for (const path of ["/portal/admin/order-reinstatement", "/portal/admin/task-management", "/portal/task-hub", "/portal/tasker", "/portal/qa/client-actions", "/portal/admin/task-history"]) revalidatePath(path);
}

export async function reinstateOrder(formData: FormData): Promise<ActionResult> {
  const admin = await administrator();
  const taskId = String(formData.get("taskId") ?? "");
  const mode = String(formData.get("mode") ?? "");
  const workerId = String(formData.get("workerId") ?? "");
  if (!isUuid(taskId) || !["OPEN", "ASSIGN"].includes(mode) || (mode === "ASSIGN" && !isUuid(workerId))) return {success:false,message:"Invalid order or reinstatement option."};
  const task = await prisma.workTask.findUnique({where:{id:taskId},select:{id:true,status:true,category:true,submissionHours:true,reviewHours:true,qaHours:true}});
  if (!task || !["COMPLETED", "CANCELED"].includes(task.status)) return {success:false,message:"Only completed or canceled orders can be reinstated."};
  if (!task.category) return {success:false,message:"The order must have a valid category before reinstatement."};
  if (mode === "ASSIGN") {
    const worker = await prisma.employeeProfile.findUnique({where:{id:workerId}, select:{role:true,status:true,eligibleCategories:{where:{category:{name:task.category,active:true}},select:{categoryId:true}}}});
    if (!worker || worker.role !== "TASKER" || worker.status !== "ACTIVE" || worker.eligibleCategories.length === 0) return {success:false,message:"Select an active Tasker authorized for this order category."};
  }
  const hours = [task.submissionHours,task.reviewHours,task.qaHours];
  if (mode === "ASSIGN" && (hours.some(h=>h===null || !Number.isFinite(h) || (h??0)<=0) || !(hours[0]!<=hours[1]! && hours[1]!<=hours[2]!))) return {success:false,message:"This order needs valid submission, review and QA durations before direct assignment."};
  const now = new Date();
  const due = (h:number|null) => mode === "ASSIGN" && h ? new Date(now.getTime()+h*3600000) : null;
  const result = await prisma.workTask.updateMany({
    where:{id:taskId,status:{in:["COMPLETED","CANCELED"]}},
    data:{
      status:mode === "OPEN" ? "OPEN" : "ASSIGNED",
      assignedToId:mode === "ASSIGN" ? workerId : null,
      deadline:due(task.submissionHours),reviewDeadline:due(task.reviewHours),qaDeadline:due(task.qaHours),
      claimedReviewerId:null,clientRating:null,clientActionAt:null,
      reinstatedAt:now,reinstatedById:admin.id,reinstatementCount:{increment:1},
    }
  });
  if (result.count !== 1) return {success:false,message:"This order has already changed status. Refresh and retry."};
  refresh();
  return {success:true,message:mode === "OPEN" ? "Order reinstated and published to Task Hub." : "Order reinstated and assigned to the selected Tasker."};
}

export async function closeReinstatedOrder(formData: FormData): Promise<ActionResult> {
  await administrator();
  const taskId = String(formData.get("taskId") ?? "");
  const outcome = String(formData.get("outcome") ?? "");
  if (!isUuid(taskId) || !["COMPLETED", "CANCELED"].includes(outcome)) return {success:false,message:"Invalid closure request."};
  const task = await prisma.workTask.findUnique({where:{id:taskId},select:{status:true,reinstatedAt:true}});
  if (!task || !task.reinstatedAt || ["DRAFT","COMPLETED","CANCELED"].includes(task.status)) return {success:false,message:"Only an active reinstated order can be closed."};
  // This is an administrative decision, not automatic proof of customer payment or new QA approval.
  const result=await prisma.workTask.updateMany({where:{id:taskId,status:task.status,reinstatedAt:task.reinstatedAt},data:{status:outcome,clientActionAt:new Date()}});
  if (result.count!==1) return {success:false,message:"The order changed status. Refresh and retry."};
  refresh();
  return {success:true,message:outcome === "COMPLETED" ? "Reinstated order marked completed by administrator." : "Reinstated order canceled by administrator."};
}
