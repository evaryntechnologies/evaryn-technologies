"use server";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";

export async function updateApplication(form: FormData) {
  const user = await requireEmployee(["ADMIN","SUPER_ADMIN"]);
  const actor = await prisma.employeeProfile.findUnique({where:{authUserId:user.id},select:{role:true,status:true}});
  if (!actor || actor.status !== "ACTIVE" || !["ADMIN","SUPER_ADMIN"].includes(actor.role)) throw new Error("Access denied");
  const id = String(form.get("id") ?? "");
  const status = String(form.get("status") ?? "");
  if(!/^[a-f0-9-]{36}$/i.test(id) || !["NEW","SHORTLISTED","REJECTED"].includes(status)) throw new Error("Invalid application update");
  await prisma.jobApplication.update({where:{id},data:{status:status as "NEW"|"SHORTLISTED"|"REJECTED"}});
  revalidatePath("/portal/admin/recruitment");
  revalidatePath("/portal/super-admin/recruitment");
}
