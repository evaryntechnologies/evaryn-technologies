import { Prisma } from "@/generated/prisma/client";

export const cancellationReasons = ["Lateness", "AI-generated content", "No longer needed", "Bad quality", "Plagiarism", "Other reason"] as const;

export function cancellationDetail(reason: string, explanation: string, notes = "") {
  if (!cancellationReasons.includes(reason as typeof cancellationReasons[number])) {
    throw new Error("Choose a valid cancellation reason.");
  }
  if (explanation.length > 3000 || notes.length > 1000) throw new Error("Cancellation notes are too long.");
  return `Cancellation reason: ${reason}.${explanation ? ` Explanation: ${explanation}` : ""}${notes ? ` Additional notes: ${notes}` : ""}`;
}

// All people who actually worked on the order, including past rounds of submissions.
export async function notifyOrderParticipants(tx: Prisma.TransactionClient, taskId: string, title: string, body: string) {
  const [task, submissions] = await Promise.all([
    tx.workTask.findUnique({ where: { id: taskId }, select: { assignedToId: true, publicTaskId: true } }),
    tx.taskSubmission.findMany({ where: { taskId }, select: { employeeId: true, reviews: { select: { reviewerId: true } } } }),
  ]);
  if (!task) return;
  const ids = new Set<string>();
  if (task.assignedToId) ids.add(task.assignedToId);
  for (const submission of submissions) {
    ids.add(submission.employeeId);
    for (const review of submission.reviews) ids.add(review.reviewerId);
  }
  if (ids.size) await tx.portalNotification.createMany({ data: [...ids].map(recipientId => ({
    recipientId, title, body, href: `/portal/tasks/${taskId}/discussion`,
  })) });
}
