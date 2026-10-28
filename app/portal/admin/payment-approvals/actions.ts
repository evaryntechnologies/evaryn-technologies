"use server";
import {revalidatePath} from "next/cache";
import {requireEmployee} from "@/lib/auth/require-employee";
import {prisma} from "@/lib/db/prisma";
import {canChangePaymentNow} from "@/app/portal/payment-method/payment-utils";
export async function decidePaymentChange(form:FormData){
 const user=await requireEmployee(["ADMIN","SUPER_ADMIN"]);
 const actor=await prisma.employeeProfile.findUnique({where:{authUserId:user.id},select:{id:true,status:true,role:true}});
 if(!actor||actor.status!=="ACTIVE"||!["ADMIN","SUPER_ADMIN"].includes(actor.role))throw new Error("Not authorized.");
 const id=String(form.get("id")??"");const decision=String(form.get("decision")??"");const note=String(form.get("note")??"").trim();
 if(!/^[0-9a-f-]{36}$/i.test(id)||!["APPROVED","REJECTED"].includes(decision)||note.length>2000)throw new Error("Invalid request.");
 if(!canChangePaymentNow())throw new Error("Payment details are locked before the payout date.");
 await prisma.$transaction(async tx=>{
  const rows=await tx.$queryRaw<Array<{id:string;employeeId:string;method:string;accountName:string;details:string}>>`SELECT "id","employeeId","method","accountName","details" FROM public."PaymentChangeRequest" WHERE "id"=${id}::uuid AND "status"='PENDING' FOR UPDATE`;
  const req=rows[0];if(!req)throw new Error("Request already processed.");
  if(decision==="APPROVED")await tx.$executeRaw`INSERT INTO public."EmployeePaymentMethod" ("employeeId","method","accountName","details") VALUES (${req.employeeId}::uuid,${req.method},${req.accountName},${req.details}) ON CONFLICT ("employeeId") DO UPDATE SET "method"=EXCLUDED."method","accountName"=EXCLUDED."accountName","details"=EXCLUDED."details","updatedAt"=now()`;
  await tx.$executeRaw`UPDATE public."PaymentChangeRequest" SET "status"=${decision},"reviewedById"=${actor.id}::uuid,"reviewNote"=${note||null},"reviewedAt"=now() WHERE "id"=${id}::uuid`;
 });
 revalidatePath("/portal/admin/payment-approvals");revalidatePath("/portal/payment-method");
}
