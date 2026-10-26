"use server";

import { revalidatePath } from "next/cache";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";

type Result = {
  success: boolean;
  message: string;
};

async function requireActiveAdmin() {
  const user = await requireEmployee(["ADMIN", "SUPER_ADMIN"]);

  const profile = await prisma.employeeProfile.findUnique({
    where: { authUserId: user.id },
    select: { status: true, role: true },
  });

  if (
    !profile ||
    profile.status !== "ACTIVE" ||
    !["ADMIN", "SUPER_ADMIN"].includes(profile.role)
  ) {
    throw new Error("Administrator access is not active.");
  }

  return user;
}

export async function createProject(
  formData: FormData
): Promise<Result> {
  await requireActiveAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(
    formData.get("description") ?? ""
  ).trim();

  if (
    title.length < 3 ||
    title.length > 160 ||
    description.length < 10 ||
    description.length > 10000
  ) {
    return {
      success: false,
      message: "Enter a valid project title and description.",
    };
  }

  await prisma.workProject.create({
    data: {
      title,
      description,
      status: "ACTIVE",
    },
  });

  revalidatePath("/portal/admin/task-management");

  return {
    success: true,
    message: "Project created successfully.",
  };
}

export async function assignTask(
  formData: FormData
): Promise<Result> {
  const administrator = await requireActiveAdmin();

  const projectId = String(formData.get("projectId") ?? "");
  const assignedToId = String(formData.get("assignedToId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(
    formData.get("description") ?? ""
  ).trim();

  const priority = String(formData.get("priority") ?? "NORMAL");
  const deadlineValue = String(formData.get("deadline") ?? "");

  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (
    !uuidPattern.test(projectId) ||
    !uuidPattern.test(assignedToId)
  ) {
    return { success: false, message: "Invalid selection." };
  }

  if (
    title.length < 3 ||
    title.length > 160 ||
    description.length < 10 ||
    description.length > 10000
  ) {
    return {
      success: false,
      message: "Enter a valid task title and description.",
    };
  }

  if (!["LOW", "NORMAL", "HIGH", "URGENT"].includes(priority)) {
    return { success: false, message: "Invalid priority." };
  }

  const deadline = deadlineValue
    ? new Date(deadlineValue + "T23:59:59+03:00")
    : null;

  if (deadlineValue && (!/^\d{4}-\d{2}-\d{2}$/.test(deadlineValue) || !deadline || Number.isNaN(deadline.getTime()))) {
    return { success: false, message: "Invalid deadline." };
  }

  const [creator, assignee, project] = await Promise.all([
    prisma.employeeProfile.findUnique({
      where: { authUserId: administrator.id },
      select: { id: true },
    }),
    prisma.employeeProfile.findUnique({
      where: { id: assignedToId },
      select: { status: true, role: true },
    }),
    prisma.workProject.findUnique({
      where: { id: projectId },
      select: { status: true },
    }),
  ]);

  if (
    !creator ||
    !assignee ||
    assignee.status !== "ACTIVE" ||
    assignee.role !== "TASKER" ||
    !project ||
    project.status !== "ACTIVE"
  ) {
    return {
      success: false,
      message: "The selected project or employee is not eligible.",
    };
  }

  await prisma.workTask.create({
    data: {
      projectId,
      assignedToId,
      createdById: creator.id,
      title,
      description,
      priority,
      status: "ASSIGNED",
      deadline,
    },
  });

  revalidatePath("/portal/admin/task-management");
  revalidatePath("/portal/tasker");

  return {
    success: true,
    message: "Task assigned successfully.",
  };
}