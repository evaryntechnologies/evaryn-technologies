import "server-only";

import { prisma } from "@/lib/db/prisma";
import { getEarningsReport, summarize } from "@/lib/earnings/report";

/** Never let one failing widget take down the whole dashboard. */
async function safe<T>(work: PromiseLike<T>, fallback: T): Promise<T> {
  try {
    return await work;
  } catch {
    return fallback;
  }
}

async function profileId(authUserId: string): Promise<string | null> {
  const p = await prisma.employeeProfile.findUnique({
    where: { authUserId },
    select: { id: true },
  });
  return p?.id ?? null;
}

/* ------------------------------------------------------------------ */
/* Money: shared by Tasker, Reviewer and QA                             */
/* ------------------------------------------------------------------ */
export type MyMoney = { available: number; paid: number; lifetime: number };

export async function getMyMoney(): Promise<MyMoney> {
  return safe(
    getEarningsReport().then(({ rows }) => {
      const s = summarize(rows);
      // "Available" = approved by payroll but not yet recorded as paid.
      return { available: s.pending, paid: s.paid, lifetime: s.net };
    }),
    { available: 0, paid: 0, lifetime: 0 }
  );
}

/* ------------------------------------------------------------------ */
/* Tasker                                                               */
/* ------------------------------------------------------------------ */
export type UpcomingTask = {
  id: string;
  title: string;
  publicTaskId: string | null;
  status: string;
  deadline: Date | null;
};

export async function getTaskerExtras(authUserId: string) {
  const id = await profileId(authUserId);
  const upcoming: UpcomingTask[] = id
    ? await safe(
        prisma.workTask.findMany({
          where: {
            assignedToId: id,
            status: { in: ["ASSIGNED", "REWORK_REQUIRED"] },
          },
          select: {
            id: true,
            title: true,
            publicTaskId: true,
            status: true,
            deadline: true,
          },
          orderBy: [{ deadline: "asc" }, { createdAt: "desc" }],
          take: 4,
        }),
        []
      )
    : [];
  return { upcoming };
}

/* ------------------------------------------------------------------ */
/* Reviewer                                                             */
/* ------------------------------------------------------------------ */
export async function getReviewerExtras(authUserId: string) {
  const id = await profileId(authUserId);
  const [awaiting, inReview, approved, sentBack] = await Promise.all([
    safe(
      prisma.taskSubmission.count({
        where: { status: "PENDING_REVIEW", task: { status: "PENDING_REVIEW" } },
      }),
      0
    ),
    id
      ? safe(
          prisma.workTask.count({
            where: { claimedReviewerId: id, status: "REVIEW_IN_PROGRESS" },
          }),
          0
        )
      : Promise.resolve(0),
    id
      ? safe(
          prisma.taskReview.count({
            where: { reviewerId: id, stage: "REVIEWER", decision: "APPROVED" },
          }),
          0
        )
      : Promise.resolve(0),
    id
      ? safe(
          prisma.taskReview.count({
            where: {
              reviewerId: id,
              stage: "REVIEWER",
              decision: "REWORK_REQUIRED",
            },
          }),
          0
        )
      : Promise.resolve(0),
  ]);
  return { awaiting, inReview, approved, sentBack };
}

/* ------------------------------------------------------------------ */
/* QA                                                                   */
/* ------------------------------------------------------------------ */
export async function getQaExtras(authUserId: string) {
  const id = await profileId(authUserId);
  const [awaiting, inQa, deliveredToClient, passed, sentBack] =
    await Promise.all([
      safe(
        prisma.workTask.count({
          where: {
            status: "PENDING_QA",
            ...(id ? { OR: [{ claimedQaId: null }, { claimedQaId: id }] } : {}),
          },
        }),
        0
      ),
      id
        ? safe(
            prisma.workTask.count({
              where: { claimedQaId: id, status: "QA_IN_PROGRESS" },
            }),
            0
          )
        : Promise.resolve(0),
      safe(
        prisma.workTask.count({ where: { status: "DELIVERED_AWAITING_CLIENT" } }),
        0
      ),
      id
        ? safe(
            prisma.taskReview.count({
              where: { reviewerId: id, stage: "QA", decision: "APPROVED" },
            }),
            0
          )
        : Promise.resolve(0),
      id
        ? safe(
            prisma.taskReview.count({
              where: {
                reviewerId: id,
                stage: "QA",
                decision: "REWORK_REQUIRED",
              },
            }),
            0
          )
        : Promise.resolve(0),
    ]);
  return { awaiting, inQa, deliveredToClient, passed, sentBack };
}

/* ------------------------------------------------------------------ */
/* Admin and Super Admin: organisation-wide                             */
/* ------------------------------------------------------------------ */
export type Pipeline = {
  open: number;
  inProgress: number;
  awaitingReview: number;
  awaitingQa: number;
  revision: number;
  awaitingClient: number;
  completed: number;
  cancelled: number;
};

export async function getPipeline(): Promise<Pipeline> {
  const out: Pipeline = {
    open: 0,
    inProgress: 0,
    awaitingReview: 0,
    awaitingQa: 0,
    revision: 0,
    awaitingClient: 0,
    completed: 0,
    cancelled: 0,
  };
  const rows = await safe(
    prisma.workTask.groupBy({
      by: ["status"],
      where: { status: { notIn: ["DRAFT", "DELETED"] } },
      _count: { _all: true },
    }),
    []
  );
  for (const r of rows) {
    const n = r._count._all;
    switch (r.status) {
      case "OPEN":
        out.open += n;
        break;
      case "PENDING_REVIEW":
        out.awaitingReview += n;
        break;
      case "PENDING_QA":
        out.awaitingQa += n;
        break;
      case "REWORK_REQUIRED":
        out.revision += n;
        break;
      case "DELIVERED_AWAITING_CLIENT":
        out.awaitingClient += n;
        break;
      case "COMPLETED":
        out.completed += n;
        break;
      case "CANCELLED":
      case "CANCELED":
        out.cancelled += n;
        break;
      default:
        out.inProgress += n;
    }
  }
  return out;
}

export type Attention = {
  reassignments: number;
  disputes: number;
  paymentChanges: number;
  applications: number;
  overdue: number;
};

export async function getAttention(): Promise<Attention> {
  const [reassignments, disputes, paymentChanges, applications, overdue] =
    await Promise.all([
      safe(
        prisma.taskReassignmentRequest.count({ where: { status: "PENDING" } }),
        0
      ),
      safe(prisma.taskDispute.count({ where: { status: "OPEN" } }), 0),
      safe(
        prisma
          .$queryRaw<{ n: bigint }[]>`SELECT count(*)::bigint AS n FROM public."PaymentChangeRequest" WHERE "status"='PENDING'`
          .then((r) => Number(r[0]?.n ?? 0)),
        0
      ),
      safe(prisma.jobApplication.count({ where: { status: "NEW" } }), 0),
      safe(
        prisma.workTask.count({
          where: {
            deadline: { lt: new Date() },
            status: { in: ["ASSIGNED", "REWORK_REQUIRED"] },
          },
        }),
        0
      ),
    ]);
  return { reassignments, disputes, paymentChanges, applications, overdue };
}

export type People = {
  total: number;
  tasker: number;
  reviewer: number;
  qa: number;
  admin: number;
  superAdmin: number;
};

export async function getPeople(): Promise<People> {
  const out: People = {
    total: 0,
    tasker: 0,
    reviewer: 0,
    qa: 0,
    admin: 0,
    superAdmin: 0,
  };
  const rows = await safe(
    prisma.employeeProfile.groupBy({
      by: ["role"],
      where: { status: "ACTIVE" },
      _count: { _all: true },
    }),
    []
  );
  for (const r of rows) {
    const n = r._count._all;
    out.total += n;
    if (r.role === "TASKER") out.tasker += n;
    else if (r.role === "REVIEWER") out.reviewer += n;
    else if (r.role === "QA") out.qa += n;
    else if (r.role === "ADMIN") out.admin += n;
    else if (r.role === "SUPER_ADMIN") out.superAdmin += n;
  }
  return out;
}

/** Super Admin payroll position (money is recorded here, never sent automatically). */
export async function getPayrollPosition() {
  const [awaitingApproval, pendingEntries, pendingTotal] = await Promise.all([
    safe(
      prisma
        .$queryRaw<{ n: bigint }[]>`SELECT count(*)::bigint AS n FROM public."WorkforcePayCandidates" WHERE ("grossAmount" - "fineAmount") > 0`
        .then((r) => Number(r[0]?.n ?? 0)),
      0
    ),
    safe(
      prisma
        .$queryRaw<{ n: bigint }[]>`SELECT count(*)::bigint AS n FROM public."WorkforcePayLedger" WHERE status='PENDING'`
        .then((r) => Number(r[0]?.n ?? 0)),
      0
    ),
    safe(
      prisma
        .$queryRaw<{ s: unknown }[]>`SELECT COALESCE(SUM("payableAmount"),0) AS s FROM public."WorkforcePayLedger" WHERE status='PENDING'`
        .then((r) => Number(r[0]?.s ?? 0)),
      0
    ),
  ]);
  return { awaitingApproval, pendingEntries, pendingTotal };
}

export async function getNewInquiries(): Promise<number> {
  const [a, b] = await Promise.all([
    safe(prisma.clientInquiry.count({ where: { status: "NEW" } }), 0),
    safe(prisma.customServiceRequest.count({ where: { status: "NEW" } }), 0),
  ]);
  return a + b;
}

/** Admin only: is the time tracker currently running? */
export async function getAdminClockState(authUserId: string): Promise<boolean> {
  const id = await profileId(authUserId);
  if (!id) return false;
  return safe(
    prisma
      .$queryRaw<{ n: bigint }[]>`SELECT count(*)::bigint AS n FROM public."AdminTimeSession" WHERE "employeeId"=${id}::uuid AND "endedAt" IS NULL`
      .then((r) => Number(r[0]?.n ?? 0) > 0),
    false
  );
}
