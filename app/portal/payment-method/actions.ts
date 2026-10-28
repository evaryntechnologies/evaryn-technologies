"use server";
import {prisma} from "@/lib/db/prisma";
import {requireEmployee} from "@/lib/auth/require-employee";
import {revalidatePath} from "next/cache";
export async function savePaymentMethod(form:FormData){
 const user=await requireEmployee();
 const p=await prisma.employeeProfile.findUnique({where:{authUserId:user.id},select:{id:true,status:true}});
 if(!p||p.status!=="ACTIVE")throw new Error("Access denied");
 const method=String(form.get("method")??"");const accountName=String(form.get("accountName")??"").trim();const details=String(form.get("details")??"").trim();
 if(!["MPESA","BANK","PAYPAL","PAYONEER","OTHER"].includes(method)||accountName.length<2||accountName.length>150||details.length<4||details.length>500)throw new Error("Check your payment details");
 await prisma.$executeRaw`INSERT INTO public."EmployeePaymentMethod" ("employeeId","method","accountName","details") VALUES (${p.id}::uuid,${method},${accountName},${details}) ON CONFLICT ("employeeId") DO UPDATE SET "method"=EXCLUDED."method","accountName"=EXCLUDED."accountName","details"=EXCLUDED."details","updatedAt"=now()`;
 revalidatePath("/portal/payment-method");
}
