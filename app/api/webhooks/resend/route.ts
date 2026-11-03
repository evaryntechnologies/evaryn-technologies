import { NextResponse } from "next/server";
import { Resend } from "resend";
import { Webhook } from "svix";
import { prisma } from "@/lib/db/prisma";
import { FROM, GMAIL, received, mailboxAddress } from "@/lib/evaryn-email/resend";

export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  let event: { type: string; data?: { email_id?: string; to?: string[] } };
  try {
    const payload = await request.text();
    new Webhook(secret).verify(payload, {
      "svix-id": request.headers.get("svix-id") || "",
      "svix-timestamp": request.headers.get("svix-timestamp") || "",
      "svix-signature": request.headers.get("svix-signature") || "",
    });
    event = JSON.parse(payload) as typeof event;
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  if (event.type !== "email.received") return NextResponse.json({ ok: true });
  const id = event.data?.email_id;
  if (!id || !/^[a-zA-Z0-9-]{8,100}$/.test(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  try {
    const mail = await received(id);
    const addressedToEvaryn = (mail.to || []).some(x => {
      try { return mailboxAddress(x).toLowerCase() === FROM.toLowerCase(); }
      catch { return false; }
    });
    if (!addressedToEvaryn) return NextResponse.json({ ok: true, ignored: true });
    const sender = mailboxAddress(mail.from);
    const body = (mail.text || "(HTML-only email: read original in Resend Receiving)").slice(0, 100000);
    const subject = (mail.subject || "(No subject)").slice(0, 500);
    const attachments = JSON.stringify(mail.attachments || []);
    await prisma.$executeRaw`
      insert into public."EvarynEmail" (id,direction,"fromAddress","toAddress",subject,body,"forwardStatus","attachmentInfo")
      values (${id}, 'INBOUND', ${sender}, ${FROM}, ${subject}, ${body}, 'PENDING', ${attachments}::jsonb)
      on conflict (id) do nothing
    `;
    // Atomic claim; older PROCESSING claims are recoverable after 15 minutes.
    const claimed = await prisma.$executeRaw`
      update public."EvarynEmail" set "forwardStatus"='PROCESSING', "lastForwardError"=null, "forwardedAt"=now()
      where id=${id} and "forwardStatus" in ('PENDING')
    `;
    if (claimed) {
      try {
        // Resend's forward helper retrieves the original message and attachments.
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) throw new Error("RESEND_API_KEY missing");
        const resend = new Resend(apiKey);
        const { error } = await resend.emails.receiving.forward({
          emailId: id,
          to: GMAIL,
          from: `Evaryn Technologies Limited <${FROM}>`,
        });
        if (error) throw new Error(`Resend forwarding failed: ${error.message}`);
        await prisma.$executeRaw`update public."EvarynEmail" set "forwardStatus"='SENT',"forwardedAt"=now() where id=${id}`;
      } catch (error) {
        const description = error instanceof Error ? error.message.slice(0, 400) : "Unknown send failure";
        await prisma.$executeRaw`update public."EvarynEmail" set "forwardStatus"='PENDING', "lastForwardError"=${description} where id=${id}`;
        throw error;
      }
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Resend inbound processing failed", error);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
