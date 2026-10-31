import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";
import { markNotificationRead, markAllNotificationsRead } from "./actions";

type Group = "orders"|"payments"|"general"|"account";
const groups: {key:Group;label:string}[] = [
 {key:"orders",label:"Orders & messages"},
 {key:"payments",label:"Payments & earnings"},
 {key:"general",label:"General"},
 {key:"account",label:"Account & security"},
];
function bucket(title:string, href:string|null):Group {
 const value = (title+" "+(href??"")).toLowerCase();
 if (/password|account|security|suspend|sign.?in|access|profile/.test(value)) return "account";
 if (/payroll|payment|earning|salary|payout|advance/.test(value)) return "payments";
 if (/task|order|review|qa|dispute|deadline|reassign|message|discussion|attachment|fine/.test(value)) return "orders";
 return "general";
}
async function Content({searchParams}:{searchParams:Promise<{group?:string}>}) {
 await connection();
 const auth = await requireEmployee();
 const profile = await prisma.employeeProfile.findUnique({where:{authUserId:auth.id},select:{id:true}});
 const notifications = profile ? await prisma.portalNotification.findMany({where:{recipientId:profile.id},orderBy:{createdAt:"desc"},take:250}) : [];
 const requested = (await searchParams).group;
 const selected:Group = groups.some(g=>g.key===requested) ? requested as Group : "orders";
 return <main className="min-h-screen bg-[#071327] px-4 py-8 text-white sm:px-8">
  <Link href="/portal" className="text-cyan-300 underline">Dashboard</Link>
  <h1 className="mt-5 text-3xl font-bold">Notifications</h1>
  <p className="mt-2 text-sm text-slate-300">Your task updates, payment information, announcements and account notices.</p>
  <nav aria-label="Notification categories" className="mt-6 flex flex-wrap gap-2">{groups.map(g=>{
   const count=notifications.filter(n=>bucket(n.title,n.href)===g.key && !n.readAt).length;
   return <Link key={g.key} href={`?group=${g.key}`} aria-current={selected===g.key?"page":undefined} className={`rounded-xl px-4 py-3 text-sm font-semibold ${selected===g.key?"bg-cyan-600 text-white":"border border-white/20 bg-[#101F39] text-cyan-100"}`}>{g.label}{count?` (${count})`:""}</Link>;
  })}</nav>
  <form action={markAllNotificationsRead} className="mt-5"><button className="rounded-lg border border-cyan-500/50 px-4 py-2 text-sm text-cyan-200 hover:bg-cyan-900/30">Mark all as read</button></form>
  <section className="mt-6 space-y-3">{notifications.filter(n=>bucket(n.title,n.href)===selected).map(n=><article key={n.id} className="rounded-xl border border-white/15 bg-[#101F39] p-5">
   <p className="font-semibold">{n.title} {!n.readAt&&<span className="ml-2 text-cyan-300">New</span>}</p>
   <p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">{n.body}</p>
   <p className="mt-2 text-xs text-slate-400">{n.createdAt.toLocaleString("en-KE",{timeZone:"Africa/Nairobi"})}</p>
   <div className="mt-3 flex gap-4"><Link href={`/portal/notifications/${n.id}`} className="text-cyan-300 underline">Open full notification</Link>{!n.readAt&&<form action={markNotificationRead}><input type="hidden" name="id" value={n.id}/><button className="text-cyan-300 underline">Mark read</button></form>}</div>
  </article>)}{notifications.filter(n=>bucket(n.title,n.href)===selected).length===0&&<p className="text-slate-300">No notifications in this category.</p>}</section>
 </main>;
}
export default function Page({searchParams}:{searchParams:Promise<{group?:string}>}) {return <Suspense fallback={<p>Loading notifications…</p>}><Content searchParams={searchParams}/></Suspense>}
