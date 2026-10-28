"use server";
import { revalidatePath } from "next/cache";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";

const slugs = new Set(["technical-writer", "content-writer", "data-annotator", "video-editor"]);
export async function setHiringOpening(form: FormData) {
  const user = await requireEmployee(["ADMIN", "SUPER_ADMIN"]);
  const manager = await prisma.employeeProfile.findUnique({where:{authUserId:user.id},select:{id:true,role:true,status:true}});
  if (!manager || manager.status !== "ACTIVE" || !["ADMIN", "SUPER_ADMIN"].includes(manager.role)) throw new Error("Access denied");
  const slug = String(form.get("slug") ?? "");
  const open = String(form.get("open") ?? "") === "true";
  if (!slugs.has(slug)) throw new Error("Invalid hiring category");
  await prisma.$executeRaw`
    INSERT INTO public."HiringOpening" ("slug","isOpen","updatedById")
    VALUES (${slug},${open},${manager.id}::uuid)
    ON CONFLICT ("slug") DO UPDATE SET "isOpen"=EXCLUDED."isOpen", "updatedById"=EXCLUDED."updatedById", "updatedAt"=now()`;
  revalidatePath("/portal/admin/recruitment");
  revalidatePath("/portal/super-admin/recruitment");
  revalidatePath("/careers");
  revalidatePath("/apply");
}
