import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";

/**
 * Client order tracking. Reads the new "ClientOrderLink" table (see prisma/client-orders-setup.sql)
 * joined to the existing WorkTask. Raw SQL keeps this independent of the generated Prisma client.
 */

export type Stage = "TASKING" | "REVIEW" | "QA" | "READY" | "DELIVERED" | "COMPLETED" | "CANCELED";

export const STAGES: { key: "TASKING" | "REVIEW" | "QA" | "DELIVERED"; label: string; hint: string }[] = [
  { key: "TASKING", label: "Tasking", hint: "A specialist is producing the work" },
  { key: "REVIEW", label: "Review", hint: "A second specialist is reviewing it" },
  { key: "QA", label: "Quality assurance", hint: "Final check against your criteria" },
  { key: "DELIVERED", label: "Delivered", hint: "Ready for you to review and rate" },
];

export function stageOf(status: string, deliveredAt: Date | null): Stage {
  switch (status) {
    case "PENDING_REVIEW": return "REVIEW";
    case "PENDING_QA":
    case "QA_IN_PROGRESS": return "QA";
    case "DELIVERED_AWAITING_CLIENT": return deliveredAt ? "DELIVERED" : "READY";
    case "COMPLETED": return "COMPLETED";
    case "CANCELED":
    case "CANCELLED": return "CANCELED";
    default: return "TASKING"; // OPEN, ASSIGNED, IN_PROGRESS, REWORK_REQUIRED
  }
}

/** Index (0-3) of the active step in the four-step tracker. READY counts as the end of QA. */
export function stepIndex(stage: Stage): number {
  return stage === "TASKING" ? 0 : stage === "REVIEW" ? 1 : stage === "QA" || stage === "READY" ? 2 : 3;
}

export type ClientOrder = {
  taskId: string;
  publicTaskId: string | null;
  title: string;
  category: string | null;
  status: string;
  stage: Stage;
  inRevision: boolean;
  targetDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deliveredAt: Date | null;
  deliveryNote: string | null;
  clientRating: number | null;
  clientFeedback: string | null;
  ratedAt: Date | null;
};

type Row = {
  taskId: string; publicTaskId: string | null; title: string; category: string | null; status: string;
  qaDeadline: Date | null; createdAt: Date; updatedAt: Date; clientRating: number | null;
  deliveredAt: Date | null; deliveryNote: string | null; clientFeedback: string | null; ratedAt: Date | null;
};

export async function listClientOrders(clientId: string): Promise<ClientOrder[]> {
  const rows = await prisma.$queryRaw<Row[]>(Prisma.sql`
    SELECT t."id" AS "taskId", t."publicTaskId", t."title", t."category", t."status", t."qaDeadline",
           t."createdAt", t."updatedAt", t."clientRating",
           l."deliveredAt", l."deliveryNote", l."clientFeedback", l."ratedAt"
    FROM public."ClientOrderLink" l
    JOIN public."WorkTask" t ON t."id" = l."taskId"
    WHERE l."clientId" = ${clientId}::uuid AND t."status" NOT IN ('DRAFT','DELETED')
    ORDER BY t."updatedAt" DESC
    LIMIT 500`);
  return rows.map((r) => ({
    taskId: r.taskId, publicTaskId: r.publicTaskId, title: r.title, category: r.category, status: r.status,
    stage: stageOf(r.status, r.deliveredAt), inRevision: r.status === "REWORK_REQUIRED",
    targetDate: r.qaDeadline, createdAt: r.createdAt, updatedAt: r.updatedAt,
    deliveredAt: r.deliveredAt, deliveryNote: r.deliveryNote, clientRating: r.clientRating,
    clientFeedback: r.clientFeedback, ratedAt: r.ratedAt,
  }));
}

/** What the client receives: the most recent submission's text for an order delivered to them. */
export async function deliverableFor(taskId: string) {
  const s = await prisma.taskSubmission.findFirst({
    where: { taskId }, orderBy: { submittedAt: "desc" }, select: { content: true, submittedAt: true },
  });
  return s;
}

export function formatDate(d: Date | null | undefined) {
  return d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";
}
