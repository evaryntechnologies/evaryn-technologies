import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

// Invoke using an external scheduler with Authorization: Bearer <CRON_SECRET>.
// This route does not run on a schedule by itself.
export async function GET(request: NextRequest) {
 const secret = process.env.CRON_SECRET;
 if (!secret || secret.length < 24 || request.headers.get("authorization") !== `Bearer ${secret}`) {
   return NextResponse.json({error:"Unauthorized"},{status:401});
 }
 try {
  // One database statement atomically reserves notifications to avoid duplicate alerts.
  // Taskers plus active QA/Admin/Super Admin receive the 3-hour reminder;
  // taskers plus admins receive the 5-hour reminder.
  const rows = await prisma.$queryRaw<Array<{thresholdHours:number; notifications:bigint}>>`
   WITH eligible AS (
     SELECT t.id AS task_id, t.deadline AS deadline_at,
       x.threshold_hours, e.id AS recipient_id, t.title
     FROM public."WorkTask" t
     CROSS JOIN (VALUES (3),(5)) x(threshold_hours)
     JOIN public."EmployeeProfile" e
       ON e.status='ACTIVE'
       AND (e.id=t."assignedToId" OR e.role IN ('ADMIN','SUPER_ADMIN') OR (x.threshold_hours=3 AND e.role='QA'))
     WHERE t."assignedToId" IS NOT NULL
       AND t.status IN ('CLAIMED','ASSIGNED','IN_PROGRESS','REWORK_REQUIRED')
       AND t.deadline IS NOT NULL AND t.deadline > now()
       AND t.deadline <= now()+x.threshold_hours*interval '1 hour'
   ), reserved AS (
     INSERT INTO public."DeadlineReminderDelivery" ("taskId","recipientId","deadlineAt","thresholdHours")
     SELECT task_id, recipient_id, deadline_at, threshold_hours FROM eligible
     ON CONFLICT DO NOTHING
     RETURNING "taskId", "recipientId", "deadlineAt", "thresholdHours"
   ), notifications AS (
     INSERT INTO public."PortalNotification" ("recipientId",title,body,href)
     SELECT r."recipientId", 'Task deadline reminder',
       'Task '||t.title||' is due in less than '||r."thresholdHours"||' hours.',
       '/portal/tasker/tasks/'||t.id::text
     FROM reserved r JOIN public."WorkTask" t ON t.id=r."taskId"
     RETURNING id
   )
   SELECT (SELECT count(*)::integer FROM reserved)::integer AS "thresholdHours",
          count(*)::bigint AS notifications FROM notifications`;
  return NextResponse.json({ok:true, created:Number(rows[0]?.notifications ?? 0)});
 } catch (error) {
  console.error("[Deadline reminders] database operation failed",error);
  return NextResponse.json({error:"Reminder delivery failed"},{status:500});
 }
}
