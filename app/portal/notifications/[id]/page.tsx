import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";
import { markNotificationRead } from "../actions";
import { formatNotificationText } from "@/lib/notifications/format-notification";

export default async function NotificationDetail({params}:{params:Promise<{id:string}>}) {
 await connection();
 const user = await requireEmployee();
 const profile = await prisma.employeeProfile.findUnique({where:{authUserId:user.id},select:{id:true}});
 if (!profile) notFound();
 const {id} = await params;
 const notification = await prisma.portalNotification.findFirst({where:{id,recipientId:profile.id}});
 if (!notification) notFound();
 // Only navigate to application-internal destinations; old notifications can retain stale links.
 const destination = notification.href && notification.href.startsWith("/portal/") && !notification.href.startsWith("//") ? notification.href : null;
 return <main className="mx-auto max-w-3xl space-y-5 px-4 py-8 text-white">
  <Link href="/portal/notifications" className="text-sm text-cyan-300 hover:underline">← All notifications</Link>
  <article className="rounded-2xl border border-white/15 bg-[#101F39] p-6 sm:p-8">
   <div className="flex flex-wrap items-start justify-between gap-3"><h1 className="text-2xl font-semibold">{formatNotificationText(notification.title)}</h1>{notification.readAt ? <span className="text-xs text-slate-400">Read</span> : <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-medium text-cyan-200">Unread</span>}</div>
   <p className="mt-3 text-xs text-slate-400">{notification.createdAt.toLocaleString("en-KE",{timeZone:"Africa/Nairobi"})}</p>
   <div className="mt-7 whitespace-pre-wrap break-words text-sm leading-7 text-slate-200">{formatNotificationText(notification.body)}</div>
   <div className="mt-8 flex flex-wrap gap-3">
    {!notification.readAt && <form action={markNotificationRead}><input type="hidden" name="id" value={notification.id}/><button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500">Mark as read</button></form>}
    {destination && <Link href={destination} className="rounded-xl border border-white/20 px-4 py-2 text-sm text-cyan-200 hover:bg-white/10">Go to related page</Link>}
   </div>
  </article>
 </main>;
}
