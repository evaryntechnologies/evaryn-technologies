"use server";import {requireEmployee} from "@/lib/auth/require-employee";import {prisma} from "@/lib/db/prisma";import {revalidatePath} from "next/cache";
export async function markNotificationRead(f:FormData){const user=await requireEmployee();const p=await prisma.employeeProfile.findUnique({where:{authUserId:user.id},select:{id:true}});if(!p)throw new Error("Access denied");const id=String(f.get("id")??"");await prisma.portalNotification.updateMany({where:{id,recipientId:p.id,readAt:null},data:{readAt:new Date()}});revalidatePath("/portal/notifications");revalidatePath("/portal", "layout");}

export async function markAllNotificationsRead() {
 const user = await requireEmployee();
 const profile = await prisma.employeeProfile.findUnique({where:{authUserId:user.id},select:{id:true}});
 if (!profile) throw new Error("Access denied");
 await prisma.portalNotification.updateMany({where:{recipientId:profile.id,readAt:null},data:{readAt:new Date()}});
 revalidatePath("/portal/notifications");
 revalidatePath("/portal", "layout");
}
