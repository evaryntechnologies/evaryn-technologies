import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireEmployee } from "@/lib/auth/require-employee";
import ConversationThread, { type ConversationMessage } from "@/components/special-messages/ConversationThread";
import { ArrowLeft, Users } from "lucide-react";
import { loadThreads, ThreadList } from "../list";
import { PageFrame, PageTitle, Pill, SplitView } from "@/app/(portal)/layouts";

type Thread = { id: string; subject: string; scope: string; createdAt: Date };
type MessageRow = Omit<ConversationMessage, "createdAt"> & { createdAt: Date };
type Participant = { id: string; fullName: string; role: string };
const fmt = (d: Date) => new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Nairobi" }).format(d);

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const auth = await requireEmployee();
  const person = await prisma.employeeProfile.findUnique({ where: { authUserId: auth.id }, select: { id: true } });
  if (!person) notFound();
  const id = (await params).id;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const found = await prisma.$queryRaw<Thread[]>(Prisma.sql`
    SELECT c."id",c."subject",c."scope",c."createdAt" FROM public."InternalConversation" c
    WHERE c."id"=${id}::uuid AND (c."scope"='GENERAL' OR EXISTS (
      SELECT 1 FROM public."InternalConversationParticipant" p WHERE p."conversationId"=c."id" AND p."employeeId"=${person.id}::uuid
    )) LIMIT 1;
  `);
  const thread = found[0];
  if (!thread) notFound();
  const [messages, participants, threads] = await Promise.all([
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
    loadThreads(person.id, ""),
  ]);
  const hydrated: ConversationMessage[] = messages.reverse().map((m) => ({ ...m, createdAt: new Date(m.createdAt).toISOString() }));

  return (
    <PageFrame>
      <PageTitle eyebrow="Communication" title="Special messages" description="General chat, private messages and group discussions." />
      <SplitView label="Special messages" hasDetail
        list={<ThreadList threads={threads} activeId={id} search="" />}
        detail={
          <>
            <Link href="/special-messages" className="evx-back evx-only-mobile"><ArrowLeft size={15} aria-hidden="true" />All conversations</Link>
            <div className="evx-msg-head">
              <div><Pill tone={thread.scope === "GENERAL" ? "cyan" : "violet"}>{thread.scope === "GENERAL" ? "Company-wide · General" : "Private · selected participants"}</Pill></div>
              <h1>{thread.subject}</h1>
              <p className="evx-meta">Started {fmt(thread.createdAt)}</p>
              <p className="evx-meta" style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <Users size={15} aria-hidden="true" style={{ marginTop: 3, flex: "0 0 auto" }} />
                <span><strong style={{ color: "var(--ev-ink)" }}>Reply-all audience:</strong>{" "}{thread.scope === "GENERAL" ? "All active Evaryn employees can read and reply here." : participants.map((p) => `${p.fullName} (${p.role.replaceAll("_", " ")})`).join(" · ")}</span>
              </p>
            </div>
            <ConversationThread conversationId={id} currentEmployeeId={person.id} messages={hydrated} isGeneral={thread.scope === "GENERAL"} />
          </>
        } />
    </PageFrame>
  );
}
