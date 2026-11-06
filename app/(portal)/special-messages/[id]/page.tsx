import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireEmployee } from "@/lib/auth/require-employee";
import { replyToSpecialMessage } from "../actions";
import { ArrowLeft, Send, Users } from "lucide-react";

type Thread={id:string;subject:string;scope:string;createdAt:Date};
type Message={id:string;body:string;createdAt:Date;senderId:string;fullName:string;role:string};
type Participant={id:string;fullName:string;role:string};
const fmt=(d:Date)=>new Intl.DateTimeFormat("en-KE",{dateStyle:"medium",timeStyle:"short",timeZone:"Africa/Nairobi"}).format(d);
export default async function ConversationPage({params}:{params:Promise<{id:string}>}) {
  await connection();
  const auth=await requireEmployee();
  const person=await prisma.employeeProfile.findUnique({where:{authUserId:auth.id},select:{id:true}});
  if(!person) notFound();
  const id=(await params).id;
  if(!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const threads=await prisma.$queryRaw<Thread[]>(Prisma.sql`
    SELECT c."id",c."subject",c."scope",c."createdAt" FROM public."InternalConversation" c
    WHERE c."id"=${id}::uuid AND (c."scope"='GENERAL' OR EXISTS (
      SELECT 1 FROM public."InternalConversationParticipant" p WHERE p."conversationId"=c."id" AND p."employeeId"=${person.id}::uuid
    )) LIMIT 1;
  `);
  const thread=threads[0];
  if(!thread) notFound();
  const [messages,participants]=await Promise.all([
    prisma.$queryRaw<Message[]>(Prisma.sql`
      SELECT m."id",m."body",m."createdAt",m."senderId",e."fullName",e."role"
      FROM public."InternalConversationMessage" m JOIN public."EmployeeProfile" e ON e."id"=m."senderId"
      WHERE m."conversationId"=${id}::uuid ORDER BY m."createdAt" DESC,m."id" DESC LIMIT 300;
    `),
    thread.scope==="SELECTED" ? prisma.$queryRaw<Participant[]>(Prisma.sql`
      SELECT e."id",e."fullName",e."role" FROM public."InternalConversationParticipant" p
      JOIN public."EmployeeProfile" e ON e."id"=p."employeeId" WHERE p."conversationId"=${id}::uuid
      ORDER BY e."fullName";
    `) : Promise.resolve([] as Participant[]),
  ]);
  return <main className="mx-auto max-w-5xl space-y-6 px-4 py-7 text-[var(--ev-ink)] sm:px-7"><Link href="/special-messages" className="inline-flex items-center gap-2 text-sm font-semibold text-[#7956AF] dark:text-[#C4A9F4]"><ArrowLeft size={16}/>All conversations</Link><header className="rounded-2xl border border-[var(--ev-border)] bg-[var(--ev-surface)] p-6 sm:p-8"><p className="text-xs font-bold uppercase tracking-widest text-[#7956AF] dark:text-[#C4A9F4]">{thread.scope==="GENERAL"?"Company-wide · General":"Private · Selected participants"}</p><h1 className="mt-2 break-words text-2xl font-bold sm:text-3xl">{thread.subject}</h1><p className="mt-2 text-sm text-[var(--ev-muted)]">Started {fmt(thread.createdAt)}</p><div className="mt-4 rounded-xl border border-[var(--ev-border)] bg-[var(--ev-surface-2)] p-4"><div className="flex items-center gap-2 text-sm font-semibold"><Users size={16}/>Reply All audience</div><p className="mt-2 text-sm leading-6 text-[var(--ev-muted)]">{thread.scope==="GENERAL"?"All active Evaryn employees can read and reply here.":participants.map(p=>`${p.fullName} (${p.role.replaceAll("_"," ")})`).join(" · ")}</p></div></header><section aria-label="Messages" className="space-y-3">{messages.reverse().map(m=><article key={m.id} className={`rounded-2xl border p-5 sm:p-6 ${m.senderId===person.id?"border-[#7956AF]/40 bg-[#7956AF]/10":"border-[var(--ev-border)] bg-[var(--ev-surface)]"}`}><div className="flex flex-wrap items-center justify-between gap-2"><div><span className="font-semibold">{m.fullName}</span><span className="ml-2 text-xs text-[var(--ev-muted)]">{m.role.replaceAll("_"," ")}</span></div><time className="text-xs text-[var(--ev-muted)]">{fmt(m.createdAt)}</time></div><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7">{m.body}</p></article>)}</section><section className="rounded-2xl border border-[var(--ev-border)] bg-[var(--ev-surface)] p-5 sm:p-7"><h2 className="font-bold">Reply to all</h2><p className="mt-1 text-xs text-[var(--ev-muted)]">Your reply is visible to everyone in this conversation.</p><form action={replyToSpecialMessage} className="mt-4 space-y-3"><input type="hidden" name="conversationId" value={id}/><textarea name="body" required maxLength={6000} rows={5} placeholder="Write your reply..." className="w-full rounded-xl border border-[var(--ev-border)] bg-[var(--ev-surface-2)] p-4 text-sm leading-7"/><button className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#7956AF] px-6 py-3 font-semibold text-white"><Send size={17}/>Reply to all</button></form></section></main>;
}
