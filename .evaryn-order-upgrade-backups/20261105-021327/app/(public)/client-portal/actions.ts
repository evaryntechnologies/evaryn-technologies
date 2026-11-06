"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { notifyOrderParticipants } from "@/lib/tasks/order-outcome-notifications";
import { ensureClientProfile } from "../clients/actions";

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
