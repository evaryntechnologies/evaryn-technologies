"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireEmployee } from "@/lib/auth/require-employee";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function actor() {
  const user = await requireEmployee(["QA", "ADMIN", "SUPER_ADMIN"]);
  const me = await prisma.employeeProfile.findUnique({
    where: { authUserId: user.id }, select: { id: true, status: true, role: true },
  });
  if (!me || me.status !== "ACTIVE" || !["QA", "ADMIN", "SUPER_ADMIN"].includes(me.role)) throw new Error("Unauthorized");
  return me;
}

function refresh() {
  for (const p of ["/portal/client-orders", "/portal/qa/client-actions", "/client-portal", "/client-portal/orders", "/client-portal/delivered"]) revalidatePath(p);
}

/** Connect an order to the client it belongs to, so the client can follow its progress. */
export async function linkOrderToClient(form: FormData) {
  const me = await actor();
  const taskId = String(form.get("taskId") ?? "");
  const clientId = String(form.get("clientId") ?? "");
  if (!uuid.test(taskId)) throw new Error("Invalid order.");

  if (!clientId) {
    // Unlink, only while the order has not been delivered to the client.
    await prisma.$executeRaw(Prisma.sql`DELETE FROM public."ClientOrderLink" WHERE "taskId" = ${taskId}::uuid AND "deliveredAt" IS NULL`);
    return refresh();
  }
  if (!uuid.test(clientId)) throw new Error("Invalid client.");
  const [task, client] = await Promise.all([
    prisma.workTask.findUnique({ where: { id: taskId }, select: { id: true } }),
    prisma.clientProfile.findFirst({ where: { id: clientId, status: "ACTIVE" }, select: { id: true } }),
  ]);
  if (!task || !client) throw new Error("Order or client not found.");
  await prisma.$executeRaw(Prisma.sql`
    INSERT INTO public."ClientOrderLink" ("taskId","clientId","linkedById")
    VALUES (${taskId}::uuid, ${clientId}::uuid, ${me.id}::uuid)
    ON CONFLICT ("taskId") DO UPDATE SET "clientId" = EXCLUDED."clientId", "linkedById" = EXCLUDED."linkedById", "updatedAt" = now()
    WHERE public."ClientOrderLink"."deliveredAt" IS NULL`);
  refresh();
}

/** Make a QA-approved order visible on the client's Delivered page. */
export async function sendToClient(form: FormData) {
  const me = await actor();
  const taskId = String(form.get("taskId") ?? "");
  const clientId = String(form.get("clientId") ?? "");
  const note = String(form.get("note") ?? "").trim();
  if (!uuid.test(taskId) || !uuid.test(clientId)) throw new Error("Choose the client this order belongs to.");
  if (note.length > 3000) throw new Error("The delivery note is too long.");

  const [task, client] = await Promise.all([
    prisma.workTask.findFirst({ where: { id: taskId, status: "DELIVERED_AWAITING_CLIENT" }, select: { id: true } }),
    prisma.clientProfile.findFirst({ where: { id: clientId, status: "ACTIVE" }, select: { id: true } }),
  ]);
  if (!task) throw new Error("Only orders that have passed QA can be sent to the client.");
  if (!client) throw new Error("Client not found or not active.");

  await prisma.$executeRaw(Prisma.sql`
    INSERT INTO public."ClientOrderLink" ("taskId","clientId","linkedById","deliveredAt","deliveredById","deliveryNote")
    VALUES (${taskId}::uuid, ${clientId}::uuid, ${me.id}::uuid, now(), ${me.id}::uuid, ${note || null})
    ON CONFLICT ("taskId") DO UPDATE SET "clientId" = EXCLUDED."clientId", "deliveredAt" = now(),
      "deliveredById" = EXCLUDED."deliveredById", "deliveryNote" = EXCLUDED."deliveryNote", "updatedAt" = now()
    WHERE public."ClientOrderLink"."deliveredAt" IS NULL`);
  refresh();
}
