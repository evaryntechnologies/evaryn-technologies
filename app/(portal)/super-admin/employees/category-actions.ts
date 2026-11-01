"use server";
import { revalidatePath } from "next/cache";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";
export async function updateEmployeeCategories(form:FormData){
 const user=await requireEmployee(["ADMIN","SUPER_ADMIN"]);
 const admin=await prisma.employeeProfile.findUnique({where:{authUserId:user.id},select:{role:true,status:true}});
 if(!["ADMIN","SUPER_ADMIN"].includes(admin?.role??"") || admin?.status!=="ACTIVE") throw new Error("Not authorized");
 const employeeId=String(form.get("employeeId")??"");
 const employee=await prisma.employeeProfile.findUnique({where:{id:employeeId},select:{role:true}});
 if(!employee || employee.role==="ADMIN" || employee.role==="SUPER_ADMIN") throw new Error("Employee cannot be edited here");
 const ids=[...new Set(form.getAll("categoryIds").map(String))];
 const active=await prisma.taskCategory.count({where:{id:{in:ids},active:true}});
 if(!ids.length || active!==ids.length) throw new Error("Select at least one active category");
 await prisma.$transaction(async tx=>{
   await tx.employeeCategory.deleteMany({where:{employeeId}});
   await tx.employeeCategory.createMany({data:ids.map(categoryId=>({employeeId,categoryId}))});
 });
 revalidatePath("/portal/super-admin/employees");
 revalidatePath("/portal/admin/employees");
 revalidatePath("/portal/admin/task-management");
}
