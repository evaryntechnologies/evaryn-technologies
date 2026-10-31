"use server";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";

async function profileId() {
  const user = await requireEmployee();
  const profile = await prisma.employeeProfile.findUnique({where:{authUserId:user.id},select:{id:true}});
  if (!profile) throw new Error("Employee profile not found");
  return profile.id;
}
export async function markNotificationRead(form:FormData) {
  const recipientId=await profileId();
  const id=String(form.get("id")??"");
  if(!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Invalid notification");
  await prisma.portalNotification.updateMany({where:{id,recipientId,readAt:null},data:{readAt:new Date()}});
  revalidatePath("/portal/notifications");
  revalidatePath(`/portal/notifications/${id}`);
  revalidatePath("/portal");
}
export async function markAllNotificationsRead() {
  const recipientId=await profileId();
  await prisma.portalNotification.updateMany({where:{recipientId,readAt:null},data:{readAt:new Date()}});
  revalidatePath("/portal/notifications");
  revalidatePath("/portal");
}
