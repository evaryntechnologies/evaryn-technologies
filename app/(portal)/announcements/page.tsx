import Link from "next/link";
import { connection } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireEmployee } from "@/lib/auth/require-employee";
import { publishAnnouncement } from "./actions";
import { BookOpen, Search, FileText, ArrowRight } from "lucide-react";

type Memo = { id: string; title: string; body: string; senderName: string; senderRole: string; publishedAt: Date };
const fmt = (d: Date) => new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Nairobi" }).format(d);

export default async function MemoArchive({ searchParams }: { searchParams: Promise<{q?:string; page?:string}> }) {
  await connection();
  const auth = await requireEmployee();
  const employee = await prisma.employeeProfile.findUnique({ where: { authUserId: auth.id }, select: { role: true, status: true } });
  if (!employee || employee.status !== "ACTIVE") return <main className="p-6">Access denied.</main>;
  const canPublish = ["QA", "ADMIN", "SUPER_ADMIN"].includes(employee.role);
  const params = await searchParams;
  const q = (params.q ?? "").trim().slice(0, 120);
  const page = Math.min(10000, Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1));
  const limit = 20;
  const filter = q ? Prisma.sql`WHERE "title" ILIKE ${"%" + q + "%"} OR "body" ILIKE ${"%" + q + "%"} OR "senderName" ILIKE ${"%" + q + "%"}` : Prisma.empty;
  const [memos, counts] = await Promise.all([
    prisma.$queryRaw<Memo[]>(Prisma.sql`SELECT "id", "title", "body", "senderName", "senderRole", "publishedAt" FROM public."InternalMemo" ${filter} ORDER BY "publishedAt" DESC, "id" DESC LIMIT ${limit} OFFSET ${(page-1)*limit}`),
    prisma.$queryRaw<Array<{ n: bigint }>>(Prisma.sql`SELECT COUNT(*)::bigint AS n FROM public."InternalMemo" ${filter}`),
  ]);
  const total = Number(counts[0]?.n ?? BigInt(0));
  const url = (p: number) => `/announcements?${new URLSearchParams({...(q ? {q} : {}),page:String(p)}).toString()}`;
  return <main className="mx-auto w-full max-w-6xl space-y-7 px-4 py-7 text-[var(--ev-ink)] sm:px-7">
    <header className="rounded-3xl border border-[#80AFCB]/35 bg-[var(--ev-surface)] px-6 py-7 shadow-sm sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[.18em] text-[#7956AF] dark:text-[#C4A9F4]">Evaryn · Internal Communications</p>
      <div className="mt-3 flex flex-wrap items-center gap-3"><BookOpen className="text-[#00A8D4]" size={26}/><h1 className="text-3xl font-bold tracking-tight">Internal Memos</h1></div>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--ev-muted)]">A permanent reference library for team announcements, instructions, and important communications. Notifications remain alerts; memos remain here for future reading.</p>
    </header>
    <section className="rounded-2xl border border-[var(--ev-border)] bg-[var(--ev-surface)] p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold">Memo archive</h2><p className="mt-1 text-sm text-[var(--ev-muted)]">{total.toLocaleString()} matching memo{total===1?"":"s"} · Newest first</p></div></div>
      <form method="GET" className="mt-5 flex flex-wrap gap-3"><label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-[var(--ev-border)] bg-[var(--ev-surface-2)] px-4"><Search size={17} className="shrink-0 text-[var(--ev-muted)]"/><input name="q" defaultValue={q} placeholder="Search subjects, messages, or senders" aria-label="Search internal memos" className="min-h-12 w-full min-w-0 bg-transparent text-sm outline-none"/></label><button className="min-h-12 rounded-xl bg-[#7956AF] px-5 font-semibold text-white">Search</button>{q&&<Link href="/announcements" className="self-center text-sm underline">Clear</Link>}</form>
      <div className="mt-5 space-y-3">{memos.length?memos.map(m=><Link key={m.id} href={`/announcements/${m.id}`} className="group block rounded-2xl border border-[var(--ev-border)] bg-[var(--ev-surface-2)] p-5 transition hover:border-[#7956AF]/60 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><span className="text-xs font-semibold uppercase tracking-wide text-[#7956AF] dark:text-[#C4A9F4]">{m.senderRole.replaceAll("_"," ")} · {m.senderName}</span><time className="text-xs text-[var(--ev-muted)]">{fmt(m.publishedAt)}</time></div><h3 className="mt-3 text-lg font-bold group-hover:underline">{m.title}</h3><p className="mt-2 line-clamp-2 whitespace-pre-wrap break-words text-sm leading-7 text-[var(--ev-muted)]">{m.body}</p><div className="mt-3 flex items-center gap-2 text-sm font-semibold text-[#1688B5] dark:text-[#83D7EF]">Read memo <ArrowRight size={15}/></div></Link>):<div className="rounded-2xl border border-dashed border-[var(--ev-border)] p-10 text-center text-[var(--ev-muted)]"><FileText size={25} className="mx-auto mb-3"/>No memos found.</div>}</div>
      <nav aria-label="Memo pages" className="mt-6 flex justify-between gap-3">{page>1?<Link href={url(page-1)} className="rounded-xl border border-[var(--ev-border)] px-4 py-2">Previous</Link>:<span/>}<span className="self-center text-xs text-[var(--ev-muted)]">Page {page}</span>{page*limit<total?<Link href={url(page+1)} className="rounded-xl border border-[var(--ev-border)] px-4 py-2">Next</Link>:<span/>}</nav>
    </section>
    {canPublish&&<section className="rounded-2xl border border-[var(--ev-border)] bg-[var(--ev-surface)] p-5 sm:p-7"><h2 className="text-xl font-bold">Compose a team memo</h2><p className="mt-2 text-sm leading-7 text-[var(--ev-muted)]">Send to all active employees. Every published memo is saved permanently in this archive.</p><form action={publishAnnouncement} className="mt-5 space-y-5"><label className="block text-sm font-medium">Subject<input name="title" required minLength={4} maxLength={140} className="mt-2 block min-h-12 w-full rounded-xl border border-[var(--ev-border)] bg-[var(--ev-surface-2)] px-4" placeholder="Important team announcement"/></label><label className="block text-sm font-medium">Memo<textarea name="body" required minLength={10} maxLength={4000} rows={7} className="mt-2 block w-full rounded-xl border border-[var(--ev-border)] bg-[var(--ev-surface-2)] p-4 leading-7" placeholder="Write the memo clearly..."/></label><p className="text-xs text-[var(--ev-muted)]">Company-wide memo: do not include confidential individual payroll or personnel information.</p><button type="submit" className="rounded-xl bg-[#7956AF] px-6 py-3 font-semibold text-white hover:bg-[#66459D]">Publish and notify employees</button></form></section>}
  </main>;
}
