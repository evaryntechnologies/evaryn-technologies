import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";

export type AuditInput = {
  actorAuthUserId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, string | number | boolean | null>;
};

export async function writeAuditLog(input: AuditInput): Promise<void> {
  const { actorAuthUserId, action, entityType, entityId, details } = input;

  if (
    !/^[0-9a-f-]{36}$/i.test(actorAuthUserId) ||
    !action.trim() ||
    !entityType.trim()
  ) {
    throw new Error("Invalid audit event.");
  }

  const detailsJson = JSON.stringify(details ?? {});

  await prisma.$executeRaw(
    Prisma.sql`
      INSERT INTO public."AdminAuditLog" (
        "actorAuthUserId",
        "action",
        "entityType",
        "entityId",
        "details"
      )
      VALUES (
        ${actorAuthUserId}::uuid,
        ${action},
        ${entityType},
        ${entityId ?? null},
        ${detailsJson}::jsonb
      )
    `
  );
}