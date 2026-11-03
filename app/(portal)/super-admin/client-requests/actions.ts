"use server";
import {revalidatePath} from "next/cache";
import {requireEmployee} from "@/lib/auth/require-employee";
import {prisma} from "@/lib/db/prisma";
export async function updateClientRequest(form:FormData){
 const user=await requireEmployee(["SUPER_ADMIN"]);
 if(user.role!=="SUPER_ADMIN")throw new Error("Forbidden");
 const id=String(form.get("id")??"");
 const status=String(form.get("status")??"");
 const adminNote=String(form.get("adminNote")??"").trim();
 if(!/^[0-9a-f-]{36}$/i.test(id)||!(["PENDING_REVIEW","IN_DISCUSSION","ACCEPTED","CLOSED","REJECTED"] as string[]).includes(status)||adminNote.length>4000)throw new Error("Invalid submission");
 await prisma.clientProjectRequest.update({where:{id},data:{status:status as "PENDING_REVIEW"|"IN_DISCUSSION"|"ACCEPTED"|"CLOSED"|"REJECTED",adminNote:adminNote||null}});
 revalidatePath("/super-admin/client-requests");
 revalidatePath("/client-portal");
}
