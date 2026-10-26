"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";

export async function reviewSubmission(formData: FormData): Promise<void> {
  const user = await requireEmployee(["REVIEWER"]);

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
    redirect("/portal/reviewer/queue?error=invalid");
  }

  const reviewer = await prisma.employeeProfile.findUnique({
    where: { authUserId: user.id },
    select: { id: true, role: true, status: true },
  });

  if (!reviewer || reviewer.role !== "REVIEWER" || reviewer.status !== "ACTIVE") {
    redirect("/portal/unauthorized");
  }

  const outcome = await prisma.$transaction(async (tx) => {
    const submission = await tx.taskSubmission.findUnique({
      where: { id: submissionId },
      select: {
        id: true,
        status: true,
        employeeId: true,
        taskId: true,
        task: { select: { status: true } },
      },
    });

    if (
      !submission ||
      submission.status !== "PENDING_REVIEW" ||
      submission.task.status !== "PENDING_REVIEW" ||
      submission.employeeId === reviewer.id
    ) {
      return false;
    }

    const claimed = await tx.taskSubmission.updateMany({
      where: { id: submissionId, status: "PENDING_REVIEW" },
      data: { status: "REVIEW_IN_PROGRESS" },
    });

    if (claimed.count !== 1) return false;

    await tx.taskReview.create({
      data: {
        submissionId,
        reviewerId: reviewer.id,
        stage: "REVIEWER",
        decision,
        feedback: feedback || null,
      },
    });

    await tx.taskSubmission.update({
      where: { id: submissionId },
      data: {
        status: decision === "APPROVED" ? "PENDING_QA" : "REWORK_REQUIRED",
      },
    });

    await tx.workTask.update({
      where: { id: submission.taskId },
      data: {
        status: decision === "APPROVED" ? "PENDING_QA" : "REWORK_REQUIRED",
      },
    });

    return true;
  });

  if (!outcome) {
    redirect("/portal/reviewer/queue?error=processed");
  }

  revalidatePath("/portal/reviewer/queue");
  revalidatePath("/portal/tasker");
  revalidatePath("/portal/qa");

  redirect("/portal/reviewer/queue?result=saved");
}