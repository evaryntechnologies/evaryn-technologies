"use server";

import { revalidatePath } from "next/cache";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";

export async function returnPostQAForRevision(form: FormData) {
  const user = await requireEmployee(["ADMIN", "SUPER_ADMIN"]);
  const actor = await prisma.employeeProfile.findUnique({
    where: { authUserId: user.id },
    select: { id: true, role: true, status: true },
  });
  if (!actor || actor.status !== "ACTIVE" || !["ADMIN", "SUPER_ADMIN"].includes(actor.role)) {
    throw new Error("Only an active administrator can review post-QA orders.");
  }

  const taskId = String(form.get("taskId") ?? "");
  const reason = String(form.get("reason") ?? "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(taskId) || reason.length < 10 || reason.length > 5000) {
    throw new Error("Provide an order and a revision reason of 10–5,000 characters.");
  }

  await prisma.$transaction(async (tx) => {
    const task = await tx.workTask.findFirst({
      where: { id: taskId, status: "POST_QA_APPROVED" },
      select: { id: true, assignedToId: true, publicTaskId: true },
    });
    if (!task) throw new Error("This order is no longer awaiting the administrative check.");
    if (!task.assignedToId) throw new Error("An original tasker is required before returning an order to revision.");

    const updated = await tx.workTask.updateMany({
      where: { id: taskId, status: "POST_QA_APPROVED" },
      data: { status: "REWORK_REQUIRED", claimedQaId: null, claimedReviewerId: null },
    });
    if (updated.count !== 1) throw new Error("This order has already been processed.");

    await tx.taskSubmission.updateMany({
      where: { taskId, status: "POST_QA_APPROVED" },
      data: { status: "REWORK_REQUIRED" },
    });
    await tx.portalNotification.create({
      data: {
        recipientId: task.assignedToId,
        title: "Post-QA revision required",
        body: `Order ${task.publicTaskId ?? taskId} was returned directly to you. ${reason}`,
        href: `/portal/tasker/tasks/${taskId}`,
      },
    });
    // The tasker is notified directly. Reviewer and QA are not assigned the rework.
  });
  for (const route of ["/portal/post-qa", "/portal/tasker/my-tasks", "/portal/qa/queue", "/portal/task-hub"]) revalidatePath(route);
}
