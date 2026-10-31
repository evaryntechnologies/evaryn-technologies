import "server-only";
import { prisma } from "@/lib/db/prisma";

/** Queue counts for the signed-in person; not organisation-wide totals. */
export async function getEligibleDashboardQueues(authUserId: string, role: string) {
  const profile = await prisma.employeeProfile.findUnique({
    where: { authUserId }, select: { id: true },
  });
  if (!profile) return { awaitingReview: 0, awaitingQa: 0 };
  const id = profile.id;
  const canReview = ["REVIEWER", "QA", "ADMIN", "SUPER_ADMIN"].includes(role);
  const canQa = ["QA", "ADMIN", "SUPER_ADMIN"].includes(role);
  const disallowed = {
    OR: [
      { assignedToId: id },
      { submissions: { some: { employeeId: id } } },
    ],
  };
  const [review, qa] = await Promise.all([
    canReview ? prisma.taskSubmission.count({ where: {
      status: "PENDING_REVIEW", task: {
        status: "PENDING_REVIEW",
        NOT: disallowed,
        OR: [{ claimedReviewerId: null }, { claimedReviewerId: id }],
      },
      employeeId: { not: id },
      reviews: { none: { reviewerId: id } },
    } }) : Promise.resolve(0),
    canQa ? prisma.taskSubmission.count({ where: {
      status: "PENDING_QA", task: {
        status: "PENDING_QA", NOT: disallowed,
        OR: [{ claimedQaId: null }, { claimedQaId: id }],
      },
      employeeId: { not: id },
      reviews: { none: { reviewerId: id } },
    } }) : Promise.resolve(0),
  ]);
  return { awaitingReview: review, awaitingQa: qa };
}
