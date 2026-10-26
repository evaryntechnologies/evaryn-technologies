"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";

export async function qaDecision(formData: FormData): Promise<void> {
  const user = await requireEmployee(["QA"]);

  const submissionId = String(formData.get("submissionId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const feedback = String(formData.get("feedback") ?? "").trim();

  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (
    !uuid.test(submissionId) ||
    !["APPROVED", "REWORK_REQUIRED"].includes(decision) ||
    feedback.length > 5000 ||
    (decision === "REWORK_REQUIRED" && feedback.length < 10)
  ) {
    redirect("/portal/qa/queue?error=invalid");
  }

  const qaEmployee = await prisma.employeeProfile.findUnique({
    where: { authUserId: user.id },
    select: { id: true, role: true, status: true },
  });

  if (
    !qaEmployee ||
    qaEmployee.role !== "QA" ||
    qaEmployee.status !== "ACTIVE"
  ) {
    redirect("/portal/unauthorized");
  }

  const outcome = await prisma.$transaction(async (tx) => {
    const submission = await tx.taskSubmission.findUnique({
      where: { id: submissionId },
      select: {
        id: true,
        taskId: true,
        employeeId: true,
        status: true,
        task: { select: { status: true } },
      },
    });

    if (
      !submission ||
      submission.status !== "PENDING_QA" ||
      submission.task.status !== "PENDING_QA" ||
      submission.employeeId === qaEmployee.id
    ) {
      return false;
    }

    // Claim submission once: only one QA decision can succeed.
    const claimed = await tx.taskSubmission.updateMany({
      where: {
        id: submissionId,
        status: "PENDING_QA",
      },
      data: { status: "QA_IN_PROGRESS" },
    });

    if (claimed.count !== 1) return false;

    // Ensure task is still in the matching state.
    const taskClaimed = await tx.workTask.updateMany({
      where: {
        id: submission.taskId,
        status: "PENDING_QA",
      },
      data: { status: "QA_IN_PROGRESS" },
    });

    if (taskClaimed.count !== 1) {
      throw new Error("Task state changed during QA review.");
    }

    await tx.taskReview.create({
      data: {
        submissionId,
        reviewerId: qaEmployee.id,
        stage: "QA",
        decision,
        feedback: feedback || null,
      },
    });

    const nextStatus =
      decision === "APPROVED" ? "COMPLETED" : "REWORK_REQUIRED";

    await tx.taskSubmission.update({
      where: { id: submissionId },
      data: { status: nextStatus },
    });

    await tx.workTask.update({
      where: { id: submission.taskId },
      data: { status: nextStatus },
    });

    return true;
  });

  if (!outcome) {
    redirect("/portal/qa/queue?error=processed");
  }

  revalidatePath("/portal/qa/queue");
  revalidatePath("/portal/tasker");
  revalidatePath("/portal/reviewer/queue");

  redirect("/portal/qa/queue?result=saved");
}