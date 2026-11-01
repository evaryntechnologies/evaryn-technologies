import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/** Configure a trusted scheduler every 5 minutes; all times come from DB clock. */
export async function GET(req:NextRequest) {
 const secret=process.env.CRON_SECRET;
 if (!secret || secret.length < 24 || req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({error:"Unauthorized"},{status:401});
 try {
  const result = await prisma.$queryRaw<Array<{inserted:bigint}>>`
   WITH stages AS (
    SELECT t.id, t.title, t.status, 'TASKER'::text AS stage, t."assignedToId" AS owner, t.deadline AS due
      FROM public."WorkTask" t WHERE t.status IN ('ASSIGNED','CLAIMED','IN_PROGRESS','REWORK_REQUIRED')
    UNION ALL
    SELECT t.id,t.title,t.status,'REVIEWER',t."claimedReviewerId",t."reviewDeadline"
      FROM public."WorkTask" t WHERE t.status='PENDING_REVIEW'
    UNION ALL
    SELECT t.id,t.title,t.status,'QA',t."claimedQaId",t."qaDeadline"
      FROM public."WorkTask" t WHERE t.status='PENDING_QA'
   ), ready AS (
    SELECT s.*, o.h AS hours FROM stages s CROSS JOIN (VALUES (24),(12),(3),(1),(0),(-1),(-3),(-12),(-24)) o(h)
    JOIN public."EmployeeProfile" e ON e.id=s.owner AND e.status='ACTIVE'
    WHERE s.owner IS NOT NULL AND s.due IS NOT NULL
      AND (extract(epoch from (s.due-now()))/3600) <= o.h
      AND (extract(epoch from (s.due-now()))/3600) > o.h - (5.0/60.0)
   ), reserved AS (
    INSERT INTO public."TaskStageReminder" ("taskId","stage","recipientId","dueAt","offsetHours")
    SELECT id,stage,owner,due,hours FROM ready
    ON CONFLICT DO NOTHING
    RETURNING "taskId","stage","recipientId","offsetHours"
   ), sent AS (
    INSERT INTO public."PortalNotification" ("recipientId",title,body,href)
    SELECT r."recipientId",'Task deadline reminder',
     r."stage"||' work on '||t.title||CASE WHEN r."offsetHours"=0 THEN ' is due now.' WHEN r."offsetHours">0 THEN ' is due in '||r."offsetHours"||' hour(s).' ELSE ' is overdue by '||(-r."offsetHours")||' hour(s).' END,
     '/portal/tasks/'||t.id::text||'/discussion'
    FROM reserved r JOIN public."WorkTask" t ON t.id=r."taskId"
    RETURNING id
   ) SELECT count(*)::bigint AS inserted FROM sent`;
  return NextResponse.json({ok:true,created:Number(result[0]?.inserted??0)});
 } catch(err){console.error("Stage reminders error",err);return NextResponse.json({error:"Scheduler failed"},{status:500});}
}
