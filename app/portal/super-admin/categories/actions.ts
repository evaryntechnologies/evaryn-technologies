"use server";
import { revalidatePath } from "next/cache";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";

type Result = { ok: boolean; message: string };
async function authorize() {
  const user = await requireEmployee(["SUPER_ADMIN"]);
  const profile = await prisma.employeeProfile.findUnique({where:{authUserId:user.id},select:{role:true,status:true}});
  return profile?.role === "SUPER_ADMIN" && profile.status === "ACTIVE";
}
function refresh() {
  revalidatePath("/portal/super-admin/categories");
  revalidatePath("/portal/admin/task-management");
}
export async function manageCategory(data: FormData): Promise<Result> {
  if (!(await authorize())) return {ok:false,message:"Access denied."};
  const operation = String(data.get("operation") ?? "");
  const id = String(data.get("id") ?? "");
  const name = String(data.get("name") ?? "").trim().replace(/\s+/g," ");
  try {
    if (operation === "create") {
      if (name.length < 2 || name.length > 80) return {ok:false,message:"Category name must be 2–80 characters."};
      await prisma.taskCategory.create({data:{name}});
    } else {
      const category = await prisma.taskCategory.findUnique({where:{id}});
      if (!category) return {ok:false,message:"Category not found."};
      if (operation === "rename") {
        if (name.length < 2 || name.length > 80) return {ok:false,message:"Category name must be 2–80 characters."};
        // Rename historical strings together so existing tasks continue to display this category.
        await prisma.$transaction(async tx => {
          await tx.taskCategory.update({where:{id},data:{name}});
          await tx.workTask.updateMany({where:{category:category.name},data:{category:name}});
        });
      } else if (operation === "toggle") {
        await prisma.taskCategory.update({where:{id},data:{active:!category.active}});
      } else if (operation === "delete") {
        const inUse = await prisma.workTask.count({where:{category:category.name}});
        if (inUse) return {ok:false,message:`Category is used by ${inUse} task(s). Deactivate it instead to preserve history.`};
        await prisma.taskCategory.delete({where:{id}});
      } else return {ok:false,message:"Unsupported operation."};
    }
    refresh();
    return {ok:true,message:"Category saved successfully."};
  } catch (error) {
    console.error("Category management failed:",error);
    return {ok:false,message:"Unable to save. Check for duplicate names or database setup."};
  }
}
