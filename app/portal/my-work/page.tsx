import { connection } from "next/server";
import { Suspense } from "react";
import Link from "next/link";
import { ClipboardList, MessageSquare, Timer } from "lucide-react";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";
import { cleanTab, statusTab, workTabNames } from "@/lib/tasks/work-tabs";
import {
  PageShell,
  PageHeader,
  TabNav,
  EmptyState,
  Pill,
  card,
  btnPrimary,
  btnGhost,
  statusTone,
  prettyStatus,
  moneyFmt,
} from "@/app/portal/ui";

type Props = { searchParams: Promise<{ tab?: string }> };
type Session = { id: string; startedAt: Date; endedAt: Date | null; activeSeconds: number; rateHourly: unknown };
type Work = { id: string; title: string; category: string; status: string; type: string };

const typeTone = { "Tasker Task": "cyan", "Reviewer Task": "blue", "QA Task": "violet" } as const;

async function Content({ searchParams }: Props) {
  await connection();
  const user = await requireEmployee(["REVIEWER", "QA", "ADMIN", "SUPER_ADMIN"]);
  const person = await prisma.employeeProfile.findUnique({
    where: { authUserId: user.id },
    select: { id: true, role: true, status: true },
  });
  if (!person || person.status !== "ACTIVE")
    return <p className="p-8">Employee profile unavailable.</p>;

  const tab = cleanTab((await searchParams).tab);
  const [tasks, reviews, sessions] = await Promise.all([
    prisma.workTask.findMany({
      where: {
        OR: [
          { assignedToId: person.id },
          { claimedReviewerId: person.id },
          { submissions: { some: { OR: [{ employeeId: person.id }, { reviews: { some: { reviewerId: person.id } } }] } } },
        ],
      },
      select: {
        id: true, title: true, publicTaskId: true, category: true, status: true,
        assignedToId: true, claimedReviewerId: true,
        submissions: { select: { employeeId: true, reviews: { select: { reviewerId: true, stage: true } } } },
      },
      orderBy: { updatedAt: "desc" },
      take: 500,
    }),
    prisma.taskReview.findMany({
      where: { reviewerId: person.id },
      select: { id: true, stage: true, createdAt: true, submission: { select: { taskId: true } } },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
    user.role === "ADMIN"
      ? prisma.$queryRaw<Session[]>`SELECT id,"startedAt","endedAt","activeSeconds","rateHourly" FROM public."AdminTimeSession" WHERE "employeeId"=${person.id}::uuid ORDER BY "startedAt" DESC LIMIT 200`.catch(() => [] as Session[])
      : Promise.resolve([] as Session[]),
  ]);

  const work = new Map<string, Work>();
  for (const t of tasks) {
    const id = t.publicTaskId ?? t.id;
    const base = { id: t.id, title: `${id} · ${t.title}`, category: t.category ?? "Uncategorized", status: t.status };
    if (t.assignedToId === person.id || t.submissions.some((s) => s.employeeId === person.id))
      work.set(t.id + ":TASKER", { ...base, type: "Tasker Task" });
    if (t.claimedReviewerId === person.id || t.submissions.some((s) => s.reviews.some((r) => r.reviewerId === person.id && r.stage === "REVIEWER")))
      work.set(t.id + ":REVIEWER", { ...base, type: "Reviewer Task" });
    if (t.submissions.some((s) => s.reviews.some((r) => r.reviewerId === person.id && r.stage === "QA")))
      work.set(t.id + ":QA", { ...base, type: "QA Task" });
  }
  // Preserve history of review contributions even if a claim was subsequently reassigned.
  for (const r of reviews) {
    const t = tasks.find((x) => x.id === r.submission.taskId);
    if (t) {
      const k = t.id + ":" + r.stage;
      if (!work.has(k))
        work.set(k, {
          id: t.id,
          title: `${t.publicTaskId ?? t.id} · ${t.title}`,
          category: t.category ?? "Uncategorized",
          status: t.status,
          type: r.stage === "QA" ? "QA Task" : "Reviewer Task",
        });
    }
  }

  const all = [...work.values()];
  const chosen = all.filter((x) => tab === "all" || statusTab(x.status) === tab);
  const keys = ["all", "progress", "revision", "completed", "cancelled"] as const;
  const count = (k: (typeof keys)[number]) =>
    k === "all" ? all.length : all.filter((x) => statusTab(x.status) === k).length;

  return (
    <>
      <PageHeader
        eyebrow="My work"
        title={workTabNames[tab]}
        subtitle="Work is labelled by the level you performed it at, including earlier Tasker, Reviewer and QA contributions."
        actions={<Link href="/portal/task-hub" className={btnPrimary}>Task Hub</Link>}
      />

      <TabNav
        label="Order status"
        tabs={keys.map((k) => ({
          key: k,
          label: workTabNames[k].replace(" Orders", ""),
          href: k === "all" ? "/portal/my-work" : `/portal/my-work?tab=${k}`,
          count: count(k),
          active: tab === k,
        }))}
      />

      <div className="mt-6">
        {chosen.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No matching work" text="Work will appear here as you claim and complete it." />
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {chosen.map((w, i) => (
              <article key={`${w.id}-${w.type}-${i}`} className={`${card} flex flex-col p-5`}>
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone={typeTone[w.type as keyof typeof typeTone] ?? "cyan"}>{w.type}</Pill>
                  <Pill tone={statusTone(w.status)}>{prettyStatus(w.status)}</Pill>
                </div>
                <h2 className="mt-3 text-lg font-bold leading-snug">{w.title}</h2>
                <p className="mt-1 text-sm text-[var(--ev-muted)]">{w.category}</p>
                <div className="mt-4 flex flex-1 items-end">
                  <Link href={`/portal/tasks/${w.id}/discussion`} className={btnGhost}>
                    <MessageSquare size={15} aria-hidden="true" /> Order discussion
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {user.role === "ADMIN" && (
        <section className="mt-12">
          <div className="mb-3 flex items-center gap-3">
            <Timer size={19} className="text-[var(--ev-accent-text)]" aria-hidden="true" />
            <h2 className="text-lg font-bold">Admin time · tracked sessions</h2>
          </div>
          <p className="mb-4 text-sm text-[var(--ev-muted)]">
            Recorded hours and accrued amount. Approval and payment status stay in the payroll system.
          </p>
          {sessions.length === 0 ? (
            <p className="text-sm text-[var(--ev-muted)]">No tracked Admin sessions recorded.</p>
          ) : (
            <ul className="divide-y divide-[var(--ev-border-soft)] overflow-hidden rounded-2xl border border-[var(--ev-border-soft)] bg-[var(--ev-surface)]">
              {sessions.map((s) => (
                <li key={s.id} className="grid gap-2 px-5 py-4 text-sm sm:grid-cols-5">
                  <span className="font-semibold">{s.startedAt.toLocaleDateString("en-KE", { timeZone: "Africa/Nairobi" })}</span>
                  <span className="text-[var(--ev-muted)]">Start {s.startedAt.toLocaleTimeString("en-KE", { timeZone: "Africa/Nairobi" })}</span>
                  <span className="text-[var(--ev-muted)]">End {s.endedAt?.toLocaleTimeString("en-KE", { timeZone: "Africa/Nairobi" }) ?? "Active"}</span>
                  <span>{(s.activeSeconds / 3600).toFixed(2)} hours</span>
                  <span className="font-bold tabular-nums">{moneyFmt((s.activeSeconds / 3600) * Number(s.rateHourly))}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </>
  );
}

export default function Page(p: Props) {
  return (
    <PageShell>
      <Suspense fallback={<div className={`${card} p-8 text-[var(--ev-muted)]`}>Loading your work…</div>}>
        <Content {...p} />
      </Suspense>
    </PageShell>
  );
}
