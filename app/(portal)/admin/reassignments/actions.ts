"use server";
import {requireEmployee} from "@/lib/auth/require-employee";
import {prisma} from "@/lib/db/prisma";
import {revalidatePath} from "next/cache";
export async function resolveReassignment(form:FormData){
 const user=await requireEmployee(["ADMIN","SUPER_ADMIN"]);
 const admin=await prisma.employeeProfile.findUnique({where:{authUserId:user.id}});
 if(!admin||admin.status!=="ACTIVE"||!["ADMIN","SUPER_ADMIN"].includes(admin.role)) throw new Error("Not authorized.");
 const id=String(form.get("requestId")??"");const decision=String(form.get("decision")??"");const note=String(form.get("note")??"").trim();
 if(!["APPROVED","REJECTED"].includes(decision)||note.length>2000) throw new Error("Invalid decision.");
 await prisma.$transaction(async tx=>{
 const r=await tx.taskReassignmentRequest.findUnique({where:{id},include:{task:true}});
 if(!r||r.status!=="PENDING") throw new Error("Request already processed.");
 if(decision==="APPROVED"){
  if(r.task.assignedToId!==r.employeeId||!["ASSIGNED","REWORK_REQUIRED"].includes(r.task.status)) throw new Error("Task is no longer eligible for release.");
  const changed=await tx.workTask.updateMany({where:{id:r.taskId,assignedToId:r.employeeId,status:r.task.status},data:{assignedToId:null,status:"OPEN",deadline:null,reviewDeadline:null,qaDeadline:null}});
  if(changed.count!==1) throw new Error("Task changed before reassignment.");
 }
 await tx.taskReassignmentRequest.update({where:{id},data:{status:decision,adminNote:note||null,resolvedAt:new Date()}});
 });
 revalidatePath("/portal/admin/reassignments");revalidatePath("/portal/task-hub");
}
