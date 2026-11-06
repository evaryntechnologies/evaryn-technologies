import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { sendEmail } from "@/lib/evaryn-email/resend";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(header: string | null) {
  const secret = process.env.EVARYN_NOTIFICATION_DELIVERY_SECRET;
  if (!secret || !header?.startsWith("Bearer ")) return false;
  const a = Buffer.from(header.slice(7));
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

type QueueItem = { notificationId: string; recipientId: string; email: string; title: string; body: string; href: string | null };

export async function POST(req: NextRequest) {
  if (!authorized(req.headers.get("authorization"))) return new NextResponse("Unauthorized", { status: 401 });
  const website = process.env.EVARYN_PUBLIC_URL || "https://www.evaryninc.com";
  const base = new URL(website);
  let sent = 0, failed = 0;
  for (let i = 0; i < 30; i++) {
    // Claim one pending notification in its own short transaction; no network call within SQL transaction.
    const claimed = await prisma.$queryRaw<QueueItem[]>(Prisma.sql`
      WITH next AS (
        SELECT q."notificationId" FROM public."EmployeeNotificationEmailQueue" q
        WHERE ((q."status"='PENDING' AND q."nextAttemptAt"<=now())
          OR (q."status"='PROCESSING' AND q."lockedAt"<now()-interval '5 minutes'))
          AND q."attempts"<8
        ORDER BY q."nextAttemptAt" ASC LIMIT 1 FOR UPDATE SKIP LOCKED
      ), claim AS (
        UPDATE public."EmployeeNotificationEmailQueue" q
        SET "status"='PROCESSING', "lockedAt"=now(), "attempts"=q."attempts"+1
        FROM next WHERE q."notificationId"=next."notificationId"
        RETURNING q."notificationId"
      )
      SELECT n."id" AS "notificationId", n."recipientId", e."email",
             n."title", n."body", n."href"
      FROM claim c JOIN public."PortalNotification" n ON n."id"=c."notificationId"
      JOIN public."EmployeeProfile" e ON e."id"=n."recipientId"
    `);
    const item = claimed[0];
    if (!item) break;
    try {
      const raw = item.href || "/portal/notifications";
      const path = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/portal/notifications";
      const link = new URL(path, base).toString();
      const text = `${item.body}\n\nView this notification: ${link}\n\nEvaryn Technologies Limited`;
      if (!item.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item.email)) throw new Error("Registered email is missing or invalid");
      const result = await sendEmail({ to: item.email, subject: `Evaryn notification: ${item.title}`.slice(0, 200), text, idempotencyKey: `employee-notification-${item.notificationId}` });
      await prisma.$executeRaw(Prisma.sql`UPDATE public."EmployeeNotificationEmailQueue"
        SET "status"='SENT', "sentAt"=now(), "lockedAt"=NULL, "providerMessageId"=${result.id}, "lastError"=NULL
        WHERE "notificationId"=${item.notificationId}::uuid AND "status"='PROCESSING'`);
      sent++;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown send failure";
      console.error("Employee notification email failed", { notificationId: item.notificationId, error: message });
      await prisma.$executeRaw(Prisma.sql`UPDATE public."EmployeeNotificationEmailQueue"
        SET "status"=CASE WHEN "attempts">=8 THEN 'FAILED' ELSE 'PENDING' END,
        "lockedAt"=NULL, "nextAttemptAt"=now()+least(3600, 30*power(2,least("attempts",7))) * interval '1 second',
        "lastError"=${message.slice(0, 500)}
        WHERE "notificationId"=${item.notificationId}::uuid AND "status"='PROCESSING'`);
      failed++;
    }
  }
  return NextResponse.json({ ok: true, sent, failed });
}
