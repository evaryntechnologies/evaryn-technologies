import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";

export type PortalRole =
  | "TASKER"
  | "REVIEWER"
  | "QA"
  | "ADMIN"
  | "SUPER_ADMIN";

const ROLES: readonly PortalRole[] = [
  "TASKER",
  "REVIEWER",
  "QA",
  "ADMIN",
  "SUPER_ADMIN",
];

function isPortalRole(value: unknown): value is PortalRole {
  return (
    typeof value === "string" &&
    ROLES.some((role) => role === value)
  );
}

export async function requireEmployee(
  permittedRoles?: readonly PortalRole[]
): Promise<{
  id: string;
  email: string;
  role: PortalRole;
  firstName: string;
}> {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/portal/login");
  }

  const role = user.app_metadata?.role;

  if (!isPortalRole(role)) {
    redirect("/portal/unauthorized");
  }

  const employee = await prisma.employeeProfile.findUnique({
    where: { authUserId: user.id },
    select: {
      email: true,
      fullName: true,
      role: true,
      status: true,
      suspensionUntil: true,
    },
  });

  if (employee?.status === "SUSPENDED" && employee.suspensionUntil && employee.suspensionUntil <= new Date()) {
    await prisma.employeeProfile.updateMany({where:{authUserId:user.id,status:"SUSPENDED",suspensionUntil:{lte:new Date()}},data:{status:"ACTIVE",suspensionUntil:null}});
    employee.status = "ACTIVE";
  }

  if (
    !employee ||
    employee.status !== "ACTIVE" ||
    employee.role !== role
  ) {
    redirect("/portal/unauthorized");
  }

  if (user.app_metadata?.must_change_password === true) {
    redirect("/portal/change-password");
  }

  // Super Admin has access to all role-specific portals.
  if (
    permittedRoles &&
    role !== "SUPER_ADMIN" &&
    !permittedRoles.includes(role)
  ) {
    redirect("/portal/unauthorized");
  }

  return {
    id: user.id,
    email: user.email ?? employee.email,
    role,
    firstName: employee.fullName.trim().split(/\s+/)[0] || 'Colleague',
  };
}