import { connection } from "next/server";
import Link from "next/link";
import { Suspense } from "react";
import { CalendarClock, ClipboardList, Inbox } from "lucide-react";
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
  dateTimeFmt,
} from "@/app/portal/ui";

type Props = { searchParams: Promise<{ tab?: string }> };

async function Content({ searchParams }: Props) {
  await connection();
  const user = await requireEmployee(["TASKER", "REVIEWER", "QA", "ADMIN"]);
  const profile = await prisma.employeeProfile.findUnique({
    where: { authUserId: user.id },
    select: { id: true, role: true, status: true },
  });
  if (!profile || profile.status !== "ACTIVE")
    return <p className="p-8">Your employee profile is unavailable.</p>;

  const tab = cleanTab((await searchParams).tab);
  // Include work the employee actually submitted even if the order has since changed hands.
  const tasks = await prisma.workTask.findMany({
    where: {
      OR: [
        { assignedToId: profile.id },
        { submissions: { some: { employeeId: profile.id } } },
      ],
    },
    select: {
      id: true,
      publicTaskId: true,
      title: true,
      category: true,
      description: true,
      status: true,
      deadline: true,
      assignedToId: true,
      clientPaidPercent: true,
      submissions: { where: { employeeId: profile.id }, select: { id: true }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
    take: 500,
  });

  const counts = { all: tasks.length, progress: 0, revision: 0, completed: 0, cancelled: 0 };
  for (const t of tasks) counts[statusTab(t.status)]++;
  const chosen = tasks.filter((t) => tab === "all" || statusTab(t.status) === tab);

  const keys = ["all", "progress", "revision", "completed", "cancelled"] as const;

  return (
    <>
      <PageHeader
        eyebrow="My orders"
        title={workTabNames[tab]}
        subtitle="Your current and previously submitted orders. Unclaimed orders live in the Task Hub."
        actions={
          <Link href="/portal/task-hub" className={btnPrimary}>
            <Inbox size={16} aria-hidden="true" /> Task Hub
          </Link>
        }
      />

      <TabNav
        label="Order status"
        tabs={keys.map((k) => ({
          key: k,
          label: workTabNames[k].replace(" Orders", ""),
          href: k === "all" ? "/portal/tasker/my-tasks" : `/portal/tasker/my-tasks?tab=${k}`,
          count: counts[k],
          active: tab === k,
        }))}
      />

      <div className="mt-6">
        {chosen.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No orders here yet"
            text={tab === "all" ? "Claim your first order from the Task Hub." : "Orders will appear here as they reach this stage."}
            action={<Link href="/portal/task-hub" className={btnPrimary}>Browse Task Hub</Link>}
          />
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {chosen.map((t) => (
              <article key={t.id} className={`${card} flex flex-col p-5`}>
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone={statusTone(t.status)}>{prettyStatus(t.status)}</Pill>
                  <span className="text-xs font-semibold text-[var(--ev-muted)]">
                    {t.publicTaskId ?? t.id.slice(0, 8)} · {t.category ?? "Uncategorized"}
                  </span>
                </div>
                <h2 className="mt-3 text-lg font-bold leading-snug">{t.title}</h2>
                <p className="mt-2 line-clamp-2 text-sm leading-7 text-[var(--ev-muted)]">{t.description}</p>
                {t.clientPaidPercent != null && Number(t.clientPaidPercent) > 0 && Number(t.clientPaidPercent) < 100 && (
                  <p className="mt-2 text-sm font-semibold text-[var(--ev-accent-text)]">
                    Client paid partially · {Number(t.clientPaidPercent)}% of eligible earnings
                  </p>
                )}
                <div className="mt-4 flex flex-1 flex-wrap items-end justify-between gap-3">
                  <p className="inline-flex items-center gap-1.5 text-xs text-[var(--ev-muted)]">
                    <CalendarClock size={13} aria-hidden="true" />
                    {t.deadline ? `Due ${dateTimeFmt(t.deadline)}` : "No deadline"}
                    {t.assignedToId !== profile.id ? " · previously worked on" : ""}
                  </p>
                  <Link href={`/portal/tasker/tasks/${t.id}`} className={btnGhost}>Open order</Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default function Page(p: Props) {
  return (
    <PageShell>
      <Suspense fallback={<div className={`${card} p-8 text-[var(--ev-muted)]`}>Loading orders…</div>}>
        <Content {...p} />
      </Suspense>
    </PageShell>
  );
}
