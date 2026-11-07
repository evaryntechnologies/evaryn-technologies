"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { ensureClientProfile } from "../../clients/actions";
import { notifyOrderParticipants } from "@/lib/tasks/order-outcome-notifications";

const validId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function submitDeliveryDecision(form: FormData) {
  const client = await ensureClientProfile();
  const id = String(form.get("deliveryId") ?? "");
  const decision = String(form.get("decision") ?? "");
  const reason = String(form.get("reason") ?? "").trim();
  const percentageText = String(form.get("percentage") ?? "");
  const currency = String(form.get("currency") ?? "");
  const amountText = String(form.get("amount") ?? "");
  const percentage = decision === "PAID_FULL" ? 100 : Number(percentageText);
  const isPayment = decision === "PAID_PARTIAL" || decision === "PAID_FULL";
  const fullPayment = decision === "PAID_FULL" || (decision === "PAID_PARTIAL" && percentage === 100);
  const paymentDecision = fullPayment ? "PAID_FULL" : "PAID_PARTIAL";
  if (!validId.test(id) || !["REVISION", "CANCELED", "PAID_PARTIAL", "PAID_FULL"].includes(decision) || reason.length < 10 || reason.length > 5000) {
    throw new Error("Choose an action and provide at least 10 characters explaining your decision.");
  }
  if (decision === "PAID_PARTIAL" && (!/^\d+(?:\.\d{1,2})?$/.test(percentageText) || !(percentage > 0 && percentage <= 100))) {
    throw new Error("Enter a percentage from 0.01 to 100 (maximum two decimal places).");
  }

  if (isPayment && (currency !== "USD" && currency !== "KES")) throw new Error("Select USD or KES for the reported payment.");
  if (isPayment && (!/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(amountText) || Number(amountText) <= 0 || !Number.isFinite(Number(amountText))))
    throw new Error("Enter the actual positive amount paid in the selected currency.");
  await prisma.$transaction(async tx => {
    // Ownership and current state are checked on every request, not trusted from the form.
    const delivery = await tx.clientDelivery.findFirst({
      where: { id, clientId: client.id, task: { status: "DELIVERED_AWAITING_CLIENT" } },
      select: { taskId: true, task: { select: { assignedToId: true, publicTaskId: true } } },
    });
    if (!delivery) throw new Error("This delivery is not awaiting action for your account.");
    if (decision === "REVISION" && !delivery.task.assignedToId) throw new Error("An assigned tasker is required for a revision.");

    // A partial payment is a report, never confirmation of funds or a payroll settlement.
    if (isPayment) {
      // One pending report per task. A newer report replaces the earlier unverified one.
      // Reports are NEVER payment proof and NEVER unlock private final deliverables.
      await tx.$executeRaw`
        INSERT INTO public."ClientDeliveryDecision"("deliveryId","taskId","clientId","decision","reason","paidPercent","currency","paidAmount","status")
        VALUES (${id}::uuid, ${delivery.taskId}::uuid, ${client.id}::uuid, ${paymentDecision}, ${reason}, ${percentage}, ${currency}, ${amountText}::numeric, 'PENDING')
        ON CONFLICT ("taskId") WHERE "status"='PENDING'
        DO UPDATE SET "deliveryId"=EXCLUDED."deliveryId", "clientId"=EXCLUDED."clientId",
          "decision"=EXCLUDED."decision", "reason"=EXCLUDED."reason",
          "paidPercent"=EXCLUDED."paidPercent", "currency"=EXCLUDED."currency", "paidAmount"=EXCLUDED."paidAmount", "createdAt"=now()`;
      const admins = await tx.employeeProfile.findMany({ where: { role: "SUPER_ADMIN", status: "ACTIVE" }, select: { id: true } });
      if (admins.length) await tx.portalNotification.createMany({ data: admins.map(a => ({ recipientId: a.id, title: fullPayment ? "Client reported full payment" : "Client reported partial payment", body: `Order ${delivery.task.publicTaskId ?? delivery.taskId}: ${percentage}% reported · ${currency} ${Number(amountText).toFixed(2)} (unverified). Super Admin must verify receipt before releasing original files.`, href: "/portal/client-decisions" })) });
      return;
    }

    const next = decision === "REVISION" ? "REWORK_REQUIRED" : "CANCELED";
    const changed = await tx.workTask.updateMany({ where: { id: delivery.taskId, status: "DELIVERED_AWAITING_CLIENT" }, data: {
      status: next,
      claimedQaId: null,
      claimedReviewerId: null,
      clientRevisionNote: decision === "REVISION" ? reason : null,
      cancellationReason: decision === "CANCELED" ? `Client termination: ${reason}` : null,
      clientActionAt: decision === "CANCELED" ? new Date() : null,
    } });
    if (changed.count !== 1) throw new Error("This order has already been processed.");
    await tx.taskSubmission.updateMany({ where: { taskId: delivery.taskId, status: "DELIVERED_AWAITING_CLIENT" }, data: { status: next } });
    await tx.$executeRaw`
      INSERT INTO public."ClientDeliveryDecision"("deliveryId","taskId","clientId","decision","reason","status")
      VALUES (${id}::uuid, ${delivery.taskId}::uuid, ${client.id}::uuid, ${decision}, ${reason}, 'APPLIED')`;

    await tx.$executeRaw`UPDATE public."ClientDeliveryDecision" SET "status"='RESOLVED' WHERE "taskId"=${delivery.taskId}::uuid AND "status"='PENDING'`;
    if (decision === "REVISION" && delivery.task.assignedToId) {
      await tx.portalNotification.create({ data: {
        recipientId: delivery.task.assignedToId,
        title: "Client revision requested",
        body: `Order ${delivery.task.publicTaskId ?? delivery.taskId} returned directly to you. ${reason}`,
        href: `/portal/tasker/tasks/${delivery.taskId}`,
      } });
    } else {
      await notifyOrderParticipants(tx, delivery.taskId, "Client ended contract", `Client termination: ${reason}`);
    }
    const staff = await tx.employeeProfile.findMany({ where: { role: { in: ["ADMIN", "SUPER_ADMIN"] }, status: "ACTIVE" }, select: { id: true } });
    if (staff.length) await tx.portalNotification.createMany({ data: staff.map(a => ({ recipientId: a.id, title: decision === "REVISION" ? "Client requested revision" : "Client ended project", body: `Order ${delivery.task.publicTaskId ?? delivery.taskId}: ${reason}`, href: "/portal/client-decisions" })) });
  });

  revalidatePath("/client-portal/delivered");
  revalidatePath("/client-portal/delivered/awaiting");
  revalidatePath("/portal/client-decisions");
  revalidatePath("/portal/tasker/my-tasks");
  redirect("/client-portal/delivered/awaiting?sent=1");
}
