"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { notifyOrderParticipants } from "@/lib/tasks/order-outcome-notifications";
import { ensureClientProfile } from "../clients/actions";
import { notifyClientTeam } from "@/lib/client-communication";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * A client rates an order that was delivered to them.
 * The rating is written to WorkTask.clientRating, which the existing Ratings pages already
 * attribute to every Tasker, Reviewer and QA who worked on the order.
 */
export async function rateDelivery(form: FormData) {
  const client = await ensureClientProfile();
  const taskId = String(form.get("taskId") ?? "");
  const rating = Number(form.get("rating"));
  const feedback = String(form.get("feedback") ?? "").trim().slice(0, 2000);
  if (!uuid.test(taskId) || !Number.isInteger(rating) || rating < 1 || rating > 5) redirect("/client-portal/delivered?error=1");

  let ok = false;
  try {
    ok = await prisma.$transaction(async (tx) => {
      // Only this client's own delivered order, and only until staff finalise it.
      const link = await tx.$queryRaw<{ id: string }[]>(Prisma.sql`
        SELECT l."id" FROM public."ClientOrderLink" l
        WHERE l."taskId" = ${taskId}::uuid AND l."clientId" = ${client.id}::uuid AND l."deliveredAt" IS NOT NULL
        FOR UPDATE`);
      if (!link.length) return false;
      const updated = await tx.workTask.updateMany({
        where: { id: taskId, status: "DELIVERED_AWAITING_CLIENT" },
        data: { clientRating: rating },
      });
      if (updated.count !== 1) return false;
      await tx.$executeRaw(Prisma.sql`
        UPDATE public."ClientOrderLink" SET "clientFeedback" = ${feedback || null}, "ratedAt" = now(), "updatedAt" = now()
        WHERE "id" = ${link[0].id}::uuid`);
      const task = await tx.workTask.findUnique({ where: { id: taskId }, select: { publicTaskId: true } });
      await notifyOrderParticipants(tx, taskId, "Client rated your order", `Order ${task?.publicTaskId ?? taskId} received ${rating} of 5 from the client.${feedback ? ` Comment: ${feedback.slice(0, 300)}` : ""}`);
      return true;
    });
  } catch (error) {
    console.error("Client rating failed", error instanceof Error ? error.message : "unknown");
  }
  for (const path of ["/client-portal", "/client-portal/orders", "/client-portal/delivered", "/portal/ratings", "/ratings", "/portal/qa/client-actions", "/qa/client-actions"]) revalidatePath(path);
  redirect(ok ? "/client-portal/delivered?thanks=1" : "/client-portal/delivered?error=1");
}

/** Store one message in the shared order conversation; only the owning client may post. */
export async function sendClientMessage(form:FormData){
 const client=await ensureClientProfile();
 const requestId=String(form.get("requestId")??"");
 const message=String(form.get("message")??"").trim();
 if(!uuid.test(requestId)||!message||message.length>5000)throw new Error("Invalid message");
 const request=await prisma.clientProjectRequest.findFirst({where:{id:requestId,clientId:client.id},select:{id:true,title:true}});
 if(!request)throw new Error("Order not found");
 await prisma.$executeRaw(Prisma.sql`INSERT INTO public."ClientOrderMessage" ("requestId","senderKind","senderId","body") VALUES (${requestId}::uuid,'CLIENT',${client.id}::uuid,${message})`);
 await notifyClientTeam(requestId,"New client order message",`${request.title}: ${message.slice(0,160)}`);
 revalidatePath(`/client-portal/requests/${requestId}`);
 revalidatePath("/portal/client-messages");
}

/** Client chooses to end a contract, preserving a permanent termination record. */
export async function terminateClientRequest(form:FormData){
 const client=await ensureClientProfile();
 const requestId=String(form.get("requestId")??"");
 const reason=String(form.get("reason")??"").trim();
 if(!uuid.test(requestId)||reason.length<10||reason.length>3000)throw new Error("A reason of at least 10 characters is required");
 const changed=await prisma.$transaction(async tx=>{
  const rows=await tx.$queryRaw<{id:string;title:string}[]>(Prisma.sql`
   UPDATE public."ClientProjectRequest" SET "status"='CLOSED', "terminationReason"=${reason},"terminatedAt"=now(),"updatedAt"=now()
   WHERE "id"=${requestId}::uuid AND "clientId"=${client.id}::uuid AND "status" <> 'CLOSED'
   RETURNING "id","title"`);
  if(!rows.length)return null;
  await tx.$executeRaw(Prisma.sql`
   UPDATE public."WorkTask" SET "status"='CANCELED', "cancellationReason"=${reason}, "updatedAt"=now()
   WHERE "id" IN (SELECT "taskId" FROM public."ClientOrderLink" WHERE "requestId"=${requestId}::uuid)
   AND "status" NOT IN ('COMPLETED','CANCELED','CANCELLED','DELETED')`);
  await tx.$executeRaw(Prisma.sql`INSERT INTO public."ClientOrderMessage" ("requestId","senderKind","senderId","body","kind")
   VALUES (${requestId}::uuid,'CLIENT',${client.id}::uuid,${reason},'TERMINATION')`);
  return rows[0];
 });
 if(changed)await notifyClientTeam(requestId,"Client ended a project",`${changed.title}: ${reason.slice(0,180)}. Review production and payment settlement.`);
 revalidatePath(`/client-portal/requests/${requestId}`);revalidatePath("/portal/client-messages");
}
