"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";

export async function submitTask(formData: FormData): Promise<void> {
  const user = await requireEmployee(["TASKER","REVIEWER","QA"]);

  const taskId = String(formData.get("taskId") ?? "");
  const content = String(formData.get("content") ?? "").trim();
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuid.test(taskId)) {
    redirect("/portal/tasker");
  }

  const taskUrl = `/portal/tasker/tasks/${taskId}`;

  if (content.length < 20 || content.length > 50000) {
    redirect(`${taskUrl}?error=invalid`);
  }

  const employee = await prisma.employeeProfile.findUnique({
    where: { authUserId: user.id },
    select: { id: true, status: true, role: true },
  });

  if (!employee || employee.status !== "ACTIVE" || !["TASKER","REVIEWER","QA"].includes(employee.role)) {
    redirect("/portal/unauthorized");
  }

  const task = await prisma.workTask.findUnique({
    where: { id: taskId },
    select: { id: true, assignedToId: true, status: true },
  });

  if (!task || task.assignedToId !== employee.id) {
    redirect("/portal/tasker");
  }

  if (!["ASSIGNED", "REWORK_REQUIRED"].includes(task.status)) {
    redirect(`${taskUrl}?error=closed`);
  }

  const outcome = await prisma.$transaction(async (tx) => {
    const changed = await tx.workTask.updateMany({
      where: {
        id: taskId,
        assignedToId: employee.id,
        status: { in: ["ASSIGNED", "REWORK_REQUIRED"] },
      },
      data: { status: "PENDING_REVIEW" },
    });

    if (changed.count !== 1) return false;

    await tx.taskSubmission.create({
      data: {
        taskId,
        employeeId: employee.id,
        content,
        status: "PENDING_REVIEW",
      },
    });

    return true;
  });

  if (!outcome) {
    redirect(`${taskUrl}?error=closed`);
  }

  revalidatePath("/portal/tasker");
  revalidatePath("/portal/reviewer");

  redirect(`${taskUrl}?submitted=1`);
}