"use server";
import { revalidatePath } from "next/cache";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";
export async function publishDraft(formData:FormData){
 const user=await requireEmployee(["ADMIN","SUPER_ADMIN","QA"]);
 const creator=await prisma.employeeProfile.findUnique({where:{authUserId:user.id},select:{id:true,role:true,status:true}});
 if(!creator||creator.status!=="ACTIVE"||!["ADMIN","SUPER_ADMIN","QA"].includes(creator.role)) throw new Error("Access denied.");
 const taskId=String(formData.get("taskId")??"");
 const result=await prisma.workTask.updateMany({where:{id:taskId,status:"DRAFT",assignedToId:null,...(creator.role==="SUPER_ADMIN"?{}:{createdById:creator.id})},data:{status:"OPEN"}});
 if(result.count!==1) throw new Error("Draft not found or already published.");
 revalidatePath("/portal/admin/task-management");revalidatePath("/portal/task-hub");
}
