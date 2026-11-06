import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireEmployee } from "@/lib/auth/require-employee";
import ConversationThread, { type ConversationMessage } from "@/components/special-messages/ConversationThread";
import { ArrowLeft, Users } from "lucide-react";

type Thread = { id: string; subject: string; scope: string; createdAt: Date };
type MessageRow = Omit<ConversationMessage, "createdAt"> & { createdAt: Date };
type Participant = { id: string; fullName: string; role: string };
const fmt = (d: Date) => new Intl.DateTimeFormat("en-KE", {dateStyle:"medium", timeStyle:"short", timeZone:"Africa/Nairobi"}).format(d);

export default async function ConversationPage({ params }: { params: Promise<{id:string}> }) {
  await connection();
  const auth = await requireEmployee();
  const person = await prisma.employeeProfile.findUnique({ where: {authUserId:auth.id}, select:{id:true} });
  if (!person) notFound();
  const id = (await params).id;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const threads = await prisma.$queryRaw<Thread[]>(Prisma.sql`
    SELECT c."id",c."subject",c."scope",c."createdAt" FROM public."InternalConversation" c
    WHERE c."id"=${id}::uuid AND (c."scope"='GENERAL' OR EXISTS (
      SELECT 1 FROM public."InternalConversationParticipant" p WHERE p."conversationId"=c."id" AND p."employeeId"=${person.id}::uuid
    )) LIMIT 1;
  `);
  const thread = threads[0];
  if (!thread) notFound();
  const [messages, participants] = await Promise.all([
    prisma.$queryRaw<MessageRow[]>(Prisma.sql`
      SELECT m."id", m."body", m."createdAt", m."senderId", e."fullName", e."role",
             original."id" AS "quotedId", original."body" AS "quotedBody",
             author."fullName" AS "quotedName", author."role" AS "quotedRole"
      FROM public."InternalConversationMessage" m
      JOIN public."EmployeeProfile" e ON e."id"=m."senderId"
      LEFT JOIN public."InternalConversationMessage" original
        ON original."id"=m."replyToMessageId" AND original."conversationId"=m."conversationId"
      LEFT JOIN public."EmployeeProfile" author ON author."id"=original."senderId"
      WHERE m."conversationId"=${id}::uuid
      ORDER BY m."createdAt" DESC,m."id" DESC LIMIT 300;
    `),
    thread.scope === "SELECTED" ? prisma.$queryRaw<Participant[]>(Prisma.sql`
      SELECT e."id",e."fullName",e."role" FROM public."InternalConversationParticipant" p
      JOIN public."EmployeeProfile" e ON e."id"=p."employeeId" WHERE p."conversationId"=${id}::uuid
      ORDER BY e."fullName";
    `) : Promise.resolve([] as Participant[]),
  ]);
  const hydratedMessages: ConversationMessage[] = messages.reverse().map(m => ({...m, createdAt: new Date(m.createdAt).toISOString()}));
  return <main className="mx-auto max-w-5xl space-y-6 px-4 py-7 text-[var(--ev-ink)] sm:px-7">
    <Link href="/special-messages" className="inline-flex items-center gap-2 text-sm font-semibold text-[#7956AF] dark:text-[#C4A9F4]"><ArrowLeft size={16}/>All conversations</Link>
    <header className="rounded-2xl border border-[var(--ev-border)] bg-[var(--ev-surface)] p-6 sm:p-8">
      <p className="text-xs font-bold uppercase tracking-widest text-[#7956AF] dark:text-[#C4A9F4]">{thread.scope === "GENERAL" ? "Company-wide · General" : "Private · Selected participants"}</p>
      <h1 className="mt-2 break-words text-2xl font-bold sm:text-3xl">{thread.subject}</h1>
      <p className="mt-2 text-sm text-[var(--ev-muted)]">Started {fmt(thread.createdAt)}</p>
      <div className="mt-4 rounded-xl border border-[var(--ev-border)] bg-[var(--ev-surface-2)] p-4">
        <div className="flex items-center gap-2 text-sm font-semibold"><Users size={16}/>Reply All audience</div>
        <p className="mt-2 text-sm leading-6 text-[var(--ev-muted)]">{thread.scope === "GENERAL" ? "All active Evaryn employees can read and reply here." : participants.map(p=>`${p.fullName} (${p.role.replaceAll("_", " ")})`).join(" · ")}</p>
      </div>
    </header>
    <ConversationThread conversationId={id} currentEmployeeId={person.id} messages={hydratedMessages} isGeneral={thread.scope === "GENERAL"}/>
  </main>;
}
