"use server";
import { revalidatePath } from "next/cache";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";

export async function claimHubTask(formData:FormData):Promise<void> {
  const user=await requireEmployee(["TASKER","REVIEWER","QA"]);
  const profile=await prisma.employeeProfile.findUnique({where:{authUserId:user.id},select:{id:true,status:true,role:true,eligibleCategories:{select:{category:{select:{name:true,active:true}}}}}});
  if (!profile || !["TASKER","REVIEWER","QA"].includes(profile.role) || profile.status!=="ACTIVE") throw new Error("Active Tasker, Reviewer or QA account required.");
  const id=String(formData.get("taskId")??"");
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Invalid task reference.");
  const task=await prisma.workTask.findFirst({where:{id,status:"OPEN",assignedToId:null},select:{id:true,category:true,submissionHours:true,reviewHours:true,qaHours:true}});
  if(!task || !task.category || !profile.eligibleCategories.some(c=>c.category.active && c.category.name===task.category)) throw new Error("Order unavailable for your assigned categories.");
  const hours=[task.submissionHours,task.reviewHours,task.qaHours];
  if(hours.some(h=>h===null || !Number.isFinite(h) || (h??0)<=0) || !(hours[0]!<=hours[1]! && hours[1]!<=hours[2]!)) throw new Error("This order has invalid deadlines. Contact an administrator.");
  const now=Date.now();
  const result=await prisma.workTask.updateMany({where:{id,status:"OPEN",assignedToId:null},data:{assignedToId:profile.id,status:"ASSIGNED",deadline:new Date(now+hours[0]!*3600000),reviewDeadline:new Date(now+hours[1]!*3600000),qaDeadline:new Date(now+hours[2]!*3600000)}});
  if(result.count!==1) throw new Error("Someone else has already claimed this order.");
  revalidatePath("/portal/task-hub");revalidatePath("/portal/tasker");revalidatePath("/portal/admin/task-management");
}
