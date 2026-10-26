"use server";

import { revalidatePath } from "next/cache";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/db/prisma";
import { requireEmployee } from "@/lib/auth/require-employee";

const allowedRoles = new Set(["TASKER", "REVIEWER", "QA", "ADMIN"]);

async function authorizedSuperAdmin() {
  const actor = await requireEmployee(["SUPER_ADMIN"]);
  const profile = await prisma.employeeProfile.findUnique({
    where: { authUserId: actor.id }, select: { id: true, role: true, status: true },
  });
  if (!profile || profile.role !== "SUPER_ADMIN" || profile.status !== "ACTIVE") throw new Error("Forbidden");
  return profile;
}

function adminAuth() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase Admin is not configured");
  return createAdminClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

function refresh() {
  revalidatePath("/portal/super-admin/employees");
  revalidatePath("/portal/admin/employees");
  revalidatePath("/portal/super-admin");
}

export async function changeEmployeeRole(form: FormData): Promise<void> {
  const actor = await authorizedSuperAdmin();
  const id = String(form.get("employeeId") ?? "");
  const role = String(form.get("role") ?? "");
  if (!allowedRoles.has(role)) throw new Error("Unsupported role");
  const employee = await prisma.employeeProfile.findUnique({where:{id}});
  if (!employee || employee.id === actor.id || employee.role === "SUPER_ADMIN" || employee.status === "DELETED") throw new Error("This account cannot be changed");
  const sb = adminAuth();
  const { data, error } = await sb.auth.admin.getUserById(employee.authUserId);
  if (error || !data.user) throw new Error("Auth account not found");
  const former = data.user.app_metadata ?? {};
  const updated = await sb.auth.admin.updateUserById(employee.authUserId, {
    app_metadata: {...former, role},
  });
  if (updated.error) throw new Error("Could not update employee access");
  try {
    await prisma.$transaction(async tx => {
      await tx.employeeProfile.update({where:{id},data:{role}});
      if (role === "ADMIN") await tx.employeeCategory.deleteMany({where:{employeeId:id}});
    });
  } catch (e) {
    // Restore previous Auth role if database update fails; error remains visible in logs.
    const rollback = await sb.auth.admin.updateUserById(employee.authUserId,{app_metadata:former});
    if (rollback.error) console.error("ROLE ROLLBACK FAILED", employee.authUserId, rollback.error.message);
    throw e;
  }
  refresh();
}

export async function changeEmployeeStatus(form: FormData): Promise<void> {
  const actor = await authorizedSuperAdmin();
  const id = String(form.get("employeeId") ?? "");
  const action = String(form.get("action") ?? "");
  const employee = await prisma.employeeProfile.findUnique({where:{id},select:{id:true,role:true,status:true}});
  if (!employee || employee.id === actor.id || employee.role === "SUPER_ADMIN" || employee.status === "DELETED") throw new Error("Protected account");
  if (action === "reinstate") {
    await prisma.employeeProfile.update({where:{id},data:{status:"ACTIVE",suspensionUntil:null}});
  } else if (action === "temporary") {
    const value = String(form.get("until") ?? "");
    const until = new Date(value);
    if (!value || !Number.isFinite(until.getTime()) || until.getTime() <= Date.now()) throw new Error("Choose a future suspension end date");
    await prisma.employeeProfile.update({where:{id},data:{status:"SUSPENDED",suspensionUntil:until}});
  } else if (action === "permanent") {
    await prisma.employeeProfile.update({where:{id},data:{status:"TERMINATED",suspensionUntil:null}});
  } else {throw new Error("Unknown action");}
  refresh();
}

export async function deleteEmployeeAccount(form: FormData): Promise<void> {
  const actor = await authorizedSuperAdmin();
  const id = String(form.get("employeeId") ?? "");
  const confirmation = String(form.get("confirmation") ?? "");
  if (confirmation !== "DELETE") throw new Error("Confirmation required");
  const employee = await prisma.employeeProfile.findUnique({where:{id}});
  if (!employee || employee.id === actor.id || employee.role === "SUPER_ADMIN" || employee.status === "DELETED") throw new Error("Protected account");
  // Preserve task ownership, submissions, reviews and financial audit records.
  // Revoke sign-in by deleting Auth user, archive and anonymize the profile.
  const result = await adminAuth().auth.admin.deleteUser(employee.authUserId);
  if (result.error) throw new Error("Unable to revoke Auth account: " + result.error.message);
  await prisma.$transaction(async tx => {
    await tx.employeeCategory.deleteMany({where:{employeeId:id}});
    await tx.employeeProfile.update({where:{id},data:{
      status:"DELETED", suspensionUntil:null, fullName:"Deleted employee",
      email:`deleted-${id}@invalid.example`, department:null,
    }});
  });
  refresh();
}
