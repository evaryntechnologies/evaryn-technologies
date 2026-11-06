"use server";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireEmployee } from "@/lib/auth/require-employee";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const roles = ["TASKER", "REVIEWER", "QA", "ADMIN", "SUPER_ADMIN"] as const;

type Sender = { id: string; fullName: string; role: string; status: string };

async function authenticatedSender(): Promise<Sender> {
  const auth = await requireEmployee();
  const person = await prisma.employeeProfile.findUnique({
    where: { authUserId: auth.id },
    select: { id: true, fullName: true, role: true, status: true },
  });
  if (!person || person.status !== "ACTIVE" || !roles.some(r => r === person.role)) {
    throw new Error("Active employee access is required.");
  }
  return person;
}

export async function startSpecialMessage(form: FormData): Promise<void> {
  const sender = await authenticatedSender();
  const subject = String(form.get("subject") ?? "").trim();
  const body = String(form.get("body") ?? "").trim();
  const mode = String(form.get("scope") ?? "SELECTED");
  if (subject.length < 3 || subject.length > 160 || body.length < 1 || body.length > 6000) {
    throw new Error("Enter a subject (3–160 characters) and a message (1–6000 characters).");
  }
  if (mode !== "GENERAL" && mode !== "SELECTED") throw new Error("Invalid audience.");

  // Reject arbitrary client-supplied employee IDs and roles. The authoritative recipient
  // list is revalidated against ACTIVE employee profiles on the server.
  const selected = [...new Set(form.getAll("employees").map(String))].filter(Boolean);
  const groups = [...new Set(form.getAll("roles").map(String))].filter(Boolean);
  if (selected.length > 1000 || groups.length > roles.length || groups.some(x => !roles.some(r => r === x))) {
    throw new Error("Invalid recipient selection.");
  }
  const idPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (selected.some(id => !idPattern.test(id))) throw new Error("Invalid employee selection.");
  if (mode === "SELECTED" && !selected.length && !groups.length) {
    throw new Error("Select at least one employee or role group, or use General.");
  }
  const recipientWhere = {
    status: "ACTIVE",
    OR: [
      ...(selected.length ? [{ id: { in: selected } }] : []),
      ...(groups.length ? [{ role: { in: groups } }] : []),
    ],
  };
  const recipients = mode === "GENERAL" ? [] : await prisma.employeeProfile.findMany({
    where: recipientWhere, select: { id: true },
  });
  if (mode === "SELECTED" && !recipients.some(r => r.id !== sender.id)) {
    throw new Error("At least one other active employee must be selected.");
  }
  // A previously selected ID may have left the company. Never silently claim delivery.
  if (mode === "SELECTED" && selected.some(id => id !== sender.id && !recipients.some(r => r.id === id))) {
    throw new Error("One of the selected employees is no longer active. Refresh the page.");
  }
  const memberIds = [...new Set([sender.id, ...recipients.map(r => r.id)])];
  const conversationId = await prisma.$transaction(async tx => {
    const created = await tx.$queryRaw<{ id: string }[]>(Prisma.sql`
      INSERT INTO public."InternalConversation" ("subject", "scope", "createdBy")
      VALUES (${subject}, ${mode}, ${sender.id}::uuid) RETURNING "id";
    `);
    const id = created[0]?.id;
    if (!id) throw new Error("Could not start the conversation.");
    if (mode === "SELECTED") {
      for (const employeeId of memberIds) {
        await tx.$executeRaw(Prisma.sql`
          INSERT INTO public."InternalConversationParticipant" ("conversationId", "employeeId")
          VALUES (${id}::uuid, ${employeeId}::uuid) ON CONFLICT DO NOTHING;
        `);
      }
    }
    await tx.$executeRaw(Prisma.sql`
      INSERT INTO public."InternalConversationMessage" ("conversationId", "senderId", "body")
      VALUES (${id}::uuid, ${sender.id}::uuid, ${body});
    `);
    const notify = mode === "GENERAL"
      ? await tx.employeeProfile.findMany({where:{status:"ACTIVE",id:{not:sender.id}},select:{id:true}})
      : memberIds.filter(x => x !== sender.id).map(id => ({id}));
    if (notify.length) await tx.portalNotification.createMany({ data: notify.map(r => ({
      recipientId: r.id, title: `Special message: ${subject}`,
      body: `${sender.fullName} started a ${mode === "GENERAL" ? "company-wide" : "private/group"} conversation.`,
      href: `/special-messages/${id}`,
    })) });
    return id;
  });
  revalidatePath("/special-messages");
  redirect(`/special-messages/${conversationId}`);
}

export async function replyToSpecialMessage(form: FormData): Promise<void> {
  const sender = await authenticatedSender();
  const conversationId = String(form.get("conversationId") ?? "");
  const body = String(form.get("body") ?? "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(conversationId) || !body || body.length > 6000) throw new Error("Invalid reply.");
  // Check permission and write the reply in one transaction so a membership change
  // cannot occur between a separate check and the insert.
  await prisma.$transaction(async tx => {
    const permitted = await tx.$queryRaw<{ id: string; subject: string; scope: string }[]>(Prisma.sql`
      SELECT c."id", c."subject", c."scope" FROM public."InternalConversation" c
      WHERE c."id" = ${conversationId}::uuid
        AND (c."scope" = 'GENERAL' OR EXISTS (
          SELECT 1 FROM public."InternalConversationParticipant" p
          WHERE p."conversationId" = c."id" AND p."employeeId" = ${sender.id}::uuid
        )) FOR UPDATE OF c;
    `);
    if (!permitted[0]) throw new Error("Conversation not available to your account.");
    await tx.$executeRaw(Prisma.sql`
      INSERT INTO public."InternalConversationMessage" ("conversationId", "senderId", "body")
      VALUES (${conversationId}::uuid, ${sender.id}::uuid, ${body});
    `);
    await tx.$executeRaw(Prisma.sql`
      UPDATE public."InternalConversation" SET "updatedAt" = now() WHERE "id" = ${conversationId}::uuid;
    `);
    const people = permitted[0].scope === "GENERAL"
      ? await tx.employeeProfile.findMany({where:{status:"ACTIVE",id:{not:sender.id}},select:{id:true}})
      : await tx.$queryRaw<{id:string}[]>(Prisma.sql`
          SELECT e."id" FROM public."InternalConversationParticipant" p
          JOIN public."EmployeeProfile" e ON e."id" = p."employeeId"
          WHERE p."conversationId" = ${conversationId}::uuid AND e."status" = 'ACTIVE'
            AND e."id" <> ${sender.id}::uuid;
        `);
    if (people.length) await tx.portalNotification.createMany({ data: people.map(p => ({
      recipientId: p.id, title: `Reply: ${permitted[0].subject}`,
      body: `${sender.fullName} replied to your conversation.`,
      href: `/special-messages/${conversationId}`,
    })) });
  });
  revalidatePath(`/special-messages/${conversationId}`);
  revalidatePath("/special-messages");
  redirect(`/special-messages/${conversationId}`);
}
