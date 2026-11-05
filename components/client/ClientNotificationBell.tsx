import Link from "next/link";
import { Bell, CheckCheck, MessageSquareText } from "lucide-react";
import { listClientNotifications } from "@/lib/client-notifications";
import { ClientNotificationCounter } from "./ClientNotificationCounter";
import { markClientNotificationsRead, openClientNotification } from "@/app/(public)/client-portal/notifications/actions";

export default async function ClientNotificationBell({clientId}: {clientId: string}) {
  const items = await listClientNotifications(clientId, 6);
  const count = items[0]?.unreadCount ?? 0;
  return (
    <details className="group relative z-40" aria-label="Client order notifications">
      <summary className="relative flex cursor-pointer list-none items-center gap-2 rounded-xl border border-[#54BCD9]/50 bg-[#102F54] px-3 py-2 text-white shadow-sm transition hover:border-[#9F7AD5] hover:bg-[#19426C] [&::-webkit-details-marker]:hidden">
        <Bell size={19} aria-hidden="true" />
        <span className="text-sm font-semibold">Notifications</span>
        <ClientNotificationCounter initial={count} />
      </summary>
      <div className="absolute right-0 mt-2 w-[min(90vw,390px)] overflow-hidden rounded-2xl border border-[#57B9DB]/40 bg-[#F5FAFE] text-[#122E51] shadow-2xl dark:border-[#42688A] dark:bg-[#102C4D] dark:text-[#E6F4FF]">
        <div className="flex items-center justify-between gap-2 border-b border-[#80B8DA]/30 px-4 py-3">
          <strong className="text-sm">Order & project updates</strong>
          <Link className="text-xs font-semibold text-[#6845A6] underline dark:text-[#D5B7FF]" href="/client-portal/notifications">View all</Link>
        </div>
        {items.length ? <div className="max-h-[380px] overflow-y-auto">
          {items.map(item => <form key={item.eventKey} action={openClientNotification}>
            <input type="hidden" name="eventKey" value={item.eventKey}/>
            <button type="submit" className={`flex w-full gap-3 border-b border-[#B5DAEC]/35 px-4 py-3 text-left transition hover:bg-[#DFF3FC] dark:hover:bg-[#20486C] ${!item.isRead ? "bg-[#E8F5FD] dark:bg-[#173B5E]" : ""}`}>
              <MessageSquareText size={17} className="mt-1 shrink-0 text-[#7956AF]" aria-hidden="true" />
              <span className="min-w-0"><span className="block text-sm font-semibold">{item.title}{!item.isRead && <span className="ml-2 inline-block h-2 w-2 rounded-full bg-[#7956AF]" />}</span><span className="mt-1 block line-clamp-2 text-xs opacity-75">{item.body}</span><time className="mt-1 block text-[11px] opacity-60">{new Date(item.createdAt).toLocaleString("en-GB")}</time></span>
            </button>
          </form>)}
        </div> : <p className="px-4 py-6 text-center text-sm opacity-75">No order updates yet.</p>}
        <form action={markClientNotificationsRead} className="border-t border-[#80B8DA]/30 p-3">
          <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#7956AF]/35 px-3 py-2 text-xs font-semibold hover:bg-[#DFF3FC] dark:hover:bg-[#20486C]" type="submit"><CheckCheck size={16} /> Mark all as read</button>
        </form>
      </div>
    </details>
  );
}
