import "server-only";
import { prisma } from "@/lib/db/prisma";
import { requireEmployee } from "@/lib/auth/require-employee";

export async function taskAccess(taskId: string) {
 const session = await requireEmployee();
 const person = await prisma.employeeProfile.findUnique({where:{authUserId:session.id},select:{id:true,role:true,status:true}});
 if (!person || person.status!=="ACTIVE") throw new Error("Employee account unavailable.");
 const task=await prisma.workTask.findUnique({where:{id:taskId},select:{id:true,assignedToId:true,createdById:true,claimedReviewerId:true,category:true,status:true,submissions:{select:{employeeId:true,reviews:{select:{reviewerId:true}}}}}});
 if (!task) throw new Error("Task not found.");
 const manager=["ADMIN","SUPER_ADMIN"].includes(person.role);
 const contributor=task.assignedToId===person.id || task.createdById===person.id || task.claimedReviewerId===person.id || task.submissions.some(s=>s.employeeId===person.id||s.reviews.some(r=>r.reviewerId===person.id));
 const activeQA=person.role==="QA" && ["PENDING_QA","QA_IN_PROGRESS","DELIVERED_AWAITING_CLIENT"].includes(task.status);
 if (!manager && !contributor && !activeQA) throw new Error("You do not have access to this task.");
 return {person,task,manager};
}
