"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { ensureClientProfile } from "../../clients/actions";
import { listClientNotifications } from "@/lib/client-notifications";

export async function openClientNotification(formData: FormData) {
  const client = await ensureClientProfile();
  const key = String(formData.get("eventKey") ?? "");
  if (key.length < 3 || key.length > 180) throw new Error("Invalid notification");
  const items = await listClientNotifications(client.id, 100);
  const item = items.find((entry) => entry.eventKey === key);
  if (!item) throw new Error("Notification not found");
  await prisma.$executeRaw(Prisma.sql`
    INSERT INTO public."ClientNotificationRead" ("clientId", "eventKey")
    VALUES (${client.id}::uuid, ${key}) ON CONFLICT ("clientId", "eventKey") DO NOTHING
  `);
  revalidatePath("/client-portal", "layout");
  redirect(item.href);
}

export async function markClientNotificationsRead() {
  const client = await ensureClientProfile();
  // A single scoped watermark marks all currently existing events as read.
  await prisma.$executeRaw(Prisma.sql`
    INSERT INTO public."ClientNotificationWatermark" ("clientId", "readThrough")
    VALUES (${client.id}::uuid, now())
    ON CONFLICT ("clientId") DO UPDATE SET "readThrough" = excluded."readThrough"
  `);
  revalidatePath("/client-portal", "layout");
  revalidatePath("/client-portal/notifications");
}
