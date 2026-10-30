import "server-only";

import { prisma } from "@/lib/db/prisma";
import { statusTab } from "@/lib/tasks/work-tabs";

export type DashboardMetrics = {
  completed: number;
  cancelled: number;
  progress: number;
  revision: number;
  available: number;
};

const empty: DashboardMetrics = {
  completed: 0,
  cancelled: 0,
  progress: 0,
  revision: 0,
  available: 0,
};

/**
 * Account metrics for the employee dashboard.
 *
 * The order counts deliberately reuse the same rules as the "All My Orders"
 * pages (see tasker/my-tasks and my-work) and the same `statusTab` mapping,
 * so a number on the dashboard always equals the count on its matching tab.
 * The "available" count mirrors the Task Hub query.
 */
export async function getDashboardMetrics(
  authUserId: string
): Promise<DashboardMetrics | null> {
  const person = await prisma.employeeProfile.findUnique({
    where: { authUserId },
    select: {
      id: true,
      role: true,
      status: true,
      eligibleCategories: {
        select: { category: { select: { name: true, active: true } } },
      },
    },
  });

  if (!person || person.status !== "ACTIVE") return null;

  const manager = person.role === "ADMIN" || person.role === "SUPER_ADMIN";
  const allowed = person.eligibleCategories
    .filter((x) => x.category.active)
    .map((x) => x.category.name);

  const availablePromise = prisma.workTask.count({
    where: {
      status: "OPEN",
      assignedToId: null,
      ...(manager ? {} : { category: { in: allowed } }),
    },
  });

  const metrics: DashboardMetrics = { ...empty };

  if (person.role === "TASKER") {
    // Same ownership rule as /portal/tasker/my-tasks
    const [grouped, available] = await Promise.all([
      prisma.workTask.groupBy({
        by: ["status"],
        where: {
          OR: [
            { assignedToId: person.id },
            { submissions: { some: { employeeId: person.id } } },
          ],
        },
        _count: { _all: true },
      }),
      availablePromise,
    ]);

    for (const row of grouped) {
      metrics[statusTab(row.status)] += row._count._all;
    }
    metrics.available = available;
    return metrics;
  }

  // REVIEWER / QA / ADMIN / SUPER_ADMIN: same rule as /portal/my-work, where
  // work is labelled by the level it was performed at (Tasker, Reviewer, QA).
  const [tasks, reviews, available] = await Promise.all([
    prisma.workTask.findMany({
      where: {
        OR: [
          { assignedToId: person.id },
          { claimedReviewerId: person.id },
          {
            submissions: {
              some: {
                OR: [
                  { employeeId: person.id },
                  { reviews: { some: { reviewerId: person.id } } },
                ],
              },
            },
          },
        ],
      },
      select: {
        id: true,
        status: true,
        assignedToId: true,
        claimedReviewerId: true,
        submissions: {
          select: {
            employeeId: true,
            reviews: { select: { reviewerId: true, stage: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 500,
    }),
    prisma.taskReview.findMany({
      where: { reviewerId: person.id },
      select: {
        stage: true,
        submission: { select: { taskId: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
    availablePromise,
  ]);

  const work = new Map<string, string>(); // "taskId:LEVEL" -> status

  for (const t of tasks) {
    if (
      t.assignedToId === person.id ||
      t.submissions.some((s) => s.employeeId === person.id)
    ) {
      work.set(`${t.id}:TASKER`, t.status);
    }
    if (
      t.claimedReviewerId === person.id ||
      t.submissions.some((s) =>
        s.reviews.some(
          (r) => r.reviewerId === person.id && r.stage === "REVIEWER"
        )
      )
    ) {
      work.set(`${t.id}:REVIEWER`, t.status);
    }
    if (
      t.submissions.some((s) =>
        s.reviews.some((r) => r.reviewerId === person.id && r.stage === "QA")
      )
    ) {
      work.set(`${t.id}:QA`, t.status);
    }
  }

  // Keep review history even if a claim was later reassigned.
  const statusById = new Map(tasks.map((t) => [t.id, t.status]));
  for (const r of reviews) {
    const status = statusById.get(r.submission.taskId);
    if (!status) continue;
    const key = `${r.submission.taskId}:${r.stage === "QA" ? "QA" : "REVIEWER"}`;
    if (!work.has(key)) work.set(key, status);
  }

  for (const status of work.values()) {
    metrics[statusTab(status)] += 1;
  }
  metrics.available = available;
  return metrics;
}
