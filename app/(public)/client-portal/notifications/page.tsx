import Link from "next/link";
import { Bell, CheckCheck, ArrowLeft } from "lucide-react";
import { ensureClientProfile } from "../../clients/actions";
import { listClientNotifications } from "@/lib/client-notifications";
import { openClientNotification, markClientNotificationsRead } from "./actions";

export const dynamic = "force-dynamic";
export default async function ClientNotificationsPage() {
  const client = await ensureClientProfile();
  const items = await listClientNotifications(client.id, 100);
  const unread = items[0]?.unreadCount ?? 0;
  return <main className="mx-auto max-w-4xl space-y-6 px-1 py-6 font-[Inter,sans-serif] text-[#102E51] dark:text-[#EAF7FF]">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="space-y-2"><Link href="/client-portal" className="inline-flex items-center gap-2 text-sm font-semibold text-[#7956AF] dark:text-[#D7B7FF]"><ArrowLeft size={16}/> Dashboard</Link><h1 className="flex items-center gap-3 text-2xl font-bold"><Bell className="text-[#7956AF]"/> Notifications</h1><p className="text-sm opacity-75">Messages, project updates, and delivered orders from Evaryn.</p></div>
      <form action={markClientNotificationsRead}><button className="inline-flex items-center gap-2 rounded-xl bg-[#7956AF] px-4 py-3 text-sm font-semibold text-white hover:bg-[#67469C]" type="submit"><CheckCheck size={17}/> Mark all as read</button></form>
    </div>
    <div className="rounded-2xl border border-[#A6D5E9] bg-[#F5FAFF] p-4 shadow-sm dark:border-[#426787] dark:bg-[#122F50]"><strong>{unread} unread</strong> <span className="text-sm opacity-70">· Your account only</span></div>
    <div className="overflow-hidden rounded-2xl border border-[#A6D5E9] bg-[#F5FAFF] shadow-sm dark:border-[#426787] dark:bg-[#122F50]">
      {!items.length ? <p className="p-8 text-center text-sm opacity-70">No notifications yet. We will display new messages, progress updates, and deliveries here.</p> : items.map(item => <form action={openClientNotification} key={item.eventKey} className="border-b border-[#A6D5E9]/40 last:border-0">
        <input type="hidden" name="eventKey" value={item.eventKey}/>
        <button type="submit" className={`flex w-full items-start gap-3 p-5 text-left transition hover:bg-[#E3F4FC] dark:hover:bg-[#214467] ${item.isRead ? "" : "bg-[#E8F4FD] dark:bg-[#173B60]"}`}><span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#7956AF]" style={{opacity:item.isRead?0:1}}/><span className="flex-1"><strong className="block text-sm">{item.title}</strong><span className="mt-1 block whitespace-pre-wrap text-sm opacity-80">{item.body}</span><time className="mt-2 block text-xs opacity-60">{new Date(item.createdAt).toLocaleString("en-GB")}</time></span></button>
      </form>)}
    </div>
  </main>;
}
