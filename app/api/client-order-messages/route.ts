import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { authorizeMessage, messageUuid } from "@/lib/client-message-access";
import { messageStorage } from "@/lib/client-message-storage";
import { notifyClientTeam } from "@/lib/client-communication";
import { revalidatePath } from "next/cache";

type Grant = {
  id: string; storageKey: string; fileName: string; contentType: string;
  fileSize: number; purpose: string;
};
export async function POST(req: Request) {
  try {
    const input = await req.json() as Record<string, unknown>;
    const requestId = String(input.requestId ?? "");
    const access = await authorizeMessage(requestId);
    if (!access) return NextResponse.json({ error: "Access denied" }, { status: 403 });
    const message = String(input.message ?? "").trim();
    const grantIds = input.grantIds;
    if (!message || message.length > 5000 || !Array.isArray(grantIds) || grantIds.length > 3 ||
        new Set(grantIds).size !== grantIds.length || !grantIds.every(x => typeof x === "string" && messageUuid.test(x))) {
      return NextResponse.json({error:"Write a message (up to 5,000 characters) and attach no more than three files"}, {status:400});
    }
    const grants = grantIds.length ? await prisma.$queryRaw<Grant[]>(Prisma.sql`
      SELECT "id","storageKey","fileName","contentType","fileSize","purpose"
      FROM public."ClientMessageUploadGrant" WHERE "id" IN (${Prisma.join(grantIds.map(String).map(x => Prisma.sql`${x}::uuid`))})
       AND "requestId"=${requestId}::uuid AND "authUserId"=${access.authUserId}::uuid
       AND "consumedAt" IS NULL AND "createdAt">now()-interval '2 hours' FOR UPDATE`) : [];
    if (grants.length !== grantIds.length) return NextResponse.json({error:"An attachment expired; please reselect your files"},{status:400});
    // Verify that the actual uploaded objects match their server-issued grants.
    for (const grant of grants) {
      const {data, error} = await messageStorage().info(grant.storageKey);
      if (error || !data || Number(data.size) !== grant.fileSize) {
        return NextResponse.json({error:"Attachment upload was not completed or its content changed"},{status:400});
      }
    }
    await prisma.$transaction(async tx => {
      const created = await tx.$queryRaw<{id:string}[]>(Prisma.sql`
        INSERT INTO public."ClientOrderMessage" ("requestId","senderKind","senderId","body")
        VALUES (${requestId}::uuid,${access.kind},${access.senderId}::uuid,${message}) RETURNING "id"`);
      for (const grant of grants) {
        const claimed = await tx.$executeRaw(Prisma.sql`
          UPDATE public."ClientMessageUploadGrant" SET "consumedAt"=now()
          WHERE "id"=${grant.id}::uuid AND "consumedAt" IS NULL`);
        if (claimed !== 1) throw new Error("Attachment already used");
        await tx.$executeRaw(Prisma.sql`
          INSERT INTO public."ClientOrderAttachment"
          ("requestId","messageId","fileName","storageKey","contentType","fileSize","purpose")
          VALUES (${requestId}::uuid,${created[0].id}::uuid,${grant.fileName},${grant.storageKey},${grant.contentType},${grant.fileSize},${grant.purpose})`);
      }
    });
    if (access.kind === "CLIENT") {
      try { await notifyClientTeam(requestId, "New client message", `${access.request.title}: ${message.slice(0,120)}${grants.length ? ` (${grants.length} attachment(s))` : ""}`); }
      catch (err) { console.error("Staff notification failed", err); }
    }
    revalidatePath(`/client-portal/requests/${requestId}`);
    revalidatePath(`/portal/client-messages/${requestId}`);
    revalidatePath("/portal/client-messages");
    revalidatePath("/client-messages");
    return NextResponse.json({ok:true});
  } catch (e) {
    console.error("Client message posting failed",e instanceof Error ? e.message : "unknown");
    return NextResponse.json({error:"Message could not be sent"},{status:500});
  }
}
