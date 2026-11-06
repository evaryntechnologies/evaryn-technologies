"use server";

import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function publishAnnouncement(form: FormData) {
  const auth = await requireEmployee(["QA", "ADMIN", "SUPER_ADMIN"]);
  const sender = await prisma.employeeProfile.findUnique({
    where: { authUserId: auth.id },
    select: { id: true, fullName: true, role: true, status: true },
  });
  if (!sender || sender.status !== "ACTIVE" || !["QA", "ADMIN", "SUPER_ADMIN"].includes(sender.role)) {
    throw new Error("Only active QA, Admin or Super Admin employees can publish memos.");
  }
  const title = String(form.get("title") ?? "").trim();
  const body = String(form.get("body") ?? "").trim();
  if (title.length < 4 || title.length > 140 || body.length < 10 || body.length > 4000) {
    throw new Error("Enter a subject (4–140 characters) and memo (10–4000 characters).");
  }
  // Archive and notification creation share one transaction. If notification delivery
  // fails, neither operation commits, so a memo never appears as partially sent.
  const memoId = await prisma.$transaction(async (tx) => {
    const created = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      INSERT INTO public."InternalMemo" ("senderId", "senderName", "senderRole", "title", "body")
      VALUES (${sender.id}::uuid, ${sender.fullName}, ${sender.role}, ${title}, ${body})
      RETURNING "id";
    `);
    const id = created[0]?.id;
    if (!id) throw new Error("Could not archive the memo.");
    const recipients = await tx.employeeProfile.findMany({
      where: { status: "ACTIVE" }, select: { id: true },
    });
    if (recipients.length) {
      await tx.portalNotification.createMany({
        data: recipients.map(r => ({
          recipientId: r.id,
          title: `Team memo: ${title}`,
          body: `From ${sender.fullName} (${sender.role})\n\n${body}`,
          href: `/announcements/${id}`,
        })),
      });
    }
    return id;
  });
  revalidatePath("/announcements");
  revalidatePath("/portal/notifications");
  redirect(`/announcements/${memoId}?sent=1`);
}


const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function currentMemoEmployee() {
  const auth = await requireEmployee();
  const employee = await prisma.employeeProfile.findUnique({
    where: {authUserId: auth.id},
    select: {id: true, role: true, status: true},
  });
  if (!employee || employee.status !== "ACTIVE") throw new Error("An active employee account is required.");
  return employee;
}

// -1 = downvote, +1 = upvote, 0 = remove an existing vote.
export async function voteMemo(form: FormData) {
  const employee = await currentMemoEmployee();
  const id = String(form.get("id") ?? "");
  const value = Number(form.get("vote"));
  if (!UUID.test(id) || ![-1, 0, 1].includes(value)) throw new Error("Invalid vote.");
  await prisma.$transaction(async tx => {
    const memo = await tx.$queryRaw<Array<{id: string}>>(Prisma.sql`
      SELECT "id" FROM public."InternalMemo" WHERE "id" = ${id}::uuid FOR SHARE
    `);
    if (!memo.length) throw new Error("This memo is no longer available.");
    if (value === 0) {
      await tx.$executeRaw(Prisma.sql`
        DELETE FROM public."InternalMemoVote" WHERE "memoId"=${id}::uuid AND "employeeId"=${employee.id}::uuid
      `);
    } else {
      await tx.$executeRaw(Prisma.sql`
        INSERT INTO public."InternalMemoVote" ("memoId", "employeeId", "value")
        VALUES (${id}::uuid, ${employee.id}::uuid, ${value})
        ON CONFLICT ("memoId", "employeeId") DO UPDATE SET
          "value"=EXCLUDED."value", "votedAt"=now()
      `);
    }
  });
  revalidatePath(`/announcements/${id}`);
  revalidatePath("/announcements");
  redirect(`/announcements/${id}`);
}

// Authors may delete their own memo; a Super Admin may delete any memo.
// Deletion is permanent for all users, including archived notification copies.
export async function deleteMemo(form: FormData) {
  const employee = await currentMemoEmployee();
  const id = String(form.get("id") ?? "");
  const confirmation = String(form.get("confirm") ?? "");
  if (!UUID.test(id) || confirmation !== "DELETE") throw new Error("Confirm deletion by entering DELETE.");
  await prisma.$transaction(async tx => {
    const rows = await tx.$queryRaw<Array<{ id: string; senderId: string|null; legacyKey: string|null; title:string; publishedAt:Date }>>(Prisma.sql`
      SELECT "id", "senderId", "legacyKey", "title", "publishedAt"
      FROM public."InternalMemo" WHERE "id"=${id}::uuid FOR UPDATE
    `);
    const memo = rows[0];
    if (!memo) throw new Error("Memo not found.");
    if (employee.role !== "SUPER_ADMIN" && memo.senderId !== employee.id) {
      throw new Error("Only the memo author or Super Admin may delete this memo.");
    }
    // New notifications link directly to the memo. Remove them so no deleted text remains in alerts.
    await tx.portalNotification.deleteMany({where:{href:`/announcements/${id}`}});
    // Older memos were copied to multiple recipient notifications before the archive existed.
    // Match the exact historical fingerprint used by the original migration, not just a subject.
    if (memo.legacyKey) {
      await tx.$executeRaw(Prisma.sql`
        DELETE FROM public."PortalNotification"
        WHERE md5("title" || E'\\x1f' || "body" || E'\\x1f' || "createdAt"::text) = ${memo.legacyKey}
          AND "title" LIKE 'Team memo: %'
      `);
    }
    await tx.$executeRaw(Prisma.sql`DELETE FROM public."InternalMemo" WHERE "id"=${id}::uuid`);
    // InternalMemoVote rows are deleted through ON DELETE CASCADE.
  });
  revalidatePath("/announcements");
  revalidatePath("/notifications");
  redirect("/announcements?deleted=1");
}
