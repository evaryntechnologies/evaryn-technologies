"use server";
import {revalidatePath} from "next/cache";
import {requireEmployee} from "@/lib/auth/require-employee";
import {prisma} from "@/lib/db/prisma";
export async function forceReassign(form:FormData){
 const auth=await requireEmployee(["QA","ADMIN","SUPER_ADMIN"]);
 const actor=await prisma.employeeProfile.findUnique({where:{authUserId:auth.id},select:{id:true,role:true,status:true}});
 if(!actor||actor.status!=="ACTIVE"||!["QA","ADMIN","SUPER_ADMIN"].includes(actor.role))throw new Error("Not authorized.");
 const taskId=String(form.get("taskId")??"");const stage=String(form.get("stage")??"");const target=String(form.get("employeeId")??"");const reason=String(form.get("reason")??"").trim();
 if(reason.length<10||reason.length>3000||!["TASKER","REVIEWER"].includes(stage))throw new Error("Invalid reassignment details.");
 if(stage==="REVIEWER"&&actor.role==="QA")throw new Error("Only administrators can reassign review claims.");
 await prisma.$transaction(async tx=>{
  const task=await tx.workTask.findUnique({where:{id:taskId},select:{id:true,category:true,status:true,assignedToId:true,claimedReviewerId:true,submissions:{select:{id:true},take:1}}});
  if(!task)throw new Error("Task not found.");
  if(stage==="TASKER"&&(!task.assignedToId||!["ASSIGNED","CLAIMED","IN_PROGRESS","REWORK_REQUIRED"].includes(task.status)||task.submissions.length))throw new Error("Task already submitted or not eligible for tasker reassignment.");
  if(stage==="REVIEWER"&&(!task.claimedReviewerId||task.status!=="PENDING_REVIEW"))throw new Error("Review has already advanced.");
  let nextId:string|null=null;
  if(target&&target!=="HUB"){
   const employee=await tx.employeeProfile.findUnique({where:{id:target},select:{id:true,status:true,role:true,eligibleCategories:{select:{category:{select:{name:true}}}}}});
   if(!employee||employee.status!=="ACTIVE")throw new Error("New assignee must be active.");
   if(stage==="TASKER"&&!(["TASKER","REVIEWER","QA"].includes(employee.role)&&employee.eligibleCategories.some(x=>x.category.name===task.category)))throw new Error("Employee is not eligible for this category.");
   if(stage==="REVIEWER"&&!(["REVIEWER","QA"].includes(employee.role)))throw new Error("Select an eligible Reviewer or QA.");
   if(stage==="REVIEWER"&&employee.id===task.assignedToId)throw new Error("A tasker cannot review their own work.");
   nextId=employee.id;
  }
  if(stage==="TASKER"){
   const done=await tx.workTask.updateMany({where:{id:taskId,assignedToId:task.assignedToId,status:task.status},data:{assignedToId:nextId,status:nextId?"ASSIGNED":"OPEN",deadline:null,reviewDeadline:null,qaDeadline:null}});
   if(done.count!==1)throw new Error("Task changed during reassignment.");
  }else{
   const done=await tx.workTask.updateMany({where:{id:taskId,claimedReviewerId:task.claimedReviewerId,status:"PENDING_REVIEW"},data:{claimedReviewerId:nextId}});
   if(done.count!==1)throw new Error("Review claim changed during reassignment.");
  }
  const prior=stage==="TASKER"?task.assignedToId:task.claimedReviewerId;
  const recipients=[prior,nextId].filter((id):id is string=>Boolean(id));
  if(recipients.length) await tx.portalNotification.createMany({data:[...new Set(recipients)].map(recipientId=>({recipientId,title:"Task reassignment",body:`Task ${taskId} was force reassigned. Reason: ${reason}`,href:"/portal/task-hub"}))});
  await tx.$executeRaw`INSERT INTO public."TaskForceReassignment" ("taskId","actorId","stage","previousEmployeeId","newEmployeeId","reason") VALUES (${taskId}::uuid,${actor.id}::uuid,${stage},${prior}::uuid,${nextId}::uuid,${reason})`;
 });
 revalidatePath("/portal/task-hub");revalidatePath("/portal/admin/task-management");revalidatePath("/portal/admin/task-summary");
}
