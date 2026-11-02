import { connection } from "next/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";
import { markRead, sendPortalEmail } from "../actions";

type Mail = { id:string; direction:string; fromAddress:string; toAddress:string; subject:string; body:string; receivedAt:Date; forwardStatus:string; lastForwardError:string|null; attachmentInfo:unknown };
export default async function MessagePage({params}:{params:Promise<{id:string}>}) {
  await connection();
  await requireEmployee(["SUPER_ADMIN"]);
  const {id} = await params;
  const rows = await prisma.$queryRaw<Mail[]>`select id,direction,"fromAddress","toAddress",subject,body,"receivedAt","forwardStatus","lastForwardError","attachmentInfo" from public."EvarynEmail" where id=${id} limit 1`;
  const m = rows[0]; if (!m) notFound();
  return <main className="min-h-screen bg-[#071327] px-5 py-8 text-white sm:px-8">
    <Link className="text-cyan-300" href="/super-admin/emails">← All emails</Link>
    <section className="mt-5 max-w-4xl rounded-2xl border border-white/10 bg-[#101F39] p-6">
      <h1 className="break-words text-2xl font-bold">{m.subject}</h1>
      <p className="mt-3 break-all text-sm text-slate-300">From: {m.fromAddress}</p>
      <p className="break-all text-sm text-slate-300">To: {m.toAddress}</p>
      <p className="mt-2 text-xs text-slate-400">{new Date(m.receivedAt).toLocaleString('en-GB',{timeZone:'Africa/Nairobi'})}</p>
      {m.direction==='INBOUND' && <p className="mt-2 text-xs text-cyan-300">Gmail forwarding: {m.forwardStatus}{m.lastForwardError ? ' (check Vercel logs)' : ''}</p>}
      <pre className="mt-6 whitespace-pre-wrap break-words font-sans text-sm leading-7">{m.body}</pre>
      {m.direction==='INBOUND' && <form action={markRead} className="mt-6"><input type="hidden" name="id" value={m.id}/><button className="rounded-lg border border-cyan-600 px-4 py-2">Mark as read</button></form>}
      {m.direction==='INBOUND' && <form action={sendPortalEmail} className="mt-8 space-y-3 border-t border-white/10 pt-6">
        <h2 className="text-xl font-semibold">Reply</h2>
        <input name="replyToId" type="hidden" value={m.id}/>
        <input name="to" type="email" required defaultValue={m.fromAddress} className="w-full rounded-lg border border-white/20 bg-[#071327] p-3"/>
        <input name="subject" required defaultValue={m.subject.toLowerCase().startsWith('re:')?m.subject:`Re: ${m.subject}`} className="w-full rounded-lg border border-white/20 bg-[#071327] p-3"/>
        <textarea name="body" required rows={8} className="w-full rounded-lg border border-white/20 bg-[#071327] p-3"/>
        <button className="rounded-lg bg-cyan-700 px-5 py-3 font-semibold">Send reply</button>
      </form>}
    </section>
  </main>;
}
