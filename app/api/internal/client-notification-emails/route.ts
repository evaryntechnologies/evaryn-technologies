import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual, createHash } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { sendEmail } from "@/lib/evaryn-email/resend";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(header: string | null) {
  const secret = process.env.EVARYN_NOTIFICATION_DELIVERY_SECRET;
  if (!secret || !header?.startsWith("Bearer ")) return false;
  const actual = Buffer.from(header.slice(7));
  const expected = Buffer.from(secret);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

type Claimed = {
  clientId: string;
  eventKey: string;
  title: string;
  body: string;
  href: string;
  email: string;
};

// Use exactly the four event sources used by lib/client-notifications.ts.
// The activation watermark prevents sending email for existing historical activity.
async function queueNewEvents() {
  return prisma.$executeRaw(Prisma.sql`
    WITH events AS (
      SELECT r."clientId", ('message:' || m."id"::text) AS "eventKey",
        ('New message · ' || r."title")::text AS "title", left(m."body",220)::text AS "body",
        ('/client-portal/requests/' || r."id"::text)::text AS "href", m."createdAt" AS "createdAt"
      FROM public."ClientOrderMessage" m
      JOIN public."ClientProjectRequest" r ON r."id"=m."requestId"
      WHERE m."senderKind"='STAFF'
      UNION ALL
      SELECT r."clientId", ('request:' || r."id"::text || ':' || floor(extract(epoch from r."updatedAt") * 1000)::bigint::text),
        ('Project update · ' || r."title")::text,
        (coalesce(nullif(r."adminNote",''), 'Your project status is now ' || r."status"::text))::text,
        ('/client-portal/requests/' || r."id"::text)::text, r."updatedAt"
      FROM public."ClientProjectRequest" r
      WHERE r."updatedAt" > r."createdAt" + interval '1 second'
      UNION ALL
      SELECT a."clientId", ('progress:' || u."id"::text), ('Order progress · ' || t."title")::text,
        left(u."message",220)::text, '/client-portal/orders'::text, u."createdAt"
      FROM public."ClientOrderUpdate" u
      JOIN public."ClientOrderAssignment" a ON a."id"=u."assignmentId"
      JOIN public."WorkTask" t ON t."id"=a."taskId"
      UNION ALL
      SELECT d."clientId", ('delivery:' || d."id"::text), ('Order delivered · ' || t."title")::text,
        'A final delivery is ready for your review.'::text,
        '/client-portal/delivered/awaiting'::text, d."publishedAt"
      FROM public."ClientDelivery" d
      JOIN public."WorkTask" t ON t."id"=d."taskId"
    )
    INSERT INTO public."ClientNotificationEmailQueue"
      ("clientId", "eventKey", "title", "body", "href", "createdAt")
    SELECT e."clientId", e."eventKey", e."title", e."body", e."href", e."createdAt"
    FROM events e
    CROSS JOIN public."ClientEmailNotificationSettings" settings
    JOIN public."ClientProfile" c ON c."id" = e."clientId"
    WHERE e."createdAt" >= settings."activatedAt"
      AND e."createdAt" <= now()
      AND c."status"::text = 'ACTIVE'
      AND length(trim(c."email")) > 0
    ON CONFLICT ("clientId", "eventKey") DO NOTHING
  `);
}

async function claimOne(): Promise<Claimed | undefined> {
  const items = await prisma.$queryRaw<Claimed[]>(Prisma.sql`
    WITH candidate AS (
      SELECT q."clientId", q."eventKey"
      FROM public."ClientNotificationEmailQueue" q
      WHERE ((q."status"='PENDING' AND q."nextAttemptAt"<=now())
        OR (q."status"='PROCESSING' AND q."lockedAt"<now()-interval '5 minutes'))
        AND q."attempts"<8
      ORDER BY q."nextAttemptAt", q."createdAt"
      LIMIT 1 FOR UPDATE SKIP LOCKED
    ), claim AS (
      UPDATE public."ClientNotificationEmailQueue" q
      SET "status"='PROCESSING', "lockedAt"=now(), "attempts"=q."attempts"+1
      FROM candidate c
      WHERE q."clientId"=c."clientId" AND q."eventKey"=c."eventKey"
      RETURNING q."clientId",q."eventKey",q."title",q."body",q."href"
    )
    SELECT claim.*, c."email" FROM claim
    JOIN public."ClientProfile" c ON c."id"=claim."clientId"
    WHERE c."status"::text='ACTIVE'
  `);
  return items[0];
}

export async function POST(req: NextRequest) {
  if (!authorized(req.headers.get("authorization"))) return new NextResponse("Unauthorized", { status: 401 });
  try {
    const queued = await queueNewEvents();
    let sent = 0, failed = 0;
    const website = new URL(process.env.EVARYN_PUBLIC_URL || "https://www.evaryninc.com");
    for (let i = 0; i < 25; i++) {
      const item = await claimOne();
      if (!item) break;
      try {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item.email)) throw new Error("Client email is missing or invalid");
        const href = item.href.startsWith("/") && !item.href.startsWith("//") ? item.href : "/client-portal/notifications";
        const link = new URL(href, website).toString();
        const result = await sendEmail({
          to: item.email,
          subject: `Evaryn client update: ${item.title}`.slice(0, 200),
          text: `${item.body}\n\nView this update securely in your client portal: ${link}\n\nEvaryn Technologies Limited`,
          idempotencyKey: `client-notification-${createHash("sha256").update(`${item.clientId}:${item.eventKey}`).digest("hex")}`,
        });
        await prisma.$executeRaw(Prisma.sql`
          UPDATE public."ClientNotificationEmailQueue" SET "status"='SENT',"sentAt"=now(),"lockedAt"=NULL,
            "providerMessageId"=${result.id},"lastError"=NULL
          WHERE "clientId"=${item.clientId}::uuid AND "eventKey"=${item.eventKey} AND "status"='PROCESSING'
        `);
        sent++;
      } catch (e) {
        const error = e instanceof Error ? e.message : "Unknown email error";
        console.error("Client notification dispatch failed", { eventKey: item.eventKey, error });
        await prisma.$executeRaw(Prisma.sql`
          UPDATE public."ClientNotificationEmailQueue"
          SET "status"=CASE WHEN "attempts">=8 THEN 'FAILED' ELSE 'PENDING' END,
            "nextAttemptAt"=now()+least(3600, 30*power(2,least("attempts",7))) * interval '1 second',
            "lockedAt"=NULL,"lastError"=${error.slice(0, 500)}
          WHERE "clientId"=${item.clientId}::uuid AND "eventKey"=${item.eventKey} AND "status"='PROCESSING'
        `);
        failed++;
      }
    }
    return NextResponse.json({ ok: true, queued, sent, failed });
  } catch (error) {
    console.error("Client notification email queue error", error);
    return NextResponse.json({ ok: false, error: "Client notification dispatch failed" }, { status: 500 });
  }
}
