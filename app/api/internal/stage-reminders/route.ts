import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/** Call from a trusted scheduler every 5 minutes with Authorization: Bearer CRON_SECRET. */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 24 || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Work from the database clock. The existing TaskStageReminder unique constraint
    // reserves each (task, stage, recipient, due date, offset) only once.
    // A 5-minute tolerance handles scheduler jitter; missed runs outside that
    // window are intentionally not replayed as misleading historical reminders.
    const result = await prisma.$queryRaw<Array<{ inserted: bigint }>>`
      WITH stages AS (
        SELECT t.id, t.title, 'TASKER'::text AS stage,
               t."assignedToId" AS owner, t.deadline AS due
          FROM public."WorkTask" t
         WHERE t.status IN ('ASSIGNED', 'CLAIMED', 'IN_PROGRESS', 'REWORK_REQUIRED')
        UNION ALL
        SELECT t.id, t.title, 'REVIEWER'::text, t."claimedReviewerId", t."reviewDeadline"
          FROM public."WorkTask" t WHERE t.status = 'PENDING_REVIEW'
        UNION ALL
        SELECT t.id, t.title, 'QA'::text, t."claimedQaId", t."qaDeadline"
          FROM public."WorkTask" t WHERE t.status = 'PENDING_QA'
      ), thresholds AS (
        SELECT s.*, offsets.h AS hours
          FROM stages s
          CROSS JOIN (VALUES (6), (3), (1), (0), (-1), (-3), (-6)) AS offsets(h)
         WHERE s.due IS NOT NULL
           AND (extract(epoch from (s.due - now())) / 3600) <= offsets.h
           AND (extract(epoch from (s.due - now())) / 3600) > offsets.h - (5.0 / 60.0)
      ), recipients AS (
        SELECT DISTINCT th.id, th.stage, th.due, th.hours, e.id AS recipient
          FROM thresholds th
          JOIN public."EmployeeProfile" e
            ON e.status = 'ACTIVE'
           AND (e.id = th.owner OR e.role IN ('QA', 'ADMIN', 'SUPER_ADMIN'))
      ), reserved AS (
        INSERT INTO public."TaskStageReminder" ("taskId", "stage", "recipientId", "dueAt", "offsetHours")
        SELECT id, stage, recipient, due, hours FROM recipients
        ON CONFLICT DO NOTHING
        RETURNING "taskId", "stage", "recipientId", "offsetHours"
      ), sent AS (
        INSERT INTO public."PortalNotification" ("recipientId", title, body, href)
        SELECT r."recipientId", 'Order deadline update',
          r."stage" || ' stage for ' || t.title ||
          CASE
            WHEN r."offsetHours" = 0 THEN ' has reached its deadline.'
            WHEN r."offsetHours" > 0 THEN ' is due in ' || r."offsetHours" || ' hour(s).'
            ELSE ' is overdue by ' || (-r."offsetHours") || ' hour(s).'
          END,
          '/portal/tasks/' || t.id::text || '/discussion'
          FROM reserved r JOIN public."WorkTask" t ON t.id = r."taskId"
        RETURNING id
      )
      SELECT count(*)::bigint AS inserted FROM sent
    `;
    return NextResponse.json({ ok: true, created: Number(result[0]?.inserted ?? 0) });
  } catch (error) {
    console.error("Stage reminders error", error);
    return NextResponse.json({ error: "Scheduler failed" }, { status: 500 });
  }
}
