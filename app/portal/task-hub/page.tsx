import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FolderKanban,
  Inbox,
  Search,
  ShieldCheck,
  Tag,
  X,
  Zap,
} from "lucide-react";
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

const priorityStyle: Record<string, { label: string; cls: string }> = {
  URGENT: { label: "Urgent", cls: "bg-rose-500/15 text-rose-600 dark:text-rose-300" },
  HIGH: { label: "High priority", cls: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
  LOW: { label: "Low priority", cls: "bg-slate-500/15 text-slate-600 dark:text-slate-300" },
};

const usd = (n: number) =>
  "$" +
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const num = (v: unknown) => (v == null ? 0 : Number(v.toString()));

function ago(d: Date) {
  const mins = Math.max(1, Math.round((Date.now() - d.getTime()) / 60000));
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.round(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

const field =
  "h-11 w-full rounded-xl border border-[var(--ev-border)] bg-[var(--ev-surface)] px-3.5 text-sm text-[var(--ev-ink)] outline-none transition focus:border-[var(--ev-cyan)] focus:ring-2 focus:ring-[var(--ev-cyan)]/30";

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

  return (
    <>
      {/* ---------- Header ---------- */}
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--ev-accent-text)]">
            Task Hub
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            {manager ? "Open orders across the company" : "Find your next order"}
          </h1>
          <p className="mt-3 text-sm leading-7 text-[var(--ev-muted)]">
            {manager
              ? "Every unclaimed order in all categories. Open one to edit or reassign it."
              : "Orders in the categories you are approved for. Claim one and it moves straight to My orders."}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {manager && (
            <Link
              href="/portal/admin/task-management"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--ev-primary)] px-5 py-3 text-sm font-semibold text-[var(--ev-on-primary)] transition hover:bg-[var(--ev-primary-hover)]"
            >
              <FolderKanban size={16} aria-hidden="true" /> Create or manage tasks
            </Link>
          )}
          {!manager && (
            <Link
              href={myOrders}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--ev-border)] bg-[var(--ev-surface)] px-5 py-3 text-sm font-semibold text-[var(--ev-ink)] transition hover:bg-[var(--ev-surface-2)]"
            >
              My orders <ArrowRight size={15} aria-hidden="true" />
            </Link>
          )}
        </div>
      </header>

      {sp.claimed === "1" && (
        <div
          role="status"
          className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-5 py-4 text-sm"
        >
          <span className="flex items-center gap-2 font-semibold text-[var(--ev-ink)]">
            <CheckCircle2 size={18} className="text-emerald-500" aria-hidden="true" />
            Order claimed. Its deadlines are now running.
          </span>
          <Link
            href={`${myOrders}?tab=progress`}
            className="inline-flex items-center gap-1 font-bold text-[var(--ev-accent-text)]"
          >
            Go to my orders <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
      )}

      {/* ---------- Tabs ---------- */}
      {tabs.length > 1 && (
        <nav
          aria-label="Task Hub sections"
          className="mt-8 flex flex-wrap gap-2 rounded-2xl border border-[var(--ev-border-soft)] bg-[var(--ev-surface)] p-1.5"
        >
          {tabs.map(({ key, label, count, icon: Icon }) => {
            const active = key === view;
            return (
              <Link
                key={key}
                href={key === "open" ? "/portal/task-hub" : `/portal/task-hub?view=${key}`}
                aria-current={active ? "page" : undefined}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  active
                    ? "bg-[var(--ev-primary)] text-[var(--ev-on-primary)]"
                    : "text-[var(--ev-ink)] hover:bg-[var(--ev-surface-2)]"
                }`}
              >
                <Icon size={16} aria-hidden="true" />
                {label}
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ${
                    active ? "bg-white/25" : "bg-[var(--ev-inset)]"
                  }`}
                >
                  {count}
                </span>
              </Link>
            );
          })}
        </nav>
      )}

      {/* ---------- Available orders ---------- */}
      {view === "open" && (
        <>
          <form
            method="GET"
            className="mt-6 grid gap-3 rounded-2xl border border-[var(--ev-border-soft)] bg-[var(--ev-surface)] p-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1fr)_auto]"
          >
            <label className="relative block">
              <span className="sr-only">Search orders</span>
              <Search
                size={16}
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ev-muted)]"
              />
              <input
                name="q"
                defaultValue={q}
                placeholder="Search by title, ID or description"
                className={`${field} pl-10`}
              />
            </label>
            <label className="block">
              <span className="sr-only">Category</span>
              <select name="category" defaultValue={category} className={field}>
                <option value="">All {manager ? "" : "my "}categories</option>
                {categoryOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="sr-only">Sort by</span>
              <select name="sort" defaultValue={sort} className={field}>
                <option value="newest">Newest first</option>
                <option value="value">Highest value</option>
                <option value="priority">Most urgent</option>
              </select>
            </label>
            <div className="flex gap-2">
              <button
                type="submit"
                className="h-11 flex-1 rounded-xl bg-[var(--ev-primary)] px-5 text-sm font-semibold text-[var(--ev-on-primary)] transition hover:bg-[var(--ev-primary-hover)]"
              >
                Apply
              </button>
              {filtering && (
                <Link
                  href="/portal/task-hub"
                  aria-label="Clear filters"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--ev-border)] text-[var(--ev-ink)] transition hover:bg-[var(--ev-surface-2)]"
                >
                  <X size={17} aria-hidden="true" />
                </Link>
              )}
            </div>
          </form>

          <p className="mt-4 text-sm text-[var(--ev-muted)]">
            {orders.length === 0
              ? "No matching orders"
              : `${orders.length} order${orders.length === 1 ? "" : "s"}${filtering ? " match your filters" : " available"} · combined value ${usd(totalValue)}`}
          </p>

          {orders.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-[var(--ev-border)] bg-[var(--ev-surface)] p-10 text-center">
              <Inbox size={34} className="mx-auto text-[var(--ev-accent-text)]" aria-hidden="true" />
              <h2 className="mt-4 text-lg font-bold">
                {filtering ? "Nothing matches these filters" : "No open orders right now"}
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-[var(--ev-muted)]">
                {filtering
                  ? "Try a different search or clear the filters to see everything available."
                  : manager
                    ? "All orders are claimed. Create a new one from Task Management."
                    : allowed.length === 0
                      ? "You are not approved for any categories yet. Ask an administrator to assign them."
                      : "New orders appear here as soon as they are published. Check back soon."}
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                {filtering && (
                  <Link
                    href="/portal/task-hub"
                    className="rounded-xl bg-[var(--ev-primary)] px-5 py-3 text-sm font-semibold text-[var(--ev-on-primary)]"
                  >
                    Clear filters
                  </Link>
                )}
                {!manager && (
                  <Link
                    href={myOrders}
                    className="rounded-xl border border-[var(--ev-border)] px-5 py-3 text-sm font-semibold text-[var(--ev-ink)] hover:bg-[var(--ev-surface-2)]"
                  >
                    Go to my orders
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-5 grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
              {orders.map((t) => {
                const pr = priorityStyle[t.priority];
                const unit =
                  t.billingUnit?.replaceAll("_", " ").toLowerCase() ?? "units";
                return (
                  <article
                    key={t.id}
                    className="group flex min-w-0 flex-col rounded-2xl border border-[var(--ev-border-soft)] bg-[var(--ev-surface)] p-6 shadow-[var(--ev-shadow)] transition hover:-translate-y-0.5 hover:border-[var(--ev-cyan)]"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--ev-inset)] px-3 py-1 text-xs font-semibold text-[var(--ev-accent-text)]">
                        <Tag size={12} aria-hidden="true" />
                        {t.category ?? "Uncategorized"}
                      </span>
                      {pr && (
                        <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${pr.cls}`}>
                          <Zap size={12} aria-hidden="true" />
                          {pr.label}
                        </span>
                      )}
                      <span className="ml-auto text-xs font-semibold text-[var(--ev-muted)]">
                        {t.publicTaskId ?? "Open order"}
                      </span>
                    </div>

                    <h2 className="mt-4 text-lg font-bold leading-snug">{t.title}</h2>
                    <p className="mt-2 line-clamp-3 whitespace-pre-wrap break-words text-sm leading-7 text-[var(--ev-muted)]">
                      {t.description}
                    </p>

                    <dl className="mt-5 grid grid-cols-3 gap-3 rounded-xl bg-[var(--ev-inset)] p-4 text-sm">
                      <div>
                        <dt className="text-xs font-semibold text-[var(--ev-muted)]">Volume</dt>
                        <dd className="mt-1 font-bold capitalize tabular-nums">
                          {t.unitsOrdered ? num(t.unitsOrdered).toLocaleString("en-US") : "—"}{" "}
                          <span className="text-xs font-semibold normal-case text-[var(--ev-muted)]">{unit}</span>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold text-[var(--ev-muted)]">Rate</dt>
                        <dd className="mt-1 font-bold tabular-nums">
                          {t.unitRate ? usd(num(t.unitRate)) : "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold text-[var(--ev-muted)]">Order value</dt>
                        <dd className="mt-1 font-bold tabular-nums text-[var(--ev-accent-text)]">
                          {t.totalOrderCost ? usd(num(t.totalOrderCost)) : "—"}
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-5 flex flex-1 items-end justify-between gap-3">
                      <span className="inline-flex items-center gap-1.5 text-xs text-[var(--ev-muted)]">
                        <Clock size={13} aria-hidden="true" /> Posted {ago(t.createdAt)}
                      </span>
                      {canClaim ? (
                        <form action={claimHubTask}>
                          <input type="hidden" name="taskId" value={t.id} />
                          <button
                            type="submit"
                            className="rounded-xl bg-[var(--ev-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--ev-on-primary)] transition hover:bg-[var(--ev-primary-hover)]"
                          >
                            Claim order
                          </button>
                        </form>
                      ) : (
                        <Link
                          href={`/portal/admin/task-management/edit/${t.id}`}
                          className="inline-flex items-center gap-1 rounded-xl border border-[var(--ev-border)] px-4 py-2.5 text-sm font-semibold text-[var(--ev-ink)] transition hover:bg-[var(--ev-surface-2)]"
                        >
                          Manage <ArrowRight size={14} aria-hidden="true" />
                        </Link>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ---------- Awaiting review / QA ---------- */}
      {(view === "review" || view === "qa") && (
        <section className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[var(--ev-muted)]">
              {pending.length === 0
                ? "Nothing is waiting for you right now."
                : `${pending.length} order${pending.length === 1 ? "" : "s"} in your categories waiting for ${view === "review" ? "review" : "quality assurance"}.`}
            </p>
            <Link
              href={view === "review" ? "/portal/reviewer/queue" : "/portal/qa/queue"}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--ev-primary)] px-5 py-3 text-sm font-semibold text-[var(--ev-on-primary)] transition hover:bg-[var(--ev-primary-hover)]"
            >
              Open {view === "review" ? "review" : "QA"} queue <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>

          {pending.length > 0 && (
            <ul className="mt-5 divide-y divide-[var(--ev-border-soft)] overflow-hidden rounded-2xl border border-[var(--ev-border-soft)] bg-[var(--ev-surface)]">
              {pending.map((t) => (
                <li
                  key={t.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold">
                      {t.publicTaskId ?? t.id.slice(0, 8)} · {t.title}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--ev-muted)]">
                      {t.category ?? "Uncategorized"} · waiting since {ago(t.updatedAt)}
                    </p>
                  </div>
                  <span className="rounded-full bg-[var(--ev-inset)] px-3 py-1 text-xs font-bold text-[var(--ev-accent-text)]">
                    {t.status.replaceAll("_", " ")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </>
  );
}

export default function Page(props: Props) {
  return (
    <main className="min-h-screen bg-[var(--ev-page)] px-4 py-6 text-[var(--ev-ink)] sm:px-8 sm:py-8">
      <div className="mx-auto w-full max-w-[1400px]">
        <Suspense
          fallback={
            <div className="rounded-2xl border border-[var(--ev-border-soft)] bg-[var(--ev-surface)] p-8 text-[var(--ev-muted)]">
              Loading Task Hub...
            </div>
          }
        >
          <Hub {...props} />
        </Suspense>
      </div>
    </main>
  );
}
