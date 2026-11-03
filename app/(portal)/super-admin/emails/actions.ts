"use server";
import { forwardIncomingAndRecord } from "@/lib/evaryn-email/inbound-repair";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";
import { mailboxAddress, FROM, sendEmail, listReceivedEmails, received } from "@/lib/evaryn-email/resend";

export async function sendPortalEmail(form: FormData) {
  await requireEmployee(["SUPER_ADMIN"]);
  const to = mailboxAddress(String(form.get("to") || ""));
  const subject = String(form.get("subject") || "").trim().slice(0, 500);
  const body = String(form.get("body") || "").trim().slice(0, 100000);
  const replyToId = String(form.get("replyToId") || "");
  if (!subject || !body) throw new Error("Subject and message are required");
  const delivery = await sendEmail({ to, subject, text: body });
  await prisma.$executeRaw`
    insert into public."EvarynEmail" (id,direction,"fromAddress","toAddress",subject,body,"replyToId")
    values (${delivery.id}, 'OUTBOUND', ${FROM}, ${to}, ${subject}, ${body}, ${replyToId || null})
    on conflict (id) do nothing
  `;
  revalidatePath("/super-admin/emails");
  redirect("/super-admin/emails");
}

export async function markRead(form: FormData) {
  await requireEmployee(["SUPER_ADMIN"]);
  const id = String(form.get("id") || "");
  await prisma.$executeRaw`update public."EvarynEmail" set "isRead"=true where id=${id}`;
  revalidatePath("/super-admin/emails");
}

// Super Admin-only recovery for mail already received by Resend, including missed webhooks.
export async function syncReceivedEmails() {
  await requireEmployee(["SUPER_ADMIN"]);
  let after: string | undefined;
  let imported = 0;
  let scanned = 0;
  // Bound each manual sync request so it finishes within typical serverless limits.
  for (let batch = 0; batch < 3; batch++) {
    const inbox = await listReceivedEmails(100, after);
    if (!Array.isArray(inbox.data)) throw new Error("Unexpected Resend response");
    for (const item of inbox.data) {
      if (!item.id || !/^[a-zA-Z0-9-]{8,100}$/.test(item.id)) continue;
      scanned++;
      if (!(item.to || []).some(to => {
        try { return mailboxAddress(to).toLowerCase() === FROM.toLowerCase(); } catch { return false; }
      })) continue;
      const exists = await prisma.$queryRaw<{ id: string }[]>`
        select id from public."EvarynEmail" where id=${item.id} limit 1
      `;
      if (exists.length) continue;
      const email = await received(item.id);
      const sender = mailboxAddress(email.from);
      const body = (email.text || "(HTML-only email: read original in Resend Receiving)").slice(0, 100000);
      const subject = (email.subject || "(No subject)").slice(0, 500);
      const attachments = JSON.stringify(email.attachments || []);
      const inserted = await prisma.$executeRaw`
        insert into public."EvarynEmail" (id,direction,"fromAddress","toAddress",subject,body,"forwardStatus","attachmentInfo")
        values (${item.id},'INBOUND',${sender},${FROM},${subject},${body},'PENDING',${attachments}::jsonb)
        on conflict (id) do nothing
      `;
      imported += inserted;
    }
    if (!inbox.has_more || inbox.data.length === 0) break;
    after = inbox.data[inbox.data.length - 1]?.id;
    if (!after) break;
  }
  console.info("Evaryn inbox manual sync", { scanned, imported });
  revalidatePath("/super-admin/emails");
  redirect(`/super-admin/emails?sync=${imported}`);
}

// Opening a conversation marks its inbound messages read before displaying the thread.
// The server recalculates membership rather than trusting user-supplied message IDs.
export async function openEmailConversation(form: FormData) {
  await requireEmployee(["SUPER_ADMIN"]);
  const id = String(form.get("id") || "");
  if (!id || id.length > 200) throw new Error("Invalid conversation");
  const mails = await prisma.$queryRaw<import("@/lib/evaryn-email/conversations").EmailConversationItem[]>`
    select id, direction, "fromAddress", "toAddress", subject, "receivedAt", "isRead"
    from public."EvarynEmail" order by "receivedAt" desc limit 500
  `;
  const target = mails.find(m => m.id === id);
  if (!target) throw new Error("Conversation not found");
  const { conversationKey } = await import("@/lib/evaryn-email/conversations");
  const key = conversationKey(target);
  for (const mail of mails) {
    if (conversationKey(mail) === key && mail.direction === "INBOUND" && !mail.isRead) {
      await prisma.$executeRaw`update public."EvarynEmail" set "isRead"=true where id=${mail.id} and direction='INBOUND'`;
    }
  }
  revalidatePath("/super-admin/emails");
  redirect(`/super-admin/emails/${encodeURIComponent(id)}`);
}

// Manual recovery for a received message whose forwarding failed or got stuck.
export async function retryReceivedForwarding(form: FormData) {
  await requireEmployee(["SUPER_ADMIN"]);
  const id = String(form.get("id") || "");
  if (!/^[a-zA-Z0-9-]{8,100}$/.test(id)) throw new Error("Invalid email ID");
  const claimed = await prisma.$executeRaw`
    update public."EvarynEmail" set "forwardStatus"='PROCESSING', "forwardedAt"=now(), "lastForwardError"=null
    where id=${id} and direction='INBOUND' and (
      "forwardStatus"='PENDING' or
      ("forwardStatus"='PROCESSING' and ("forwardedAt" is null or "forwardedAt" < now() - interval '15 minutes'))
    )
  `;
  if (claimed) await forwardIncomingAndRecord(id);
  revalidatePath("/super-admin/emails");
  revalidatePath(`/super-admin/emails/${id}`);
}
