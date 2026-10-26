"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";

const roles = ["TASKER", "REVIEWER", "QA", "ADMIN"] as const;

export async function registerEmployee(formData: FormData): Promise<void> {
  const administrator = await requireEmployee(["SUPER_ADMIN"]);

  const adminProfile = await prisma.employeeProfile.findUnique({
    where: { authUserId: administrator.id },
  });

  if (
    !adminProfile ||
    adminProfile.status !== "ACTIVE" ||
    adminProfile.role !== "SUPER_ADMIN"
  ) {
    throw new Error("Administrator account is not active.");
  }

  const authUserId = String(formData.get("authUserId") ?? "").trim();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  const department = String(formData.get("department") ?? "").trim();

  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (
    !uuid.test(authUserId) ||
    fullName.length < 2 ||
    fullName.length > 150 ||
    department.length > 120 ||
    !roles.some((item) => item === role)
  ) {
    redirect("/portal/super-admin/employees?result=invalid");
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase administrative credentials are missing.");
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.admin.getUserById(authUserId);

  if (error || !data.user || !data.user.email) {
    redirect("/portal/super-admin/employees?result=not-found");
  }

  const existing = await prisma.employeeProfile.findUnique({
    where: { authUserId },
  });

  if (existing) {
    redirect("/portal/super-admin/employees?result=exists");
  }

  // Prepare an inactive profile before granting the user a role.
  const profile = await prisma.employeeProfile.create({
    data: {
      authUserId,
      email: data.user.email,
      fullName,
      role,
      department: department || null,
      status: "PENDING",
    },
  });

  const { error: updateError } =
    await supabase.auth.admin.updateUserById(authUserId, {
      app_metadata: {
        ...(data.user.app_metadata ?? {}),
        role,
      },
    });

  if (updateError) {
    // Leave profile inactive if the Auth operation fails.
    console.error("Employee role assignment failed:", updateError.message);
    redirect("/portal/super-admin/employees?result=setup-failed");
  }

  await prisma.employeeProfile.update({
    where: { id: profile.id },
    data: { status: "ACTIVE" },
  });

  revalidatePath("/portal/super-admin/employees");
  revalidatePath("/portal/admin/task-management");

  redirect("/portal/super-admin/employees?result=created");
}