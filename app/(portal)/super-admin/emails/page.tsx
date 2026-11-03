import { connection } from "next/server";
import Link from "next/link";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";
import { groupEmailConversations, externalAddress } from "@/lib/evaryn-email/conversations";
import { openEmailConversation, sendPortalEmail, syncReceivedEmails } from "./actions";

type Mail = { id: string; direction: string; fromAddress: string; toAddress: string; subject: string; receivedAt: Date; isRead: boolean; forwardStatus: string };
export default async function EmailsPage() {
  await connection();
  await requireEmployee(["SUPER_ADMIN"]);
  const mails = await prisma.$queryRaw<Mail[]>`
    select id, direction, "fromAddress", "toAddress", subject, "receivedAt", "isRead", "forwardStatus"
    from public."EvarynEmail" order by "receivedAt" desc limit 100
  `;
  const conversations = groupEmailConversations(mails);
  return <main className="min-h-screen bg-[#071327] px-5 py-8 text-slate-100 sm:px-8">
    <Link className="text-sm text-cyan-300" href="/super-admin">← Super Admin</Link>
    <h1 className="mt-4 text-3xl font-bold">Company Email</h1>
    <p className="mt-2 text-slate-300">contact@evaryninc.com · Inbox and outgoing messages · Super Admin only</p>
    <div className="mt-7 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <section className="rounded-2xl border border-cyan-800/40 bg-[#101F39] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">Messages</h2><form action={syncReceivedEmails}><button type="submit" className="rounded-lg border border-cyan-500 px-3 py-2 text-sm font-semibold text-cyan-200 hover:bg-cyan-900/40">Sync Inbox from Resend</button></form></div>
        <div className="mt-4 space-y-2">{conversations.map(thread => <form key={thread.latest.id} action={openEmailConversation}><input type="hidden" name="id" value={thread.latest.id}/><button type="submit"
          className="block w-full rounded-xl border border-white/10 p-4 text-left hover:border-cyan-400/50">
          <div className="flex items-center justify-between gap-3">
            <strong className="min-w-0 truncate">{thread.latest.subject.replace(/^(?:(?:re|fw|fwd)\s*:\s*)+/i, "")}</strong>
            <div className="flex shrink-0 items-center gap-2">
              {thread.unread && <span className="text-xs text-cyan-300">New</span>}
              {thread.unreadCount > 0 && <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-red-600 px-1.5 text-xs font-bold text-white" aria-label={`${thread.unreadCount} unread messages`} title={`${thread.unreadCount} unread messages`}>{thread.unreadCount}</span>}
            </div>
          </div>
          <p className="mt-1 break-all text-sm text-slate-300">{externalAddress(thread.latest)}</p>
          <p className="mt-1 text-xs text-slate-400">Last message: {new Date(thread.latest.receivedAt).toLocaleString('en-GB', {timeZone:'Africa/Nairobi'})}</p>
        </button></form>)}{conversations.length === 0 && <p className="text-slate-300">No messages yet.</p>}</div>
      </section>
      <section className="rounded-2xl border border-cyan-800/40 bg-[#101F39] p-5">
        <h2 className="text-xl font-semibold">Compose an email</h2>
        <form action={sendPortalEmail} className="mt-4 space-y-3">
          <label className="block text-sm">To<input name="to" type="email" required maxLength={320} className="mt-1 w-full rounded-lg border border-white/20 bg-[#071327] p-3"/></label>
          <label className="block text-sm">Subject<input name="subject" required maxLength={500} className="mt-1 w-full rounded-lg border border-white/20 bg-[#071327] p-3"/></label>
          <label className="block text-sm">Message<textarea name="body" required rows={9} className="mt-1 w-full rounded-lg border border-white/20 bg-[#071327] p-3"/></label>
          <button className="rounded-lg bg-cyan-700 px-5 py-3 font-semibold text-white hover:bg-cyan-600">Send from contact@evaryninc.com</button>
        </form>
      </section>
    </div>
  </main>;
}
