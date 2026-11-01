"use server";
import { revalidatePath } from "next/cache";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";

export async function setHiringOpening(form: FormData) {
  const user = await requireEmployee(["ADMIN", "SUPER_ADMIN"]);
  const manager = await prisma.employeeProfile.findUnique({where:{authUserId:user.id},select:{id:true,role:true,status:true}});
  if (!manager || manager.status !== "ACTIVE" || !["ADMIN", "SUPER_ADMIN"].includes(manager.role)) throw new Error("Access denied");
  const slug = String(form.get("slug") ?? "");
  const open = String(form.get("open") ?? "") === "true";
  const match = /^category-([0-9a-f-]{36})$/i.exec(slug);
  if (!match) throw new Error("Invalid hiring category");
  const category = await prisma.taskCategory.findFirst({ where: { id: match[1], active: true }, select: { id: true } });
  if (!category) throw new Error("This task category is no longer active");
  await prisma.$executeRaw`
    INSERT INTO public."HiringOpening" ("slug","isOpen","updatedById")
    VALUES (${slug},${open},${manager.id}::uuid)
    ON CONFLICT ("slug") DO UPDATE SET "isOpen"=EXCLUDED."isOpen", "updatedById"=EXCLUDED."updatedById", "updatedAt"=now()`;
  revalidatePath("/portal/admin/recruitment");
  revalidatePath("/portal/super-admin/recruitment");
  revalidatePath("/careers");
  revalidatePath("/apply");
}
