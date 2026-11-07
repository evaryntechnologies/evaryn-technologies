import Link from "next/link";
import { Search } from "lucide-react";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { SplitItem, btn, field } from "@/app/(portal)/layouts";

export type Memo = { id: string; title: string; body: string; senderName: string; senderRole: string; publishedAt: Date };
const LIMIT = 20;
const fmt = (d: Date) => new Intl.DateTimeFormat("en-KE", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Nairobi" }).format(d);

export async function loadMemos(q: string, page: number) {
  const filter = q ? Prisma.sql`WHERE "title" ILIKE ${"%" + q + "%"} OR "body" ILIKE ${"%" + q + "%"} OR "senderName" ILIKE ${"%" + q + "%"}` : Prisma.empty;
  const [memos, counts] = await Promise.all([
    prisma.$queryRaw<Memo[]>(Prisma.sql`SELECT "id", "title", "body", "senderName", "senderRole", "publishedAt" FROM public."InternalMemo" ${filter} ORDER BY "publishedAt" DESC, "id" DESC LIMIT ${LIMIT} OFFSET ${(page - 1) * LIMIT}`),
    prisma.$queryRaw<Array<{ n: bigint }>>(Prisma.sql`SELECT COUNT(*)::bigint AS n FROM public."InternalMemo" ${filter}`),
  ]);
  return { memos, total: Number(counts[0]?.n ?? BigInt(0)), limit: LIMIT };
}

export function MemoList({ memos, total, q, page, activeId, canPublish }: { memos: Memo[]; total: number; q: string; page: number; activeId?: string; canPublish: boolean }) {
  const url = (p: number) => `/announcements?${new URLSearchParams({ ...(q ? { q } : {}), page: String(p) }).toString()}`;
  return (
    <>
      <div className="evx-split-tools">
        <form method="GET" action="/announcements" role="search" style={{ position: "relative" }}>
          <Search size={16} aria-hidden="true" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ev-muted)" }} />
          <input name="q" defaultValue={q} placeholder="Search subjects, text or senders" aria-label="Search internal memos" className={field.input} style={{ paddingLeft: 38 }} />
        </form>
        {canPublish && <Link href="/announcements" className={`${btn.primary} ${btn.sm}`}>Compose a memo</Link>}
      </div>
      <div className="evx-split-scroll">
        {memos.length === 0 ? <p className="evx-meta" style={{ padding: 24, textAlign: "center" }}>No memos found.</p> : memos.map((m) => (
          <SplitItem key={m.id} href={`/announcements/${m.id}`} active={m.id === activeId} tone="violet" title={m.title}
            top={<span className="evx-meta" style={{ fontWeight: 600 }}>{m.senderName}</span>} time={fmt(m.publishedAt)} snippet={m.body} />
        ))}
      </div>
      <div className="evx-pager">
        {page > 1 ? <Link href={url(page - 1)} className="evx-kpi-cta" style={{ padding: 0 }}>Previous</Link> : <span />}
        <span>{total.toLocaleString()} memo{total === 1 ? "" : "s"} · page {page}</span>
        {page * LIMIT < total ? <Link href={url(page + 1)} className="evx-kpi-cta" style={{ padding: 0 }}>Next</Link> : <span />}
      </div>
    </>
  );
}
