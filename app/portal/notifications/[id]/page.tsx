import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";
import { markNotificationRead } from "../actions";

export default async function NotificationDetail({params}:{params:Promise<{id:string}>}) {
  await connection();
  const {id}=await params;
  if(!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const auth=await requireEmployee();
  const employee=await prisma.employeeProfile.findUnique({where:{authUserId:auth.id},select:{id:true}});
  if(!employee) notFound();
  const notification=await prisma.portalNotification.findFirst({where:{id,recipientId:employee.id}});
  if(!notification) notFound();
  const related=notification.href?.startsWith("/portal/") && !notification.href.startsWith("//") ? notification.href : null;
  return <main className="min-h-screen bg-[#071327] px-4 py-9 text-white sm:px-8">
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/portal/notifications" className="text-cyan-300">← All notifications</Link>
      <article className="rounded-2xl border border-white/15 bg-[#101F39] p-6 sm:p-8">
        <div className="flex items-center justify-between gap-2"><span className="text-xs uppercase tracking-widest text-cyan-300">Notification</span>{!notification.readAt&&<span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs text-blue-200">Unread</span>}</div>
        <h1 className="mt-4 text-2xl font-semibold">{notification.title}</h1>
        <p className="mt-2 text-sm text-slate-400">{notification.createdAt.toLocaleString("en-KE",{timeZone:"Africa/Nairobi"})}</p>
        <p className="mt-6 whitespace-pre-wrap break-words leading-7 text-slate-200">{notification.body}</p>
        <div className="mt-8 flex flex-wrap gap-3">{!notification.readAt&&<form action={markNotificationRead}><input type="hidden" name="id" value={notification.id}/><button className="rounded-lg bg-[#0052CC] px-4 py-2">Mark as read</button></form>}{related&&<Link className="rounded-lg border border-white/20 px-4 py-2 text-cyan-200" href={related}>Go to related page</Link>}</div>
        {related&&<p className="mt-3 text-xs text-slate-400">Older notifications may reference pages that have since moved.</p>}
      </article>
    </div>
  </main>;
}
