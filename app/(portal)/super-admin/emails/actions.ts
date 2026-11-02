"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";
import { mailboxAddress, FROM, sendEmail } from "@/lib/evaryn-email/resend";

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
