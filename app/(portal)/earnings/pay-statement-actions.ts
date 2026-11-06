"use server";
import {revalidatePath} from "next/cache";
import {requireEmployee} from "@/lib/auth/require-employee";
import {prisma} from "@/lib/db/prisma";
export async function raisePayrollClarification(form:FormData):Promise<void>{
 const user=await requireEmployee();
 const payoutDate=String(form.get("payoutDate")??"");
 const issue=String(form.get("issue")??"").trim();
 if(!/^\d{4}-\d{2}-\d{2}$/.test(payoutDate)||issue.length<10||issue.length>2000)throw new Error("Enter a valid period and a detailed clarification (10–2000 characters)");
 const employee=await prisma.employeeProfile.findUnique({where:{authUserId:user.id},select:{id:true}});
 if(!employee)throw new Error("Employee profile missing");
 await prisma.$transaction(async tx=>{
  const result=await tx.$executeRaw`UPDATE public."WorkforcePayStatement" SET state='DISPUTED',"issueText"=${issue},"issueAt"=now(),resolution=NULL,"resolvedAt"=NULL,"updatedAt"=now()
    WHERE "employeeId"=${employee.id}::uuid AND "payoutDate"=${payoutDate}::date AND state IN ('REVIEW','CLEARED')`;
  if(result!==1)throw new Error("Statement is not open for clarification");
  await tx.$executeRaw`INSERT INTO public."WorkforcePayStatementEvent"("employeeId","payoutDate","eventKind","actorId",details)
    VALUES(${employee.id}::uuid,${payoutDate}::date,'ISSUE_RAISED',${employee.id}::uuid,${issue})`;
  const admins=await tx.employeeProfile.findMany({where:{role:"SUPER_ADMIN",status:"ACTIVE"},select:{id:true}});
  for(const admin of admins){await tx.portalNotification.create({data:{recipientId:admin.id,title:"Employee payroll clarification",body:`${employee.id} raised an issue for ${payoutDate}: ${issue}`,href:"/super-admin/payroll/pay-team"}});}
 });
 revalidatePath("/earnings");revalidatePath("/super-admin/payroll/pay-team");
}
