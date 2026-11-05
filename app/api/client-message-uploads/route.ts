import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { authorizeMessage, messageFileTypes } from "@/lib/client-message-access";
import { messageStorage } from "@/lib/client-message-storage";

export async function POST(req: Request) {
  try {
    const input = await req.json() as Record<string, unknown>;
    const requestId = String(input.requestId ?? "");
    const access = await authorizeMessage(requestId);
    if (!access) return NextResponse.json({ error: "Access denied" }, { status: 403 });
    const name = String(input.fileName ?? "").trim().slice(0, 200);
    const type = String(input.contentType ?? "");
    const size = Number(input.fileSize);
    const purpose = input.purpose === "FINAL" ? "FINAL" : "UPDATE";
    if (!name || name.includes("/") || name.includes("\\") || name.includes("\0") ||
        !messageFileTypes.includes(type) || !Number.isInteger(size) || size < 1 || size > 10*1024*1024) {
      return NextResponse.json({ error: "Invalid attachment" }, { status: 400 });
    }
    const key = `client-messages/${requestId}/${access.authUserId}/${randomUUID()}`;
    const { data, error } = await messageStorage().createSignedUploadUrl(key);
    if (error || !data?.token) throw error || new Error("Unable to create signed upload");
    const rows = await prisma.$queryRaw<{id:string}[]>(Prisma.sql`
      INSERT INTO public."ClientMessageUploadGrant"
      ("requestId","authUserId","storageKey","fileName","contentType","fileSize","purpose")
      VALUES (${requestId}::uuid,${access.authUserId}::uuid,${key},${name},${type},${size},${purpose})
      RETURNING "id"`);
    return NextResponse.json({ grantId: rows[0].id, path: key, token: data.token });
  } catch (e) {
    console.error("Message upload initialization failed", e instanceof Error ? e.message : "unknown");
    return NextResponse.json({ error: "Unable to prepare attachment" }, { status: 500 });
  }
}
