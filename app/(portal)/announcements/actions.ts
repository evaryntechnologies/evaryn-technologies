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
