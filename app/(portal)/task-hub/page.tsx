import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { ArrowRight, ClipboardCheck, Clock, FolderKanban, Inbox, Search, ShieldCheck, Tag, X } from "lucide-react";
import { Empty, Kanban, KanbanCard, KanbanColumn, Notice, PageFrame, PageTitle, Pill, Tabs, btn, field, hoursSince, pretty, usd, waitAgo, type EvTone } from "@/app/(portal)/layouts";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";
import { claimHubTask } from "./actions";

type Props = {
  searchParams: Promise<Record<string, string | undefined>>;
};

type View = "open" | "review" | "qa";

const priorityRank: Record<string, number> = {
  URGENT: 0,
  HIGH: 1,
  NORMAL: 2,
  LOW: 3,
};

const num = (v: unknown) => (v == null ? 0 : Number(v.toString()));

async function Hub({ searchParams }: Props) {
  await connection();
  const sp = await searchParams;
  const user = await requireEmployee();

  const employee = await prisma.employeeProfile.findUnique({
    where: { authUserId: user.id },
    select: {
      id: true,
      role: true,
      status: true,
      eligibleCategories: {
        select: { category: { select: { name: true, active: true } } },
      },
    },
  });

  if (!employee || employee.status !== "ACTIVE") {
    return (
      <div className="rounded-2xl border border-[var(--ev-border-soft)] bg-[var(--ev-surface)] p-8 text-[var(--ev-muted)]">
        Employee account unavailable.
      </div>
    );
  }

  const manager = ["ADMIN", "SUPER_ADMIN"].includes(employee.role);
  const canClaim = ["TASKER", "REVIEWER", "QA"].includes(employee.role);
  const allowed = employee.eligibleCategories
    .filter((x) => x.category.active)
    .map((x) => x.category.name);
  const myOrders =
    employee.role === "TASKER" ? "/portal/tasker/my-tasks" : "/portal/my-work";

  /* ---- which tabs does this role get? ---- */
  const pendingWhere = (statuses: string[]) => ({
    status: { in: statuses },
    category: { in: allowed },
  });
  const reviewStatuses = ["PENDING_REVIEW"];
  const qaStatuses = ["PENDING_QA"];

  const hasReviewTab = employee.role === "REVIEWER" || employee.role === "QA";
  const hasQaTab = employee.role === "QA";

  const requested = (sp.view ?? "open") as View;
  const view: View =
    requested === "review" && hasReviewTab
      ? "review"
      : requested === "qa" && hasQaTab
        ? "qa"
        : "open";

  /* ---- filters (Available orders tab) ---- */
  const q = (sp.q ?? "").trim().slice(0, 80);
  const sort = ["newest", "value", "priority"].includes(sp.sort ?? "")
    ? (sp.sort as string)
    : "newest";
  const categoryRequested = (sp.category ?? "").slice(0, 100);

  const baseWhere = {
    status: "OPEN",
    assignedToId: null,
    ...(manager ? {} : { category: { in: allowed } }),
  };

  const [openCount, reviewCount, qaCount, openCategories] = await Promise.all([
    prisma.workTask.count({ where: baseWhere }),
    hasReviewTab
      ? prisma.workTask.count({ where: pendingWhere(reviewStatuses) })
      : Promise.resolve(0),
    hasQaTab
      ? prisma.workTask.count({ where: pendingWhere(qaStatuses) })
      : Promise.resolve(0),
    manager
      ? prisma.workTask.findMany({
          where: baseWhere,
          select: { category: true },
          distinct: ["category"],
        })
      : Promise.resolve([] as { category: string | null }[]),
  ]);

  const categoryOptions = manager
    ? openCategories.map((c) => c.category).filter((c): c is string => !!c).sort()
    : [...allowed].sort();
  const category = categoryOptions.includes(categoryRequested)
    ? categoryRequested
    : "";

  const filtered =
    view === "open"
      ? await prisma.workTask.findMany({
          where: {
            ...baseWhere,
            ...(category ? { category } : {}),
            ...(q
              ? {
                  OR: [
                    { title: { contains: q, mode: "insensitive" as const } },
                    { publicTaskId: { contains: q, mode: "insensitive" as const } },
                    { description: { contains: q, mode: "insensitive" as const } },
                  ],
                }
              : {}),
          },
          select: {
            id: true,
            publicTaskId: true,
            title: true,
            description: true,
            category: true,
            priority: true,
            unitsOrdered: true,
            unitRate: true,
            totalOrderCost: true,
            billingUnit: true,
            createdAt: true,
          },
          orderBy:
            sort === "value"
              ? { totalOrderCost: "desc" }
              : { createdAt: "desc" },
          take: 100,
        })
      : [];

  const orders =
    sort === "priority"
      ? [...filtered].sort(
          (a, b) =>
            (priorityRank[a.priority] ?? 2) - (priorityRank[b.priority] ?? 2) ||
            b.createdAt.getTime() - a.createdAt.getTime()
        )
      : filtered;

  const pending =
    view === "review" || view === "qa"
      ? await prisma.workTask.findMany({
          where: pendingWhere(view === "review" ? reviewStatuses : qaStatuses),
          select: {
            id: true,
            publicTaskId: true,
            title: true,
            category: true,
            status: true,
            updatedAt: true,
          },
          orderBy: { updatedAt: "asc" },
          take: 50,
        })
      : [];

  const totalValue = orders.reduce((n, t) => n + num(t.totalOrderCost), 0);
  const filtering = !!(q || category);

  const tabs: { key: View; label: string; count: number; icon: typeof Inbox }[] = [
    { key: "open", label: "Available orders", count: openCount, icon: Inbox },
  ];
  if (hasReviewTab)
    tabs.push({ key: "review", label: "Awaiting review", count: reviewCount, icon: ClipboardCheck });
  if (hasQaTab)
    tabs.push({ key: "qa", label: "Awaiting QA", count: qaCount, icon: ShieldCheck });

  const ago = (d: Date) => `${waitAgo(d)} ago`;
  const lanes: { key: string; title: string; tone: EvTone }[] = [
    { key: "URGENT", title: "Urgent", tone: "rose" },
    { key: "HIGH", title: "High priority", tone: "amber" },
    { key: "NORMAL", title: "Normal", tone: "cyan" },
    { key: "LOW", title: "Low priority", tone: "slate" },
  ];
  const laneOf = (p: string) => (lanes.some((l) => l.key === p) ? p : "NORMAL");
  const ageLanes: { title: string; tone: EvTone; test: (hours: number) => boolean }[] = [
    { title: "Waiting under 24 hours", tone: "green", test: (h) => h < 24 },
    { title: "Waiting 1 to 3 days", tone: "amber", test: (h) => h >= 24 && h < 72 },
    { title: "Waiting over 3 days", tone: "rose", test: (h) => h >= 72 },
  ];

  return (
    <PageFrame>
      <PageTitle
        eyebrow="Task Hub"
        title={manager ? "Open orders across the company" : "Find your next order"}
        description={manager
          ? "Every unclaimed order in all categories. Open one to edit or reassign it."
          : "Orders in the categories you are approved for. Claim one and it moves straight to My orders."}
        actions={manager
          ? <Link href="/portal/admin/task-management" className={btn.primary}><FolderKanban size={16} aria-hidden="true" />Create or manage tasks</Link>
          : <Link href={myOrders} className={btn.ghost}>My orders <ArrowRight size={15} aria-hidden="true" /></Link>}
      />

      {sp.claimed === "1" && (
        <Notice tone="green">
          Order claimed. Its deadlines are now running.{" "}
          <Link href={`${myOrders}?tab=progress`} style={{ fontWeight: 700, color: "var(--ev-accent-text)" }}>Go to my orders</Link>
        </Notice>
      )}

      {tabs.length > 1 && (
        <Tabs label="Task Hub sections" tabs={tabs.map((x) => ({ key: x.key, label: x.label, count: x.count, icon: x.icon, active: x.key === view, href: x.key === "open" ? "/portal/task-hub" : `/portal/task-hub?view=${x.key}` }))} />
      )}

      {view === "open" && (
        <>
          <form method="GET" className="evx-card evx-filter" role="search">
            <label className="evx-field evx-grow">
              <span className="sr-only">Search orders</span>
              <span style={{ position: "relative", display: "block" }}>
                <Search size={16} aria-hidden="true" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ev-muted)" }} />
                <input name="q" defaultValue={q} placeholder="Search by title, ID or description" className={field.input} style={{ paddingLeft: 38 }} />
              </span>
            </label>
            <label className="evx-field"><span className="sr-only">Category</span>
              <select name="category" defaultValue={category} className={field.select}>
                <option value="">All {manager ? "" : "my "}categories</option>
                {categoryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="evx-field"><span className="sr-only">Sort by</span>
              <select name="sort" defaultValue={sort} className={field.select}>
                <option value="newest">Newest first</option><option value="value">Highest value</option><option value="priority">Most urgent</option>
              </select>
            </label>
            <div className="evx-actions">
              <button type="submit" className={btn.primary}>Apply</button>
              {filtering && <Link href="/portal/task-hub" aria-label="Clear filters" className={btn.ghost}><X size={16} aria-hidden="true" /></Link>}
            </div>
          </form>

          <p className="evx-meta">
            {orders.length === 0 ? "No matching orders" : `${orders.length} order${orders.length === 1 ? "" : "s"}${filtering ? " match your filters" : " available"} · combined value ${usd(totalValue)}`}
          </p>

          {orders.length === 0 ? (
            <Empty icon={Inbox}
              title={filtering ? "Nothing matches these filters" : "No open orders right now"}
              text={filtering ? "Try a different search or clear the filters to see everything available."
                : manager ? "All orders are claimed. Create a new one from Task Management."
                : allowed.length === 0 ? "You are not approved for any categories yet. Ask an administrator to assign them."
                : "New orders appear here as soon as they are published. Check back soon."}
              action={<>{filtering && <Link href="/portal/task-hub" className={btn.primary}>Clear filters</Link>}{!manager && <Link href={myOrders} className={btn.ghost}>Go to my orders</Link>}</>} />
          ) : (
            <Kanban columns={lanes.length} label="Open orders by priority">
              {lanes.map((lane) => {
                const items = orders.filter((o) => laneOf(o.priority) === lane.key);
                return (
                  <KanbanColumn key={lane.key} title={lane.title} count={items.length} tone={lane.tone} empty="No orders at this priority">
                    {items.map((t) => {
                      const unit = t.billingUnit?.replaceAll("_", " ").toLowerCase() ?? "units";
                      return (
                        <KanbanCard key={t.id} tone={lane.tone}>
                          <div className="evx-kcard-top">
                            <Pill tone="cyan" plain><Tag size={11} aria-hidden="true" />{t.category ?? "Uncategorized"}</Pill>
                            <span className="evx-id">{t.publicTaskId ?? "Open order"}</span>
                          </div>
                          <h3 className="evx-kcard-title">{t.title}</h3>
                          <p className="evx-kcard-text">{t.description}</p>
                          <dl className="evx-facts">
                            <div><dt>Volume</dt><dd>{t.unitsOrdered ? num(t.unitsOrdered).toLocaleString("en-US") : "—"} <span className="evx-muted" style={{ fontWeight: 500, fontSize: 11 }}>{unit}</span></dd></div>
                            <div><dt>Rate</dt><dd>{t.unitRate ? usd(num(t.unitRate)) : "—"}</dd></div>
                            <div><dt>Value</dt><dd style={{ color: "var(--ev-accent-text)" }}>{t.totalOrderCost ? usd(num(t.totalOrderCost)) : "—"}</dd></div>
                          </dl>
                          <div className="evx-kcard-foot">
                            <span className="evx-meta" style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Clock size={13} aria-hidden="true" />{ago(t.createdAt)}</span>
                            {canClaim ? (
                              <form action={claimHubTask}><input type="hidden" name="taskId" value={t.id} /><button type="submit" className={`${btn.primary} ${btn.sm}`}>Claim order</button></form>
                            ) : (
                              <Link href={`/portal/admin/task-management/edit/${t.id}`} className={`${btn.ghost} ${btn.sm}`}>Manage <ArrowRight size={13} aria-hidden="true" /></Link>
                            )}
                          </div>
                        </KanbanCard>
                      );
                    })}
                  </KanbanColumn>
                );
              })}
            </Kanban>
          )}
        </>
      )}

      {(view === "review" || view === "qa") && (
        <>
          <div className="evx-head">
            <p className="evx-meta">
              {pending.length === 0 ? "Nothing is waiting for you right now."
                : `${pending.length} order${pending.length === 1 ? "" : "s"} in your categories waiting for ${view === "review" ? "review" : "quality assurance"}.`}
            </p>
            <Link href={view === "review" ? "/portal/reviewer/queue" : "/portal/qa/queue"} className={btn.primary}>
              Open {view === "review" ? "review" : "QA"} queue <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
          {pending.length > 0 && (
            <Kanban columns={ageLanes.length} label="Orders by waiting time">
              {ageLanes.map((lane) => {
                const items = pending.filter((t) => lane.test(hoursSince(t.updatedAt)));
                return (
                  <KanbanColumn key={lane.title} title={lane.title} count={items.length} tone={lane.tone} empty="Nothing in this lane">
                    {items.map((t) => (
                      <KanbanCard key={t.id} tone={lane.tone}>
                        <div className="evx-kcard-top"><Pill tone={view === "review" ? "blue" : "violet"}>{pretty(t.status)}</Pill><span className="evx-id">{t.publicTaskId ?? t.id.slice(0, 8)}</span></div>
                        <h3 className="evx-kcard-title">{t.title}</h3>
                        <p className="evx-meta">{t.category ?? "Uncategorized"} · waiting {ago(t.updatedAt).replace(" ago", "")}</p>
                      </KanbanCard>
                    ))}
                  </KanbanColumn>
                );
              })}
            </Kanban>
          )}
        </>
      )}
    </PageFrame>
  );
}

export default function Page(props: Props) {
  return (
    <Suspense fallback={<div className="evx-page"><div className="evx-card evx-card-pad evx-muted">Loading Task Hub…</div></div>}>
      <Hub {...props} />
    </Suspense>
  );
}
