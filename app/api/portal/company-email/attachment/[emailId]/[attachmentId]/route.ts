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
    if (url.protocol !== "https:" || url.hostname !== "inbound-cdn.resend.com") {
      throw new Error("Unexpected attachment host");
    }
    return NextResponse.redirect(url, { headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" } });
  } catch (error) {
    console.error("Evaryn attachment retrieval failed", { emailId, attachmentId, error });
    return NextResponse.json({ error: "Attachment temporarily unavailable" }, { status: 502 });
  }
}
