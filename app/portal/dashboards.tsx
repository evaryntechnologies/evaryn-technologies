import Link from "next/link";
import type { ReactNode } from "react";
import {
  Briefcase,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FileWarning,
  Gavel,
  HandCoins,
  Inbox,
  Landmark,
  Loader2,
  MessageSquare,
  RotateCcw,
  ScrollText,
  Send,
  Settings2,
  ShieldCheck,
  Stamp,
  Tags,
  Timer,
  UserCheck,
  UserPlus,
  Users,
  UsersRound,
  Wallet,
  XCircle,
  Crown,
  Hourglass,
  BadgeCheck,
  ArrowRight,
  CalendarClock,
  UserCog,
  FolderKanban,
  Repeat,
} from "lucide-react";
import type { DashboardMetrics } from "@/lib/tasks/dashboard-metrics";
import type {
  Attention,
  MyMoney,
  People,
  Pipeline,
  UpcomingTask,
} from "@/lib/tasks/role-dashboard";
import {
  ActionTile,
  Hero,
  HeroButton,
  HeroFigure,
  MiniStat,
  Panel,
  SectionTitle,
  StatCard,
  money,
  when,
} from "./dashboard-ui";

type Common = { firstName: string };

/* ================================================================== */
/* TASKER: earn, claim, deliver                                         */
/* ================================================================== */
export function TaskerDashboard({
  firstName,
  metrics,
  money: m,
  upcoming,
}: Common & {
  metrics: DashboardMetrics;
  money: MyMoney;
  upcoming: UpcomingTask[];
}) {
  const base = "/portal/tasker/my-tasks";
  return (
    <>
      <Hero
        icon={Briefcase}
        eyebrow="Tasker workspace"
        title={`Welcome back, ${firstName}`}
        subtitle="Claim work from the Task Hub, deliver it on time, and track what you have earned."
        accent="#00b0f8"
        aside={
          <HeroFigure
            label="Available balance"
            value={money(m.available)}
            note={`Paid to date ${money(m.paid)}`}
            href="/portal/earnings"
            cta="View my earnings"
          />
        }
      >
        <HeroButton href="/portal/task-hub" primary>
          <Inbox size={16} aria-hidden="true" /> Browse Task Hub
        </HeroButton>
        <HeroButton href={base}>My orders</HeroButton>
      </Hero>

      <SectionTitle title="My orders" />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="In progress" value={metrics.progress} icon={Loader2} tone="cyan" href={`${base}?tab=progress`} cta="View orders" />
        <StatCard label="In revision" value={metrics.revision} icon={RotateCcw} tone="amber" href={`${base}?tab=revision`} cta="View orders" />
        <StatCard label="Completed" value={metrics.completed} icon={CheckCircle2} tone="green" href={`${base}?tab=completed`} cta="View orders" />
        <StatCard label="Cancelled" value={metrics.cancelled} icon={XCircle} tone="slate" href={`${base}?tab=cancelled`} cta="View orders" />
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Panel>
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 font-bold text-[var(--ev-ink)]">
              <CalendarClock size={18} className="text-[var(--ev-accent-text)]" aria-hidden="true" />
              Next deadlines
            </h2>
            <Link href={`${base}?tab=progress`} className="text-xs font-bold text-[var(--ev-accent-text)]">
              All in progress
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="mt-5 text-sm text-[var(--ev-muted)]">
              Nothing is due. Pick up a new order from the Task Hub.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-[var(--ev-border-soft)]">
              {upcoming.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/portal/tasker/tasks/${t.id}`}
                    className="flex items-center justify-between gap-4 py-3 transition hover:opacity-80"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-[var(--ev-ink)]">
                        {t.publicTaskId ?? t.id.slice(0, 8)} · {t.title}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--ev-muted)]">
                        {t.status === "REWORK_REQUIRED" ? "Revision requested" : "Assigned"} · Due {when(t.deadline)}
                      </p>
                    </div>
                    <ArrowRight size={16} className="shrink-0 text-[var(--ev-accent-text)]" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Link
          href="/portal/task-hub"
          className="group flex flex-col justify-between rounded-2xl border border-[var(--ev-border-soft)] bg-[var(--ev-surface)] p-6 shadow-[var(--ev-shadow)] transition hover:bg-[var(--ev-surface-2)]"
        >
          <div>
            <p className="text-sm font-semibold text-[var(--ev-muted)]">Available in Task Hub</p>
            <p className="mt-3 text-5xl font-bold tabular-nums text-[var(--ev-ink)]">{metrics.available}</p>
            <p className="mt-2 text-sm text-[var(--ev-muted)]">open orders you can claim in your categories</p>
          </div>
          <span className="mt-6 inline-flex w-fit items-center gap-2 rounded-xl bg-[var(--ev-primary)] px-5 py-3 text-sm font-semibold text-[var(--ev-on-primary)]">
            Open Task Hub <ArrowRight size={16} aria-hidden="true" />
          </span>
        </Link>
      </section>
    </>
  );
}

/* ================================================================== */
/* REVIEWER: the review desk                                            */
/* ================================================================== */
export function ReviewerDashboard({
  firstName,
  metrics,
  money: m,
  extras,
}: Common & {
  metrics: DashboardMetrics;
  money: MyMoney;
  extras: { awaiting: number; inReview: number; approved: number; sentBack: number };
}) {
  const base = "/portal/my-work";
  return (
    <>
      <Hero
        icon={ClipboardCheck}
        eyebrow="Reviewer desk"
        title={`Welcome back, ${firstName}`}
        subtitle="Assess submitted work, give clear feedback, and pass approved submissions on to Quality Assurance."
        accent="#7c9cff"
        aside={
          <HeroFigure
            label="Submissions awaiting review"
            value={String(extras.awaiting)}
            note="Claim one from the queue to start reviewing"
            href="/portal/reviewer/queue"
            cta="Open review queue"
          />
        }
      >
        <HeroButton href="/portal/reviewer/queue" primary>
          <ClipboardCheck size={16} aria-hidden="true" /> Review queue
        </HeroButton>
        <HeroButton href="/portal/task-hub">Task Hub ({metrics.available})</HeroButton>
      </Hero>

      <SectionTitle title="Your review activity" />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Reviewing now" value={extras.inReview} icon={Hourglass} tone="cyan" href="/portal/reviewer/queue" cta="Continue" />
        <StatCard label="Approved by you" value={extras.approved} icon={BadgeCheck} tone="green" />
        <StatCard label="Sent back for revision" value={extras.sentBack} icon={RotateCcw} tone="amber" />
        <StatCard label="Available balance" value={money(m.available)} icon={Wallet} tone="violet" href="/portal/earnings" cta="My earnings" />
      </section>

      <SectionTitle title="My orders" hint="Work you have performed at any level." />
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MiniStat label="In progress" value={metrics.progress} tone="cyan" href={`${base}?tab=progress`} />
        <MiniStat label="In revision" value={metrics.revision} tone="amber" href={`${base}?tab=revision`} />
        <MiniStat label="Completed" value={metrics.completed} tone="green" href={`${base}?tab=completed`} />
        <MiniStat label="Cancelled" value={metrics.cancelled} tone="slate" href={`${base}?tab=cancelled`} />
      </section>
    </>
  );
}

/* ================================================================== */
/* QA: final quality gate                                               */
/* ================================================================== */
export function QaDashboard({
  firstName,
  metrics,
  money: m,
  extras,
}: Common & {
  metrics: DashboardMetrics;
  money: MyMoney;
  extras: {
    awaiting: number;
    inQa: number;
    deliveredToClient: number;
    passed: number;
    sentBack: number;
  };
}) {
  const base = "/portal/my-work";
  return (
    <>
      <Hero
        icon={ShieldCheck}
        eyebrow="Quality assurance"
        title={`Welcome back, ${firstName}`}
        subtitle="You are the final quality gate. Check approved work, then pass it for delivery or send it back."
        accent="#2dd4bf"
        aside={
          <HeroFigure
            label="Awaiting QA"
            value={String(extras.awaiting)}
            note="Orders approved by reviewers and ready for final checks"
            href="/portal/qa/queue"
            cta="Open QA queue"
          />
        }
      >
        <HeroButton href="/portal/qa/queue" primary>
          <ShieldCheck size={16} aria-hidden="true" /> QA queue
        </HeroButton>
        <HeroButton href="/portal/qa/client-actions">Client actions</HeroButton>
      </Hero>

      <SectionTitle title="Quality overview" />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="In QA now" value={extras.inQa} icon={Hourglass} tone="cyan" href="/portal/qa/queue" cta="Continue" />
        <StatCard label="Passed by you" value={extras.passed} icon={BadgeCheck} tone="green" />
        <StatCard label="Sent back" value={extras.sentBack} icon={RotateCcw} tone="amber" />
        <StatCard label="With client" value={extras.deliveredToClient} icon={Send} tone="blue" href="/portal/qa/client-actions" cta="Finalize" />
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <Panel>
          <p className="flex items-center gap-2 text-sm font-semibold text-[var(--ev-muted)]">
            <Wallet size={16} aria-hidden="true" /> Available balance
          </p>
          <p className="mt-3 text-4xl font-bold tabular-nums text-[var(--ev-ink)]">{money(m.available)}</p>
          <Link href="/portal/earnings" className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[var(--ev-accent-text)]">
            My earnings <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </Panel>
        <div className="grid gap-4 sm:grid-cols-2">
          <ActionTile title="Fines" description="Review fines on delivered work." href="/portal/admin/fines" icon={FileWarning} tone="rose" />
          <ActionTile title="Force reassign" description="Move an order to another employee." href="/portal/admin/force-reassign" icon={Repeat} tone="violet" />
        </div>
      </section>

      <SectionTitle title="My orders" hint="Work you have performed at any level." />
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <MiniStat label="In progress" value={metrics.progress} tone="cyan" href={`${base}?tab=progress`} />
        <MiniStat label="In revision" value={metrics.revision} tone="amber" href={`${base}?tab=revision`} />
        <MiniStat label="Completed" value={metrics.completed} tone="green" href={`${base}?tab=completed`} />
        <MiniStat label="Cancelled" value={metrics.cancelled} tone="slate" href={`${base}?tab=cancelled`} />
        <MiniStat label="In Task Hub" value={metrics.available} tone="blue" href="/portal/task-hub" />
      </section>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Shared by Admin and Super Admin                                      */
/* ------------------------------------------------------------------ */
function PipelineStrip({ p }: { p: Pipeline }) {
  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
      <MiniStat label="Open in hub" value={p.open} tone="blue" href="/portal/task-hub" />
      <MiniStat label="In progress" value={p.inProgress} tone="cyan" href="/portal/admin/task-summary" />
      <MiniStat label="Awaiting review" value={p.awaitingReview} tone="violet" href="/portal/admin/review-qa" />
      <MiniStat label="Awaiting QA" value={p.awaitingQa} tone="teal" href="/portal/admin/review-qa" />
      <MiniStat label="In revision" value={p.revision} tone="amber" href="/portal/admin/task-summary" />
      <MiniStat label="With client" value={p.awaitingClient} tone="gold" href="/portal/qa/client-actions" />
      <MiniStat label="Completed" value={p.completed} tone="green" href="/portal/admin/task-history" />
      <MiniStat label="Cancelled" value={p.cancelled} tone="slate" href="/portal/admin/task-history" />
    </section>
  );
}

function PeopleBar({ p }: { p: People }) {
  const rows: [string, number, string][] = [
    ["Taskers", p.tasker, "#00b0f8"],
    ["Reviewers", p.reviewer, "#7c9cff"],
    ["QA", p.qa, "#2dd4bf"],
    ["Admins", p.admin, "#a78bfa"],
    ["Super Admins", p.superAdmin, "#f5b301"],
  ];
  const max = Math.max(1, ...rows.map((r) => r[1]));
  return (
    <Panel>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="flex items-center gap-2 font-bold text-[var(--ev-ink)]">
          <UsersRound size={18} className="text-[var(--ev-accent-text)]" aria-hidden="true" />
          Active team
        </h2>
        <p className="text-2xl font-bold tabular-nums text-[var(--ev-ink)]">{p.total}</p>
      </div>
      <ul className="mt-5 space-y-3">
        {rows.map(([label, n, color]) => (
          <li key={label}>
            <div className="flex justify-between text-sm">
              <span className="font-semibold text-[var(--ev-ink)]">{label}</span>
              <span className="tabular-nums text-[var(--ev-muted)]">{n}</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[var(--ev-inset)]">
              <div className="h-full rounded-full" style={{ width: `${(n / max) * 100}%`, background: color }} />
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function AttentionGrid({ a, extra }: { a: Attention; extra?: ReactNode }) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <ActionTile title="Reassignment requests" description="Employees asking to release an order." href="/portal/admin/reassignments" icon={Repeat} tone="violet" badge={a.reassignments} />
      <ActionTile title="Disputes" description="Open issues raised on orders." href="/portal/admin/disputes" icon={Gavel} tone="rose" badge={a.disputes} />
      <ActionTile title="Payment-method changes" description="Approve or reject payout detail changes." href="/portal/admin/payment-approvals" icon={Stamp} tone="amber" badge={a.paymentChanges} />
      <ActionTile title="New applicants" description="Review applications from the Careers page." href="/portal/admin/recruitment" icon={UserCheck} tone="teal" badge={a.applications} />
      <ActionTile title="Overdue orders" description="Assigned work past its deadline." href="/portal/admin/task-summary" icon={Clock} tone="rose" badge={a.overdue} />
      {extra}
    </section>
  );
}

/* ================================================================== */
/* ADMIN: run operations                                                */
/* ================================================================== */
export function AdminDashboard({
  firstName,
  pipeline,
  attention,
  people,
  clockRunning,
}: Common & {
  pipeline: Pipeline;
  attention: Attention;
  people: People;
  clockRunning: boolean;
}) {
  const todo =
    attention.reassignments + attention.disputes + attention.paymentChanges + attention.applications + attention.overdue;
  return (
    <>
      <Hero
        icon={Settings2}
        eyebrow="Operations centre"
        title={`Welcome back, ${firstName}`}
        subtitle="Publish and assign work, keep orders moving, and look after the people who deliver them."
        accent="#a78bfa"
        aside={
          <HeroFigure
            label="Items needing your attention"
            value={String(todo)}
            note={todo === 0 ? "You are all caught up" : "Reassignments, disputes, approvals, applicants and overdue orders"}
          />
        }
      >
        <HeroButton href="/portal/admin/task-management" primary>
          <FolderKanban size={16} aria-hidden="true" /> Task management
        </HeroButton>
        <HeroButton href="/portal/admin/time-tracker">
          <Timer size={16} aria-hidden="true" /> {clockRunning ? "Clock running" : "Start time tracker"}
        </HeroButton>
      </Hero>

      <SectionTitle title="Order pipeline" hint="Every live order in the company, by stage." />
      <PipelineStrip p={pipeline} />

      <SectionTitle title="Needs your attention" />
      <AttentionGrid a={attention} />

      <section className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div>
          <h2 className="mb-4 text-lg font-bold tracking-tight text-[var(--ev-ink)]">Manage</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <ActionTile title="Task categories per employee" description="Choose which categories each Tasker, Reviewer and QA can handle." href="/portal/admin/employees" icon={Tags} tone="cyan" />
            <ActionTile title="Task management" description="Create, edit, publish and assign orders." href="/portal/admin/task-management" icon={FolderKanban} tone="blue" />
            <ActionTile title="Review & QA oversight" description="Watch the review and QA stages." href="/portal/admin/review-qa" icon={ShieldCheck} tone="teal" />
            <ActionTile title="Fines & penalties" description="Issue, review or waive fines." href="/portal/admin/fines" icon={FileWarning} tone="rose" />
            <ActionTile title="Force reassign" description="Move an order to another employee." href="/portal/admin/force-reassign" icon={Repeat} tone="violet" />
            <ActionTile title="Order reinstatement" description="Bring cancelled orders back into the flow." href="/portal/admin/order-reinstatement" icon={RotateCcw} tone="amber" />
          </div>
        </div>
        <PeopleBar p={people} />
      </section>
    </>
  );
}

/* ================================================================== */
/* SUPER ADMIN: people, money and the whole company                     */
/* ================================================================== */
export function SuperAdminDashboard({
  firstName,
  pipeline,
  attention,
  people,
  payroll,
  inquiries,
}: Common & {
  pipeline: Pipeline;
  attention: Attention;
  people: People;
  payroll: { awaitingApproval: number; pendingEntries: number; pendingTotal: number };
  inquiries: number;
}) {
  return (
    <>
      <Hero
        icon={Crown}
        eyebrow="Executive overview"
        title={`Welcome back, ${firstName}`}
        subtitle="Hire and manage people, approve and record payouts, and oversee every order in the company."
        accent="#f5b301"
        aside={
          <HeroFigure
            label="Net payroll pending payment"
            value={money(payroll.pendingTotal)}
            note={`${payroll.pendingEntries} approved entries · ${payroll.awaitingApproval} earnings awaiting your approval`}
            href="/portal/super-admin/payroll"
            cta="Open payroll"
          />
        }
      >
        <HeroButton href="/portal/super-admin/employees" primary>
          <UserPlus size={16} aria-hidden="true" /> Add employee
        </HeroButton>
        <HeroButton href="/portal/super-admin/payroll/pay-team">
          <HandCoins size={16} aria-hidden="true" /> Pay team
        </HeroButton>
      </Hero>

      <SectionTitle title="Company order pipeline" />
      <PipelineStrip p={pipeline} />

      <section className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div>
          <h2 className="mb-4 text-lg font-bold tracking-tight text-[var(--ev-ink)]">Money and people</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <ActionTile title="Payroll" description="Approve earnings and record payments." href="/portal/super-admin/payroll" icon={Landmark} tone="green" badge={payroll.awaitingApproval} />
            <ActionTile title="Employees" description="Add staff, set roles, suspend or restore access." href="/portal/super-admin/employees" icon={UserCog} tone="cyan" />
            <ActionTile title="Admin hours" description="Review tracked Admin time and pay." href="/portal/super-admin/payroll/admin-hours" icon={Timer} tone="violet" />
            <ActionTile title="Task categories" description="Create, rename or retire categories and rates." href="/portal/super-admin/categories" icon={Tags} tone="blue" />
            <ActionTile title="Recruitment" description="Open roles and hire applicants." href="/portal/super-admin/recruitment" icon={Users} tone="teal" badge={attention.applications} />
            <ActionTile title="Client inquiries" description="Messages and custom requests from the website." href="/portal/super-admin/inquiries" icon={MessageSquare} tone="amber" badge={inquiries} />
          </div>
        </div>
        <PeopleBar p={people} />
      </section>

      <SectionTitle title="Needs attention" />
      <AttentionGrid
        a={attention}
        extra={
          <ActionTile title="Audit log" description="Who did what, and when." href="/portal/super-admin/audit-log" icon={ScrollText} tone="slate" />
        }
      />
    </>
  );
}
