import Link from "next/link";
import { connection } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireEmployee } from "@/lib/auth/require-employee";
import RecipientPicker from "@/components/special-messages/RecipientPicker";
import { startSpecialMessage } from "./actions";
import { MessagesSquare, MessageCircle, Send } from "lucide-react";

type Conversation = { id:string; subject:string; scope:string; updatedAt:Date; creator:string; latest:string|null; participants:bigint };
const fmt=(d:Date)=>new Intl.DateTimeFormat("en-KE",{dateStyle:"medium",timeStyle:"short",timeZone:"Africa/Nairobi"}).format(d);

export default async function SpecialMessagesPage({searchParams}:{searchParams:Promise<{q?:string}>}) {
  await connection();
  const auth=await requireEmployee();
  const current=await prisma.employeeProfile.findUnique({where:{authUserId:auth.id},select:{id:true}});
  if(!current) return <main className="p-8">Employee account not available.</main>;
  const search=String((await searchParams).q??"").trim().slice(0,100);
  const filter=search?Prisma.sql`AND c."subject" ILIKE ${"%"+search+"%"}`:Prisma.empty;
  const [threads,employees]=await Promise.all([
    prisma.$queryRaw<Conversation[]>(Prisma.sql`
      SELECT c."id",c."subject",c."scope",c."updatedAt",e."fullName" AS creator,
        (SELECT m."body" FROM public."InternalConversationMessage" m WHERE m."conversationId"=c."id" ORDER BY m."createdAt" DESC,m."id" DESC LIMIT 1) AS latest,
        (SELECT count(*)::bigint FROM public."InternalConversationParticipant" p WHERE p."conversationId"=c."id") AS participants
      FROM public."InternalConversation" c
      JOIN public."EmployeeProfile" e ON e."id"=c."createdBy"
      WHERE (c."scope"='GENERAL' OR EXISTS (
        SELECT 1 FROM public."InternalConversationParticipant" p
        WHERE p."conversationId"=c."id" AND p."employeeId"=${current.id}::uuid
      )) ${filter}
      ORDER BY c."updatedAt" DESC,c."id" DESC LIMIT 100;
    `),
    prisma.employeeProfile.findMany({where:{status:"ACTIVE",id:{not:current.id}},select:{id:true,fullName:true,role:true},orderBy:{fullName:"asc"},take:1000}),
  ]);
  return <main className="mx-auto max-w-7xl space-y-6 px-4 py-7 text-[var(--ev-ink)] sm:px-7">
    <header className="rounded-3xl border border-[var(--ev-border)] bg-[var(--ev-surface)] p-6 shadow-sm sm:p-8"><p className="text-xs font-bold uppercase tracking-[.18em] text-[#7956AF] dark:text-[#C4A9F4]">Evaryn · Communication</p><div className="mt-3 flex items-center gap-3"><MessagesSquare className="text-[#00A8D4]" size={27}/><h1 className="text-3xl font-bold">Special Messages</h1></div><p className="mt-3 text-sm leading-7 text-[var(--ev-muted)]">Private conversations, selected groups, and company-wide discussions—all inside your employee workspace.</p></header>
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)]">
      <section className="rounded-2xl border border-[var(--ev-border)] bg-[var(--ev-surface)] p-5 sm:p-6"><h2 className="text-xl font-bold">Conversations</h2><p className="mt-1 text-sm text-[var(--ev-muted)]">Only discussions you're permitted to access are shown.</p><form className="mt-4 flex gap-2"><input type="search" name="q" defaultValue={search} placeholder="Search subjects" className="min-w-0 flex-1 rounded-xl border border-[var(--ev-border)] bg-[var(--ev-surface-2)] px-4 py-3 text-sm"/><button className="rounded-xl bg-[#7956AF] px-4 py-3 text-sm font-semibold text-white">Search</button></form><div className="mt-5 space-y-3">{threads.length?threads.map(t=><Link key={t.id} href={`/special-messages/${t.id}`} className="block rounded-xl border border-[var(--ev-border)] bg-[var(--ev-surface-2)] p-4 transition hover:border-[#7956AF]"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-semibold text-[#7956AF] dark:text-[#C4A9F4]">{t.scope==="GENERAL"?"General · Everyone":`${Number(t.participants)} participants · Private`}</span><time className="text-xs text-[var(--ev-muted)]">{fmt(t.updatedAt)}</time></div><h3 className="mt-2 break-words font-bold">{t.subject}</h3><p className="mt-1 text-xs text-[var(--ev-muted)]">Started by {t.creator}</p><p className="mt-2 line-clamp-2 whitespace-pre-wrap break-words text-sm text-[var(--ev-muted)]">{t.latest??"No messages"}</p></Link>):<div className="rounded-xl border border-dashed border-[var(--ev-border)] p-8 text-center text-sm text-[var(--ev-muted)]"><MessageCircle className="mx-auto mb-3"/>No conversations found. Start one using the form.</div>}</div></section>
      <section className="rounded-2xl border border-[var(--ev-border)] bg-[var(--ev-surface)] p-5 sm:p-7"><h2 className="text-xl font-bold">Compose special message</h2><p className="mt-2 text-sm leading-7 text-[var(--ev-muted)]">Pick individual colleagues, entire teams, or General. Everyone included can reply to the entire conversation.</p><form action={startSpecialMessage} className="mt-5 space-y-5"><label className="block text-sm font-semibold">Subject<input name="subject" required minLength={3} maxLength={160} placeholder="What would you like to discuss?" className="mt-2 block min-h-12 w-full rounded-xl border border-[var(--ev-border)] bg-[var(--ev-surface-2)] px-4"/></label><RecipientPicker employees={employees}/><label className="block text-sm font-semibold">Your message<textarea name="body" required minLength={1} maxLength={6000} rows={6} placeholder="Write a clear message for your recipients..." className="mt-2 block w-full rounded-xl border border-[var(--ev-border)] bg-[var(--ev-surface-2)] p-4 leading-7"/></label><button className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#7956AF] px-6 py-3 font-semibold text-white hover:bg-[#68479E]"><Send size={18}/>Send message</button></form></section>
    </div>
  </main>;
}
