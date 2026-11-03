import { connection } from "next/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";
import { conversationKey, externalAddress, type EmailConversationItem } from "@/lib/evaryn-email/conversations";
import { markRead, sendPortalEmail } from "../actions";

type Mail = EmailConversationItem & {
  body: string; lastForwardError: string | null; attachmentInfo: unknown;
};
export default async function MessagePage({params}:{params:Promise<{id:string}>}) {
  await connection();
  await requireEmployee(["SUPER_ADMIN"]);
  const { id } = await params;
  const rows = await prisma.$queryRaw<Mail[]>`
    select id,direction,"fromAddress","toAddress",subject,body,"receivedAt","isRead",
      "forwardStatus","lastForwardError","attachmentInfo","replyToId"
    from public."EvarynEmail" order by "receivedAt" desc limit 500
  `;
  const selected = rows.find(m => m.id === id);
  if (!selected) notFound();
  const key = conversationKey(selected);
  const messages = rows.filter(m => conversationKey(m) === key)
    .sort((a,b) => new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime());
  const correspondent = externalAddress(selected);
  const replyTo = [...messages].reverse().find(m => m.direction === "INBOUND");
  const baseSubject = selected.subject.replace(/^(?:(?:re|fw|fwd)\s*:\s*)+/i, "");
  return <main className="min-h-screen bg-[#071327] px-5 py-8 text-white sm:px-8">
    <Link className="text-cyan-300" href="/super-admin/emails">← All conversations</Link>
    <section className="mt-5 max-w-4xl rounded-2xl border border-white/10 bg-[#101F39] p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="break-words text-2xl font-bold">{baseSubject}</h1>
        <span className="text-xs text-slate-300">{messages.length} messages</span>
      </div>
      <p className="mt-2 break-all text-sm text-slate-300">Conversation with {correspondent}</p>
      <div className="mt-6 space-y-4">{messages.map(m =>
        <article key={m.id} className={`rounded-xl border p-4 ${m.direction === 'OUTBOUND' ? 'ml-4 border-cyan-500/30 bg-[#0D3051]' : 'mr-4 border-white/10 bg-[#071327]'}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <strong className="text-sm">{m.direction === 'OUTBOUND' ? 'Evaryn · Sent' : `${m.fromAddress} · Received`}</strong>
            <span className="text-xs text-slate-400">{new Date(m.receivedAt).toLocaleString('en-GB',{timeZone:'Africa/Nairobi'})}</span>
          </div>
          <p className="mt-1 break-all text-xs text-slate-400">To: {m.toAddress}</p>
          <pre className="mt-4 whitespace-pre-wrap break-words font-sans text-sm leading-7">{m.body}</pre>
          {m.direction==='INBOUND' && !m.isRead && <form action={markRead} className="mt-4"><input type="hidden" name="id" value={m.id}/><button className="rounded-lg border border-cyan-600 px-3 py-1.5 text-xs">Mark as read</button></form>}
        </article>
      )}</div>
      <form action={sendPortalEmail} className="mt-8 space-y-3 border-t border-white/10 pt-6">
        <h2 className="text-xl font-semibold">Reply to conversation</h2>
        {replyTo && <input name="replyToId" type="hidden" value={replyTo.id}/>}
        <input name="to" type="email" required defaultValue={correspondent} className="w-full rounded-lg border border-white/20 bg-[#071327] p-3"/>
        <input name="subject" required defaultValue={`Re: ${baseSubject}`} className="w-full rounded-lg border border-white/20 bg-[#071327] p-3"/>
        <textarea name="body" required rows={8} className="w-full rounded-lg border border-white/20 bg-[#071327] p-3"/>
        <button className="rounded-lg bg-cyan-700 px-5 py-3 font-semibold text-white hover:bg-cyan-600">Send reply</button>
      </form>
    </section>
  </main>;
}
