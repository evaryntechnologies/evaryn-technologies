"use server";
import { revalidatePath } from "next/cache";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@/generated/prisma/client";
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export async function replyToClient(form:FormData){
 const user=await requireEmployee(["QA","ADMIN","SUPER_ADMIN"]);
 const staff=await prisma.employeeProfile.findUnique({where:{authUserId:user.id},select:{id:true,role:true,status:true}});
 if(!staff||staff.status!=="ACTIVE"||!["QA","ADMIN","SUPER_ADMIN"].includes(staff.role))throw new Error("Access denied");
 const requestId=String(form.get("requestId")??"");const body=String(form.get("message")??"").trim();
 if(!uuid.test(requestId)||!body||body.length>5000)throw new Error("Invalid reply");
 const request=await prisma.clientProjectRequest.findUnique({where:{id:requestId},select:{id:true}});
 if(!request)throw new Error("Order not found");
 await prisma.$executeRaw(Prisma.sql`INSERT INTO public."ClientOrderMessage" ("requestId","senderKind","senderId","body")
 VALUES (${requestId}::uuid,'STAFF',${staff.id}::uuid,${body})`);
 revalidatePath(`/portal/client-messages/${requestId}`);
 revalidatePath(`/client-portal/requests/${requestId}`);
}
