import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { Globe2, Lock, Plus, Search } from "lucide-react";
import Link from "next/link";
import { SplitItem, btn, field } from "@/app/(portal)/layouts";

export type Conversation = { id: string; subject: string; scope: string; updatedAt: Date; creator: string; latest: string | null; participants: bigint };

const fmt = (d: Date) => new Intl.DateTimeFormat("en-KE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Nairobi" }).format(d);

export async function loadThreads(currentId: string, search: string) {
  const filter = search ? Prisma.sql`AND c."subject" ILIKE ${"%" + search + "%"}` : Prisma.empty;
  return prisma.$queryRaw<Conversation[]>(Prisma.sql`
    SELECT c."id",c."subject",c."scope",c."updatedAt",e."fullName" AS creator,
      (SELECT m."body" FROM public."InternalConversationMessage" m WHERE m."conversationId"=c."id" ORDER BY m."createdAt" DESC,m."id" DESC LIMIT 1) AS latest,
      (SELECT count(*)::bigint FROM public."InternalConversationParticipant" p WHERE p."conversationId"=c."id") AS participants
    FROM public."InternalConversation" c
    JOIN public."EmployeeProfile" e ON e."id"=c."createdBy"
    WHERE (c."scope"='GENERAL' OR EXISTS (
      SELECT 1 FROM public."InternalConversationParticipant" p
      WHERE p."conversationId"=c."id" AND p."employeeId"=${currentId}::uuid
    )) ${filter}
    ORDER BY c."updatedAt" DESC,c."id" DESC LIMIT 100;
  `);
}

export function ThreadList({ threads, activeId, search }: { threads: Conversation[]; activeId?: string; search: string }) {
  return (
    <>
      <div className="evx-split-tools">
        <form action="/special-messages" role="search" style={{ position: "relative" }}>
          <Search size={16} aria-hidden="true" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ev-muted)" }} />
          <input type="search" name="q" defaultValue={search} placeholder="Search subjects" aria-label="Search conversations" className={field.input} style={{ paddingLeft: 38 }} />
        </form>
        <Link href="/special-messages" className={`${btn.primary} ${btn.sm}`}><Plus size={15} aria-hidden="true" />New conversation</Link>
      </div>
      <div className="evx-split-scroll">
        {threads.length === 0 ? (
          <p className="evx-meta" style={{ padding: 24, textAlign: "center" }}>No conversations found.</p>
        ) : threads.map((t) => (
          <SplitItem key={t.id} href={`/special-messages/${t.id}`} active={t.id === activeId} title={t.subject}
            tone={t.scope === "GENERAL" ? "cyan" : "violet"}
            top={<span className="evx-meta" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontWeight: 600 }}>{t.scope === "GENERAL" ? <><Globe2 size={12} aria-hidden="true" />General</> : <><Lock size={12} aria-hidden="true" />{Number(t.participants)} people</>}</span>}
            time={fmt(t.updatedAt)} snippet={t.latest ?? "No messages yet"} />
        ))}
      </div>
    </>
  );
}
