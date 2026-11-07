import { Search } from "lucide-react";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { SplitItem, field, pretty } from "@/app/(portal)/layouts";

export type ClientThread = { id: string; clientOrderCode: string | null; title: string; status: string; fullName: string; lastMessage: string | null; lastMessageAt: Date | null; messageCount: bigint };

const when = (d: Date | null) => d ? new Intl.DateTimeFormat("en-KE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Nairobi" }).format(d) : "";

export async function loadClientThreads(q: string) {
  const like = "%" + q + "%";
  const filter = q ? Prisma.sql`AND (r."title" ILIKE ${like} OR r."clientOrderCode" ILIKE ${like} OR c."fullName" ILIKE ${like})` : Prisma.empty;
  return prisma.$queryRaw<ClientThread[]>(Prisma.sql`
    SELECT r."id",r."clientOrderCode",r."title",r."status"::text AS "status",c."fullName",
      (SELECT m."body" FROM public."ClientOrderMessage" m WHERE m."requestId"=r."id" ORDER BY m."createdAt" DESC LIMIT 1) AS "lastMessage",
      (SELECT m."createdAt" FROM public."ClientOrderMessage" m WHERE m."requestId"=r."id" ORDER BY m."createdAt" DESC LIMIT 1) AS "lastMessageAt",
      (SELECT count(*) FROM public."ClientOrderMessage" m WHERE m."requestId"=r."id") AS "messageCount"
    FROM public."ClientProjectRequest" r JOIN public."ClientProfile" c ON c."id"=r."clientId"
    WHERE EXISTS(SELECT 1 FROM public."ClientOrderMessage" m WHERE m."requestId"=r."id") ${filter}
    ORDER BY "lastMessageAt" DESC LIMIT 200`);
}

export function ClientThreadList({ rows, activeId, q }: { rows: ClientThread[]; activeId?: string; q: string }) {
  return (
    <>
      <div className="evx-split-tools">
        <form action="/portal/client-messages" role="search" style={{ position: "relative" }}>
          <Search size={16} aria-hidden="true" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ev-muted)" }} />
          <input type="search" name="q" defaultValue={q} placeholder="Search order, title or client" aria-label="Search client conversations" className={field.input} style={{ paddingLeft: 38 }} />
        </form>
      </div>
      <div className="evx-split-scroll">
        {rows.length === 0 ? <p className="evx-meta" style={{ padding: 24, textAlign: "center" }}>No client messages found.</p> : rows.map((r) => (
          <SplitItem key={r.id} href={`/portal/client-messages/${r.id}`} active={r.id === activeId} tone="blue"
            title={`${r.clientOrderCode ?? r.id.slice(0, 8)} · ${r.title}`}
            top={<span className="evx-meta" style={{ fontWeight: 600 }}>{r.fullName} · {String(r.messageCount)} msg</span>}
            time={when(r.lastMessageAt)} snippet={r.lastMessage ? r.lastMessage.slice(0, 200) : pretty(r.status)} />
        ))}
      </div>
    </>
  );
}
