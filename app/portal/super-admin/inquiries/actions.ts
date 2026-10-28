"use server";
import {requireEmployee} from "@/lib/auth/require-employee";
import {prisma} from "@/lib/db/prisma";
import {revalidatePath} from "next/cache";
export async function updateInquiry(form:FormData){
 const user=await requireEmployee(["SUPER_ADMIN"]);
 const actor=await prisma.employeeProfile.findUnique({where:{authUserId:user.id},select:{role:true,status:true}});
 if(actor?.role!=="SUPER_ADMIN"||actor.status!=="ACTIVE")throw new Error("Super Admin only");
 const id=String(form.get("id")??""); const kind=String(form.get("kind")??""); const status=String(form.get("status")??"");
 if(!/^[0-9a-f-]{36}$/i.test(id)||!["NEW","IN_DISCUSSION","CLOSED"].includes(status)||!["client","custom"].includes(kind))throw new Error("Invalid inquiry");
 const data={status:status as "NEW"|"IN_DISCUSSION"|"CLOSED"};
 if(kind==="client")await prisma.clientInquiry.update({where:{id},data});
 else await prisma.customServiceRequest.update({where:{id},data});
 revalidatePath("/portal/super-admin/inquiries");
}
