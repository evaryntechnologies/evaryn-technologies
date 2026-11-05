import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";

export type ClientNotification = {
  eventKey: string;
  title: string;
  body: string;
  href: string;
  createdAt: Date;
  isRead: boolean;
  unreadCount: number;
};

// The client ID always comes from the verified session, never from a request parameter.
// These four feeds cover staff messages, project changes, progress updates and deliveries.
export async function listClientNotifications(clientId: string, limit = 40): Promise<ClientNotification[]> {
  const bounded = Math.min(Math.max(limit, 1), 100);
  return prisma.$queryRaw<ClientNotification[]>(Prisma.sql`
    WITH events AS (
      SELECT ('message:' || m."id"::text) AS "eventKey",
        ('New message · ' || r."title")::text AS "title",
        left(m."body", 220)::text AS "body",
        ('/client-portal/requests/' || r."id"::text)::text AS "href",
        m."createdAt" AS "createdAt"
      FROM public."ClientOrderMessage" m
      JOIN public."ClientProjectRequest" r ON r."id" = m."requestId"
      WHERE r."clientId" = ${clientId}::uuid AND m."senderKind" = 'STAFF'
      UNION ALL
      SELECT ('request:' || r."id"::text || ':' || floor(extract(epoch from r."updatedAt") * 1000)::bigint::text),
        ('Project update · ' || r."title")::text,
        (coalesce(nullif(r."adminNote", ''), 'Your project status is now ' || r."status"::text))::text,
        ('/client-portal/requests/' || r."id"::text)::text,
        r."updatedAt"
      FROM public."ClientProjectRequest" r
      WHERE r."clientId" = ${clientId}::uuid
        AND r."updatedAt" > r."createdAt" + interval '1 second'
      UNION ALL
      SELECT ('progress:' || u."id"::text),
        ('Order progress · ' || t."title")::text,
        left(u."message", 220)::text,
        ('/client-portal/orders')::text,
        u."createdAt"
      FROM public."ClientOrderUpdate" u
      JOIN public."ClientOrderAssignment" a ON a."id" = u."assignmentId"
      JOIN public."WorkTask" t ON t."id" = a."taskId"
      WHERE a."clientId" = ${clientId}::uuid
      UNION ALL
      SELECT ('delivery:' || d."id"::text),
        ('Order delivered · ' || t."title")::text,
        ('A final delivery is ready for your review.')::text,
        ('/client-portal/delivered/awaiting')::text,
        d."publishedAt"
      FROM public."ClientDelivery" d
      JOIN public."WorkTask" t ON t."id" = d."taskId"
      WHERE d."clientId" = ${clientId}::uuid
    )
    SELECT e."eventKey", e."title", e."body", e."href", e."createdAt",
      (seen."eventKey" IS NOT NULL OR e."createdAt" <= coalesce(w."readThrough", '-infinity'::timestamptz)) AS "isRead",
      count(*) FILTER (WHERE seen."eventKey" IS NULL AND e."createdAt" > coalesce(w."readThrough", '-infinity'::timestamptz)) OVER()::int AS "unreadCount"
    FROM events e
    LEFT JOIN public."ClientNotificationRead" seen
      ON seen."clientId" = ${clientId}::uuid AND seen."eventKey" = e."eventKey"
    LEFT JOIN public."ClientNotificationWatermark" w ON w."clientId" = ${clientId}::uuid
    ORDER BY e."createdAt" DESC, e."eventKey" DESC
    LIMIT ${bounded}
  `);
}
