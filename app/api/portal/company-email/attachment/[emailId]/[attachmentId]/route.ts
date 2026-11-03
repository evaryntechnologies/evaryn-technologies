import { NextResponse } from "next/server";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";
import { getIncomingAttachment } from "@/lib/evaryn-email/inbound-repair";

export async function GET(_request: Request, { params }: { params: Promise<{ emailId: string; attachmentId: string }> }) {
  await requireEmployee(["SUPER_ADMIN"]);
  const { emailId, attachmentId } = await params;
  if (!/^[a-zA-Z0-9-]{8,100}$/.test(emailId) || !/^[a-zA-Z0-9-]{8,100}$/.test(attachmentId)) {
    return NextResponse.json({ error: "Invalid attachment ID" }, { status: 400 });
  }
  const rows = await prisma.$queryRaw<{ id: string }[]>`select id from public."EvarynEmail" where id=${emailId} and direction='INBOUND' limit 1`;
  if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    const url = new URL(await getIncomingAttachment(emailId, attachmentId));
    // Resend returns a freshly signed download URL. Its CDN hostname is not
    // a stable part of the API contract, so do not pin it to one hostname.
    // The URL originates from our authenticated server-side Resend API call,
    // not from a user-controlled query string.
    if (url.protocol !== "https:" || url.username || url.password) {
      throw new Error("Invalid signed attachment URL from Resend");
    }
    return NextResponse.redirect(url, { headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" } });
  } catch (error) {
    console.error("Evaryn attachment retrieval failed", { emailId, attachmentId, error });
    return NextResponse.json({ error: "Attachment temporarily unavailable" }, { status: 502 });
  }
}
