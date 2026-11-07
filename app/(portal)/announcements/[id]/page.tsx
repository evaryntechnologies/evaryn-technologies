import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireEmployee } from "@/lib/auth/require-employee";
import { ArrowLeft, ThumbsUp, ThumbsDown, Trash2 } from "lucide-react";
import { voteMemo, deleteMemo } from "../actions";
import { loadMemos, MemoList } from "../list";
import { PageFrame, PageTitle, Pill, SplitView, btn, field } from "@/app/(portal)/layouts";

type Memo = { id: string; title: string; body: string; senderId: string | null; senderName: string; senderRole: string; publishedAt: Date };
type Count = { value: number; amount: bigint };
type Vote = { value: number };
type NamedVote = { employeeId: string; fullName: string; role: string; value: number; votedAt: Date };

export default async function MemoDetail({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const auth = await requireEmployee();
  const employee = await prisma.employeeProfile.findUnique({ where: { authUserId: auth.id }, select: { id: true, role: true, status: true } });
  if (!employee || employee.status !== "ACTIVE") notFound();
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();
  const rows = await prisma.$queryRaw<Memo[]>(Prisma.sql`
    SELECT "id", "title", "body", "senderId", "senderName", "senderRole", "publishedAt"
    FROM public."InternalMemo" WHERE "id"=${id}::uuid LIMIT 1
  `);
  const memo = rows[0];
  if (!memo) notFound();
  const [counts, votes, names, list] = await Promise.all([
    prisma.$queryRaw<Count[]>(Prisma.sql`SELECT "value",count(*)::bigint AS amount FROM public."InternalMemoVote" WHERE "memoId"=${id}::uuid GROUP BY "value"`),
    prisma.$queryRaw<Vote[]>(Prisma.sql`SELECT "value" FROM public."InternalMemoVote" WHERE "memoId"=${id}::uuid AND "employeeId"=${employee.id}::uuid LIMIT 1`),
    employee.role === "SUPER_ADMIN" ? prisma.$queryRaw<NamedVote[]>(Prisma.sql`
      SELECT v."employeeId",e."fullName",e."role"::text AS "role",v."value",v."votedAt"
      FROM public."InternalMemoVote" v JOIN public."EmployeeProfile" e ON e."id"=v."employeeId"
      WHERE v."memoId"=${id}::uuid ORDER BY v."votedAt" DESC
    `) : Promise.resolve([] as NamedVote[]),
    loadMemos("", 1),
  ]);
  const up = Number(counts.find((c) => c.value === 1)?.amount ?? BigInt(0));
  const down = Number(counts.find((c) => c.value === -1)?.amount ?? BigInt(0));
  const mine = votes[0]?.value ?? 0;
  const when = new Intl.DateTimeFormat("en-KE", { dateStyle: "long", timeStyle: "short", timeZone: "Africa/Nairobi" }).format(memo.publishedAt);
  const mayDelete = employee.role === "SUPER_ADMIN" || memo.senderId === employee.id;
  const canPublish = ["QA", "ADMIN", "SUPER_ADMIN"].includes(employee.role);
  const voteBtn = (active: boolean) => `${btn.ghost} ${btn.sm}${active ? "" : ""}`;

  return (
    <PageFrame>
      <PageTitle eyebrow="Internal communications" title="Internal memos" />
      <SplitView label="Internal memos" hasDetail
        list={<MemoList memos={list.memos} total={list.total} q="" page={1} activeId={id} canPublish={canPublish} />}
        detail={
          <>
            <Link href="/announcements" className="evx-back evx-only-mobile"><ArrowLeft size={15} aria-hidden="true" />All memos</Link>
            <article className="evx-stack" style={{ gap: 18, maxWidth: 760 }}>
              <div className="evx-msg-head">
                <p className="evx-eyebrow">Internal memorandum · Evaryn Technologies Limited</p>
                <h1>{memo.title}</h1>
                <p className="evx-meta">From <strong style={{ color: "var(--ev-ink)" }}>{memo.senderName}</strong> <Pill tone="violet" plain>{memo.senderRole.replaceAll("_", " ")}</Pill> · <time>{when}</time></p>
              </div>
              <p className="evx-prose">{memo.body}</p>
              <div className="evx-actions" style={{ paddingTop: 14, borderTop: "1px solid var(--evx-line)" }}>
                <form action={voteMemo}><input type="hidden" name="id" value={id} /><input type="hidden" name="vote" value={mine === 1 ? 0 : 1} /><button type="submit" aria-pressed={mine === 1} className={mine === 1 ? `${btn.violet} ${btn.sm}` : voteBtn(false)}><ThumbsUp size={15} aria-hidden="true" />Upvote · {up}</button></form>
                <form action={voteMemo}><input type="hidden" name="id" value={id} /><input type="hidden" name="vote" value={mine === -1 ? 0 : -1} /><button type="submit" aria-pressed={mine === -1} className={mine === -1 ? `${btn.violet} ${btn.sm}` : voteBtn(false)}><ThumbsDown size={15} aria-hidden="true" />Downvote · {down}</button></form>
              </div>

              {employee.role === "SUPER_ADMIN" && (
                <details className="evx-more">
                  <summary>Voter identities · Super Admin only</summary>
                  <div className="evx-more-body">
                    {names.length ? names.map((v) => (
                      <div key={v.employeeId} className="evx-row" style={{ padding: "6px 0" }}>
                        <span className="evx-row-main"><p className="evx-row-title">{v.fullName}</p><p className="evx-row-sub">{v.role.replaceAll("_", " ")}</p></span>
                        <Pill tone={v.value === 1 ? "cyan" : "violet"}>{v.value === 1 ? "Upvoted" : "Downvoted"}</Pill>
                      </div>
                    )) : <p className="evx-meta">No votes yet.</p>}
                  </div>
                </details>
              )}

              {mayDelete && (
                <details className="evx-more">
                  <summary style={{ color: "var(--evx-rose)" }}>Delete this memo</summary>
                  <form action={deleteMemo} className="evx-more-body evx-form">
                    <p className="evx-meta">This removes it for every employee, including its votes and linked notifications. It cannot be restored from the portal.</p>
                    <input type="hidden" name="id" value={id} />
                    <label className="evx-field"><span>Type DELETE to confirm</span><input name="confirm" required pattern="DELETE" placeholder="DELETE" autoComplete="off" className={field.input} style={{ maxWidth: 260 }} /></label>
                    <div><button type="submit" className="evx-btn evx-btn-sm" style={{ background: "#be123c", color: "#fff" }}><Trash2 size={14} aria-hidden="true" />Delete memo permanently</button></div>
                  </form>
                </details>
              )}
            </article>
          </>
        } />
    </PageFrame>
  );
}
