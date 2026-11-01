"use server";

import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function publishAnnouncement(form: FormData) {
  const auth = await requireEmployee(["REVIEWER", "QA", "ADMIN", "SUPER_ADMIN"]);
  const sender = await prisma.employeeProfile.findUnique({where:{authUserId:auth.id},select:{id:true,fullName:true,role:true,status:true}});
  if (!sender || sender.status !== "ACTIVE" || !["REVIEWER","QA","ADMIN","SUPER_ADMIN"].includes(sender.role)) throw new Error("Access denied");
  const title = String(form.get("title") ?? "").trim();
  const body = String(form.get("body") ?? "").trim();
  if(title.length < 4 || title.length > 140 || body.length < 10 || body.length > 4000) throw new Error("Enter a title (4–140 characters) and message (10–4000 characters).");
  const recipients = await prisma.employeeProfile.findMany({where:{status:"ACTIVE"},select:{id:true}});
  if (recipients.length) await prisma.portalNotification.createMany({data:recipients.map(r=>({recipientId:r.id,title:`Team memo: ${title}`,body:`From ${sender.fullName} (${sender.role})\n\n${body}`,href:"/portal/notifications"}))});
  revalidatePath("/portal/notifications");
  revalidatePath("/portal/announcements");
  redirect("/portal/announcements?sent=1");
}
