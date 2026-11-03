import "server-only";
import { Resend } from "resend";
import { prisma } from "@/lib/db/prisma";
import { FROM, GMAIL } from "@/lib/evaryn-email/resend";

function resendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY missing");
  return new Resend(apiKey);
}

export async function listIncomingAttachments(emailId: string) {
  const { data, error } = await resendClient().emails.receiving.attachments.list({ emailId });
  if (error) throw new Error(`Resend attachment list: ${error.message}`);
  return data?.data ?? [];
}

export async function getIncomingAttachment(emailId: string, id: string) {
  const { data, error } = await resendClient().emails.receiving.attachments.get({ emailId, id });
  if (error || !data?.download_url) throw new Error(`Resend attachment unavailable: ${error?.message ?? "missing URL"}`);
  return data.download_url;
}

export async function forwardIncomingAndRecord(emailId: string) {
  try {
    const { error } = await resendClient().emails.receiving.forward({
      emailId, to: GMAIL, from: `Evaryn Technologies Limited <${FROM}>`,
    });
    if (error) throw new Error(error.message);
    await prisma.$executeRaw`update public."EvarynEmail" set "forwardStatus"='SENT', "lastForwardError"=null, "forwardedAt"=now() where id=${emailId} and direction='INBOUND'`;
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 400) : "Unknown forwarding error";
    await prisma.$executeRaw`update public."EvarynEmail" set "forwardStatus"='PENDING', "lastForwardError"=${message} where id=${emailId} and direction='INBOUND'`;
    console.error("Evaryn forward failed", { emailId, message });
    throw error;
  }
}
