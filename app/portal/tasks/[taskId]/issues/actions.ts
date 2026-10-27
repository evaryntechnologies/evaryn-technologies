"use server";
import {revalidatePath} from "next/cache";
import {requireEmployee} from "@/lib/auth/require-employee";
import {prisma} from "@/lib/db/prisma";

export async function raiseTaskIssue(form:FormData){
 const user=await requireEmployee(["TASKER","REVIEWER","QA"]);
 const profile=await prisma.employeeProfile.findUnique({where:{authUserId:user.id},select:{id:true,role:true,status:true}});
 if(!profile || profile.status!=="ACTIVE")throw new Error("Access denied");
 const taskId=String(form.get("taskId")??"");
 const reason=String(form.get("reason")??"").trim();
 if(reason.length<15||reason.length>5000)throw new Error("Describe the issue in 15–5000 characters.");
 const task=await prisma.workTask.findFirst({where:{id:taskId,assignedToId:profile.id},select:{id:true,title:true}});
 if(!task)throw new Error("Task unavailable");
 const existing=await prisma.taskDispute.findFirst({where:{taskId,raisedById:profile.id,status:"OPEN"},select:{id:true}});
 if(existing)throw new Error("You already have an open issue for this task.");
 await prisma.$transaction(async tx=>{
   await tx.taskDispute.create({data:{taskId,raisedById:profile.id,reason}});
   const recipients=await tx.employeeProfile.findMany({where:{status:"ACTIVE",role:{in:["QA","ADMIN","SUPER_ADMIN"]}},select:{id:true}});
   if(recipients.length)await tx.portalNotification.createMany({data:recipients.map(p=>({recipientId:p.id,title:"Task dispute raised",body:`An employee raised an issue concerning ${task.title}.`,href:"/portal/admin/disputes"}))});
 });
 revalidatePath(`/portal/tasks/${taskId}/issues`);revalidatePath("/portal/admin/disputes");revalidatePath("/portal/notifications");
}
export async function resolveTaskIssue(form:FormData){
 const user=await requireEmployee(["QA","ADMIN","SUPER_ADMIN"]);
 const profile=await prisma.employeeProfile.findUnique({where:{authUserId:user.id},select:{id:true,role:true,status:true}});
 if(!profile||profile.status!=="ACTIVE"||!["QA","ADMIN","SUPER_ADMIN"].includes(profile.role))throw new Error("Access denied");
 const id=String(form.get("id")??"");const resolution=String(form.get("resolution")??"").trim();
 if(resolution.length<10||resolution.length>5000)throw new Error("Resolution must contain 10–5000 characters");
 const d=await prisma.taskDispute.findUnique({where:{id},select:{raisedById:true,taskId:true}});
 if(!d)throw new Error("Issue not found");
 const result=await prisma.taskDispute.updateMany({where:{id,status:"OPEN"},data:{status:"RESOLVED",resolution,resolvedById:profile.id,resolvedAt:new Date()}});
 if(result.count!==1)throw new Error("Issue already resolved");
 await prisma.portalNotification.create({data:{recipientId:d.raisedById,title:"Task dispute resolved",body:resolution,href:`/portal/tasks/${d.taskId}/issues`}});
 revalidatePath("/portal/admin/disputes");revalidatePath("/portal/notifications");revalidatePath(`/portal/tasks/${d.taskId}/issues`);
}
