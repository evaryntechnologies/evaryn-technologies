import "server-only";

import { prisma } from "@/lib/db/prisma";
import { getDashboardMetrics, type DashboardMetrics } from "@/lib/tasks/dashboard-metrics";

export type MyOrdersStats = {
  role: string;
  orders: DashboardMetrics & { total: number };
  /** Decisions made about the employee's own submissions. */
  received: { approved: number; revisions: number; total: number };
  /** Decisions the employee made as Reviewer or QA. */
  performed: { reviewerApproved: number; reviewerSentBack: number; qaApproved: number; qaSentBack: number; total: number };
  clientRating: { average: number | null; rated: number };
  adminTime: { hours: number; amount: number; sessions: number } | null;
};

/** Order counts reuse the dashboard rules, so these numbers always match the dashboard. */
export async function getMyOrdersStats(authUserId: string): Promise<MyOrdersStats | null> {
  const metrics = await getDashboardMetrics(authUserId);
  if (!metrics) return null;
  const person = await prisma.employeeProfile.findUnique({ where: { authUserId }, select: { id: true, role: true } });
  if (!person) return null;

  const [received, performed, ratings, sessions] = await Promise.all([
    prisma.taskReview.groupBy({ by: ["decision"], where: { submission: { employeeId: person.id } }, _count: { _all: true } }),
    prisma.taskReview.groupBy({ by: ["stage", "decision"], where: { reviewerId: person.id }, _count: { _all: true } }),
    prisma.workTask.aggregate({
      where: { clientRating: { not: null }, submissions: { some: { employeeId: person.id } } },
      _avg: { clientRating: true }, _count: { _all: true },
    }),
    person.role === "ADMIN"
      ? prisma.$queryRaw<{ activeSeconds: number; rateHourly: unknown }[]>`SELECT "activeSeconds","rateHourly" FROM public."AdminTimeSession" WHERE "employeeId"=${person.id}::uuid`.catch(() => [])
      : Promise.resolve(null),
  ]);

  const n = (rows: { decision: string; stage?: string; _count: { _all: number } }[], f: (r: { decision: string; stage?: string }) => boolean) =>
    rows.filter(f).reduce((t, r) => t + r._count._all, 0);
  const approved = n(received, (r) => r.decision === "APPROVED");
  const revisions = n(received, (r) => r.decision === "REWORK_REQUIRED");
  const rb = n(performed, (r) => r.stage !== "QA" && r.decision === "APPROVED");
  const rr = n(performed, (r) => r.stage !== "QA" && r.decision !== "APPROVED");
  const qb = n(performed, (r) => r.stage === "QA" && r.decision === "APPROVED");
  const qr = n(performed, (r) => r.stage === "QA" && r.decision !== "APPROVED");

  return {
    role: person.role,
    orders: { ...metrics, total: metrics.progress + metrics.revision + metrics.completed + metrics.cancelled },
    received: { approved, revisions, total: approved + revisions },
    performed: { reviewerApproved: rb, reviewerSentBack: rr, qaApproved: qb, qaSentBack: qr, total: rb + rr + qb + qr },
    clientRating: { average: ratings._avg.clientRating == null ? null : Number(ratings._avg.clientRating), rated: ratings._count._all },
    adminTime: sessions ? { hours: sessions.reduce((t, s) => t + s.activeSeconds / 3600, 0), amount: sessions.reduce((t, s) => t + (s.activeSeconds / 3600) * Number(s.rateHourly), 0), sessions: sessions.length } : null,
  };
}
