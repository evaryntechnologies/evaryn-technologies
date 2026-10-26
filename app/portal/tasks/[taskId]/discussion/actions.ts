"use server";
import { revalidatePath } from "next/cache";
import { taskAccess } from "@/lib/tasks/access";
import { prisma } from "@/lib/db/prisma";
export async function sendTaskMessage(data:FormData) {
 const taskId=String(data.get("taskId")??"");
 const body=String(data.get("body")??"").trim();
 if(body.length<2||body.length>5000) throw new Error("Message must be 2 to 5,000 characters.");
 const {person}=await taskAccess(taskId);
 await prisma.taskMessage.create({data:{taskId,senderId:person.id,body}});
 revalidatePath(`/portal/tasks/${taskId}/discussion`);
}
export async function requestTaskReassignment(data:FormData) {
 const taskId=String(data.get("taskId")??"");
 const reason=String(data.get("reason")??"").trim();
 if(reason.length<10||reason.length>3000) throw new Error("Please provide 10–3,000 characters.");
 const {person,task,manager}=await taskAccess(taskId);
 if(manager || task.assignedToId!==person.id || !["ASSIGNED","REWORK_REQUIRED"].includes(task.status)) throw new Error("Only the assigned tasker can request reassignment of this active task.");
 const existing=await prisma.taskReassignmentRequest.findFirst({where:{taskId,employeeId:person.id,status:"PENDING"}});
 if(existing) throw new Error("You already have a pending request for this task.");
 await prisma.taskReassignmentRequest.create({data:{taskId,employeeId:person.id,reason}});
 revalidatePath(`/portal/tasks/${taskId}/discussion`);
 revalidatePath("/portal/admin/reassignments");
}
