import { connection } from "next/server";
import Link from "next/link";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";
import { groupEmailConversations, externalAddress } from "@/lib/evaryn-email/conversations";
import { openEmailConversation, sendPortalEmail, syncReceivedEmails } from "./actions";

type Mail = { id: string; direction: string; fromAddress: string; toAddress: string; subject: string; receivedAt: Date; isRead: boolean; forwardStatus: string };
const PAGE_SIZE = 100;
// Server pagination is over grouped conversations, not individual message rows.
export default async function EmailsPage({ searchParams }: {
  searchParams: Promise<{ page?: string }>;
}) {
  await connection();
  await requireEmployee(["SUPER_ADMIN"]);
  const mails = await prisma.$queryRaw<Mail[]>`
    select id, direction, "fromAddress", "toAddress", subject, "receivedAt", "isRead", "forwardStatus"
    from public."EvarynEmail" order by "receivedAt" desc limit 5000
  `;
  const conversations = groupEmailConversations(mails);
  const params = await searchParams;
  const requested = Number(params.page || "1");
  const page = Number.isSafeInteger(requested) && requested > 0 ? requested : 1;
  const totalPages = Math.max(1, Math.ceil(conversations.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleConversations = conversations.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const firstResult = conversations.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0;
  const lastResult = Math.min(currentPage * PAGE_SIZE, conversations.length);
  return <main className="min-h-screen bg-[#071327] px-5 py-8 text-slate-100 sm:px-8">
    <Link className="text-sm text-cyan-300" href="/super-admin">← Super Admin</Link>
    <h1 className="mt-4 text-3xl font-bold">Company Email</h1>
    <p className="mt-2 text-slate-300">contact@evaryninc.com · Inbox and outgoing messages · Super Admin only</p>
    <div className="mt-5 space-y-4">
      <section className="rounded-2xl border border-cyan-800/40 bg-[#101F39] p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">Messages</h2><form action={syncReceivedEmails}><button type="submit" className="rounded-lg border border-cyan-500 px-3 py-2 text-sm font-semibold text-cyan-200 hover:bg-cyan-900/40">Sync Inbox from Resend</button></form></div>
        <div className="mt-3 space-y-1">{visibleConversations.map(thread => <form key={thread.latest.id} action={openEmailConversation}><input type="hidden" name="id" value={thread.latest.id}/><button type="submit"
          className="block w-full rounded-lg border border-white/10 px-3 py-2 text-left hover:border-cyan-400/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400">
          <div className="flex items-center justify-between gap-3">
            <strong className="min-w-0 truncate">{thread.latest.subject.replace(/^(?:(?:re|fw|fwd)\s*:\s*)+/i, "")}</strong>
            <div className="flex shrink-0 items-center gap-2">
              {thread.unread && <span className="text-xs text-cyan-300">New</span>}
              {thread.unreadCount > 0 && <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-red-600 px-1.5 text-xs font-bold text-white" aria-label={`${thread.unreadCount} unread messages`} title={`${thread.unreadCount} unread messages`}>{thread.unreadCount}</span>}
            </div>
          </div>
          <p className="mt-0.5 truncate text-xs text-slate-300">{externalAddress(thread.latest)}</p>
          <p className="mt-0.5 text-[11px] text-slate-400">Last message: {new Date(thread.latest.receivedAt).toLocaleString('en-GB', {timeZone:'Africa/Nairobi'})}</p>
        </button></form>)}{conversations.length === 0 && <p className="text-slate-300">No messages yet.</p>}</div>
        <nav aria-label="Email conversation pages" className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3 text-xs text-slate-300">
          <span>Showing {firstResult}–{lastResult} of {conversations.length} conversations · 100 per page</span>
          <div className="flex items-center gap-3">
            {currentPage > 1 ? <Link href={`/super-admin/emails?page=${currentPage - 1}`} className="rounded-lg border border-white/20 px-3 py-1.5 hover:border-cyan-400">Previous</Link> : <span className="rounded-lg border border-white/10 px-3 py-1.5 opacity-40">Previous</span>}
            <span>Page {currentPage} of {totalPages}</span>
            {currentPage < totalPages ? <Link href={`/super-admin/emails?page=${currentPage + 1}`} className="rounded-lg border border-white/20 px-3 py-1.5 hover:border-cyan-400">Next</Link> : <span className="rounded-lg border border-white/10 px-3 py-1.5 opacity-40">Next</span>}
          </div>
        </nav>
      </section>
      <details className="group rounded-xl border border-cyan-800/40 bg-[#101F39] p-3 sm:p-4">
        <summary className="w-fit cursor-pointer list-none rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300">+ Compose Email <span className="ml-1 text-xs opacity-80 group-open:hidden">▾</span><span className="ml-1 hidden text-xs opacity-80 group-open:inline">▴</span></summary>
        <form action={sendPortalEmail} className="mt-4 max-w-3xl space-y-3">
          <label className="block text-sm">To<input name="to" type="email" required maxLength={320} className="mt-1 w-full rounded-lg border border-white/20 bg-[#071327] p-3"/></label>
          <label className="block text-sm">Subject<input name="subject" required maxLength={500} className="mt-1 w-full rounded-lg border border-white/20 bg-[#071327] p-3"/></label>
          <label className="block text-sm">Message<textarea name="body" required rows={9} className="mt-1 w-full rounded-lg border border-white/20 bg-[#071327] p-3"/></label>
          <button className="rounded-lg bg-cyan-700 px-5 py-3 font-semibold text-white hover:bg-cyan-600">Send from contact@evaryninc.com</button>
        </form>
      </details>
    </div>
  </main>;
}
