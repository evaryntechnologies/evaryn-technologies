"use server";

import { randomBytes } from "node:crypto";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";

export type CreateEmployeeState = {
  error: string;
  employeeId: string;
  temporaryPassword: string;
};

export const initialEmployeeState: CreateEmployeeState = {
  error: "",
  employeeId: "",
  temporaryPassword: "",
};

const allowedRoles = ["TASKER", "REVIEWER", "QA", "ADMIN"];

async function createEmployeeInner(
  _previous: CreateEmployeeState,
  formData: FormData
): Promise<CreateEmployeeState> {
  const admin = await requireEmployee(["SUPER_ADMIN"]);

  const adminProfile = await prisma.employeeProfile.findUnique({
    where: { authUserId: admin.id },
    select: { role: true, status: true },
  });

  if (
    !adminProfile ||
    adminProfile.role !== "SUPER_ADMIN" ||
    adminProfile.status !== "ACTIVE"
  ) {
    return { ...initialEmployeeState, error: "Access denied." };
  }

  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim().toLowerCase();
  const role = String(formData.get("role") ?? "");
  const department = String(formData.get("department") ?? "").trim();
  const emailVerified = formData.get("emailVerified") === "yes";

  if (
    fullName.length < 2 ||
    fullName.length > 150 ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !allowedRoles.includes(role) ||
    department.length > 120
  ) {
    return { ...initialEmployeeState, error: "Please check the employee details." };
  }

  if (!emailVerified) {
    return {
      ...initialEmployeeState,
      error: "Confirm that you have verified the employee's email address.",
    };
  }

  if (await prisma.employeeProfile.findUnique({ where: { email } })) {
    return { ...initialEmployeeState, error: "This email already has an employee profile." };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return { ...initialEmployeeState, error: "Admin authentication is not configured." };
  }

  const supabase = createAdminClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const temporaryPassword = randomBytes(24).toString("base64url");

  // Email is marked confirmed only after the Super Admin attests
  // that the address belongs to the employee.
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: { full_name: fullName },
    app_metadata: { must_change_password: true },
  });

  if (error || !data.user) {
    return {
      ...initialEmployeeState,
      error: "Could not create the account. The email may already exist.",
    };
  }

  const userId = data.user.id;

  try {
    await prisma.employeeProfile.create({
      data: {
        authUserId: userId,
        fullName,
        email,
        role,
        department: department || null,
        status: "PENDING",
      },
    });

    const { error: roleError } =
      await supabase.auth.admin.updateUserById(userId, {
        app_metadata: {
          ...(data.user.app_metadata ?? {}),
          role,
          must_change_password: true,
        },
      });

    if (roleError) throw roleError;

    await prisma.employeeProfile.update({
      where: { authUserId: userId },
      data: { status: "ACTIVE" },
    });
  } catch {
    // Leave any partially created account without ACTIVE profile
    // and return no temporary credentials until repaired.
    console.error("Employee provisioning incomplete:", userId);
    return {
      ...initialEmployeeState,
      error: "Account setup incomplete. Review the account before retrying.",
    };
  }

  revalidatePath("/portal/super-admin/employees");
  revalidatePath("/portal/admin/task-management");

  return {
    error: "",
    employeeId: "EV-" + userId.replaceAll("-", "").toUpperCase(),
    temporaryPassword,
  };
}

export async function createEmployee(
  previous: CreateEmployeeState,
  formData: FormData
): Promise<CreateEmployeeState> {
  try {
    return await createEmployeeInner(previous, formData);
  } catch (error) {
    console.error("[Employee Creation] Unexpected failure:", error);

    return {
      error:
        "Employee creation encountered an error. Check the server log before retrying. An account may have been partially created.",
      employeeId: "",
      temporaryPassword: "",
    };
  }
}