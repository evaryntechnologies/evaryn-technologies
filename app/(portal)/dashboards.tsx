import Link from "next/link";
import {
  ArrowRight, BadgeCheck, Briefcase, CalendarClock, CheckCircle2, ClipboardCheck, Clock, Crown, FileWarning,
  FolderKanban, Gavel, HandCoins, Hourglass, Inbox, Landmark, Loader2, MessageSquare, RotateCcw, ScrollText,
  Send, Settings2, ShieldCheck, Stamp, Tags, Timer, UserCheck, UserCog, UserPlus, Users, UsersRound, Wallet,
  XCircle, Repeat,
} from "lucide-react";
import type { DashboardMetrics } from "@/lib/tasks/dashboard-metrics";
import type { Attention, MyMoney, People, Pipeline, UpcomingTask } from "@/lib/tasks/role-dashboard";
import { money, when } from "./dashboard-ui";
import { Bento, Kpi, Lead, LeadLink, QuickLink, SectionHead, Strip, Tile, type EvTone } from "./layouts";

type Common = { firstName: string };

/* ------------------------------------------------------------------ */
/* Shared tiles                                                         */
/* ------------------------------------------------------------------ */
function MyOrdersStrip({ m, href }: { m: DashboardMetrics; href: string }) {
  return (
    <div className="evx-s12">
      <SectionHead title="My orders" hint="Every order you have worked on, at any level." aside={<Link href={href} className="evx-kpi-cta">Open statistics <ArrowRight size={13} aria-hidden="true" /></Link>} />
      <Strip items={[
        { label: "In progress", value: m.progress, tone: "cyan" },
        { label: "In revision", value: m.revision, tone: "amber" },
        { label: "Completed", value: m.completed, tone: "green" },
        { label: "Cancelled", value: m.cancelled, tone: "slate" },
      ]} />
    </div>
  );
}

function PipelineTile({ p, title }: { p: Pipeline; title: string }) {
  return (
    <div className="evx-s12">
      <SectionHead title={title} hint="Every live order in the company, by stage." />
      <Strip items={[
        { label: "Open in hub", value: p.open, tone: "blue", href: "/portal/task-hub" },
        { label: "In progress", value: p.inProgress, tone: "cyan", href: "/portal/admin/task-summary" },
        { label: "Awaiting review", value: p.awaitingReview, tone: "violet", href: "/portal/admin/review-qa" },
        { label: "Awaiting QA", value: p.awaitingQa, tone: "violet", href: "/portal/admin/review-qa" },
        { label: "In revision", value: p.revision, tone: "amber", href: "/portal/admin/task-summary" },
        { label: "With client", value: p.awaitingClient, tone: "green", href: "/portal/qa/client-actions" },
      ]} />
    </div>
  );
}

function PeopleTile({ p }: { p: People }) {
  const rows: [string, number, EvTone][] = [
    ["Taskers", p.tasker, "cyan"], ["Reviewers", p.reviewer, "blue"], ["QA", p.qa, "violet"],
    ["Admins", p.admin, "amber"], ["Super Admins", p.superAdmin, "green"],
  ];
  const max = Math.max(1, ...rows.map((r) => r[1]));
  return (
    <Tile className="evx-s5" title="Active team" aside={<span className="evx-kpi-value" style={{ fontSize: "1.4rem" }}><UsersRound size={16} aria-hidden="true" style={{ display: "inline", marginRight: 8, verticalAlign: "-2px" }} />{p.total}</span>}>
      <ul className="evx-bars">
        {rows.map(([label, n, tone]) => (
          <li key={label} className={`evx-t-${tone}`}>
            <div className="evx-bar-top"><span>{label}</span><span>{n}</span></div>
            <div className="evx-bar"><i style={{ width: `${(n / max) * 100}%` }} /></div>
          </li>
        ))}
      </ul>
    </Tile>
  );
}

function AttentionTile({ a, extraLinks }: { a: Attention; extraLinks?: { href: string; label: string; icon: typeof Gavel }[] }) {
  const items = [
    { title: "Reassignment requests", href: "/portal/admin/reassignments", icon: Repeat, tone: "violet" as const, n: a.reassignments },
    { title: "Disputes", href: "/portal/admin/disputes", icon: Gavel, tone: "rose" as const, n: a.disputes },
    { title: "Payment-method changes", href: "/portal/admin/payment-approvals", icon: Stamp, tone: "amber" as const, n: a.paymentChanges },
    { title: "New applicants", href: "/portal/admin/recruitment", icon: UserCheck, tone: "cyan" as const, n: a.applications },
    { title: "Overdue orders", href: "/portal/admin/task-summary", icon: Clock, tone: "rose" as const, n: a.overdue },
  ].filter((i) => i.n > 0);
  return (
    <Tile className="evx-s7" title="Needs your attention">
      {items.length === 0 ? (
        <p className="evx-meta" style={{ padding: "14px 0" }}><CheckCircle2 size={15} aria-hidden="true" style={{ display: "inline", marginRight: 6, verticalAlign: "-2px", color: "var(--evx-green)" }} />All caught up. There are no urgent approvals or exceptions.</p>
      ) : (
        <ul className="evx-rows">
          {items.map((i) => {
            const Icon = i.icon;
            return (
              <li key={i.href}>
                <Link href={i.href} className={`evx-row evx-t-${i.tone}`}>
                  <span className="evx-chip" aria-hidden="true"><Icon size={16} /></span>
                  <span className="evx-row-main"><p className="evx-row-title">{i.title}</p></span>
                  <span className="evx-count">{i.n}</span>
                  <ArrowRight size={15} aria-hidden="true" className="evx-muted" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      {extraLinks && extraLinks.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          {extraLinks.map((l) => { const Icon = l.icon; return <Link key={l.href} href={l.href} className="evx-btn evx-btn-ghost evx-btn-sm"><Icon size={14} aria-hidden="true" />{l.label}</Link>; })}
        </div>
      )}
    </Tile>
  );
}

/* ================================================================== */
/* TASKER                                                               */
/* ================================================================== */
export function TaskerDashboard({ firstName, metrics, money: m, upcoming }: Common & { metrics: DashboardMetrics; money: MyMoney; upcoming: UpcomingTask[] }) {
  const base = "/portal/tasker/my-tasks";
  return (
    <div className="evx-page">
      <Bento label="Tasker dashboard">
        <Lead className="evx-s8 evx-r2" icon={Briefcase} kicker="Tasker workspace" title={`Welcome back, ${firstName}`}
          subtitle="Claim work from the Task Hub, deliver it on time, and track what you have earned."
          figure={{ label: "Available balance", value: money(m.available), note: `Paid to date ${money(m.paid)}` }}
          actions={<><LeadLink href="/portal/task-hub" primary><Inbox size={16} aria-hidden="true" />Browse Task Hub</LeadLink><LeadLink href="/portal/earnings">My earnings</LeadLink></>} />
        <Kpi label="In progress" value={metrics.progress} icon={Loader2} tone="cyan" />
        <Kpi label="In revision" value={metrics.revision} icon={RotateCcw} tone="amber" accent={metrics.revision > 0} note={metrics.revision > 0 ? "Needs your changes" : undefined} />

        <Tile className="evx-s8 evx-r2" title="Next deadlines" aside={<Link href={base} className="evx-kpi-cta">Order statistics <ArrowRight size={13} aria-hidden="true" /></Link>}>
          {upcoming.length === 0 ? (
            <p className="evx-meta" style={{ padding: "14px 0" }}><CalendarClock size={15} aria-hidden="true" style={{ display: "inline", marginRight: 6, verticalAlign: "-2px" }} />Nothing is due. Pick up a new order from the Task Hub.</p>
          ) : (
            <ul className="evx-rows">
              {upcoming.map((t) => (
                <li key={t.id}>
                  <Link href={`/portal/tasker/tasks/${t.id}`} className="evx-row">
                    <span className="evx-row-main">
                      <p className="evx-row-title">{t.publicTaskId ?? t.id.slice(0, 8)} · {t.title}</p>
                      <p className="evx-row-sub">{t.status === "REWORK_REQUIRED" ? "Revision requested" : "Assigned"} · Due {when(t.deadline)}</p>
                    </span>
                    <ArrowRight size={15} aria-hidden="true" className="evx-muted" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Tile>
        <Kpi label="Completed" value={metrics.completed} icon={CheckCircle2} tone="green" />
        <Kpi label="Cancelled" value={metrics.cancelled} icon={XCircle} tone="slate" />
      </Bento>
    </div>
  );
}

/* ================================================================== */
/* REVIEWER                                                             */
/* ================================================================== */
export function ReviewerDashboard({ firstName, metrics, money: m, extras }: Common & {
  metrics: DashboardMetrics; money: MyMoney; extras: { awaiting: number; inReview: number; approved: number; sentBack: number };
}) {
  return (
    <div className="evx-page">
      <Bento label="Reviewer dashboard">
        <Lead className="evx-s8 evx-r2" icon={ClipboardCheck} kicker="Reviewer desk" title={`Welcome back, ${firstName}`}
          subtitle="Assess submitted work, give clear feedback, and pass approved submissions on to Quality Assurance."
          figure={{ label: "Submissions awaiting review", value: String(extras.awaiting), note: "Claim one from the queue to start reviewing" }}
          actions={<><LeadLink href="/portal/reviewer/queue" primary><ClipboardCheck size={16} aria-hidden="true" />Review queue</LeadLink><LeadLink href="/portal/task-hub">Task Hub ({metrics.available})</LeadLink></>} />
        <Kpi label="Reviewing now" value={extras.inReview} icon={Hourglass} tone="cyan" href="/portal/reviewer/queue" cta="Continue" />
        <Kpi label="Awaiting a tasker" value={metrics.available} icon={Inbox} tone="blue" href="/portal/task-hub" cta="Open Task Hub" />
        <Kpi label="Approved by you" value={extras.approved} icon={BadgeCheck} tone="green" />
        <Kpi label="Sent back for revision" value={extras.sentBack} icon={RotateCcw} tone="amber" />
        <Kpi label="Available balance" value={money(m.available)} icon={Wallet} tone="violet" href="/portal/earnings" cta="My earnings" />
        <MyOrdersStrip m={metrics} href="/portal/my-work" />
      </Bento>
    </div>
  );
}

/* ================================================================== */
/* QA                                                                   */
/* ================================================================== */
export function QaDashboard({ firstName, metrics, money: m, extras }: Common & {
  metrics: DashboardMetrics; money: MyMoney;
  extras: { awaiting: number; awaitingReview: number; inQa: number; deliveredToClient: number; passed: number; sentBack: number };
}) {
  return (
    <div className="evx-page">
      <Bento label="Quality assurance dashboard">
        <Lead className="evx-s8 evx-r2" icon={ShieldCheck} kicker="Quality assurance" title={`Welcome back, ${firstName}`}
          subtitle="You are the final quality gate. Check approved work, then pass it for delivery or send it back."
          figure={{ label: "Awaiting QA", value: String(extras.awaiting), note: "Approved by reviewers and ready for final checks" }}
          actions={<><LeadLink href="/portal/qa/queue" primary><ShieldCheck size={16} aria-hidden="true" />QA queue</LeadLink><LeadLink href="/portal/qa/client-actions">Client actions</LeadLink></>} />
        <Kpi label="In QA now" value={extras.inQa} icon={Hourglass} tone="cyan" href="/portal/qa/queue" cta="Continue" />
        <Kpi label="Awaiting a reviewer" value={extras.awaitingReview} icon={ClipboardCheck} tone="blue" href="/portal/reviewer/queue" cta="Open review queue" />
        <Kpi className="evx-s3" label="Passed by you" value={extras.passed} icon={BadgeCheck} tone="green" />
        <Kpi className="evx-s3" label="Sent back" value={extras.sentBack} icon={RotateCcw} tone="amber" />
        <Kpi className="evx-s3" label="With client" value={extras.deliveredToClient} icon={Send} tone="blue" href="/portal/qa/client-actions" cta="Finalize" />
        <Kpi className="evx-s3" label="Available balance" value={money(m.available)} icon={Wallet} tone="violet" href="/portal/earnings" cta="My earnings" />
        <Tile className="evx-s12" title="Quick actions">
          <div className="evx-links">
            <QuickLink href="/portal/admin/fines" icon={FileWarning} title="Fines" text="Review fines on delivered work." tone="rose" />
            <QuickLink href="/portal/admin/force-reassign" icon={Repeat} title="Force reassign" text="Move an order to another employee." tone="violet" />
            <QuickLink href="/portal/task-hub" icon={Inbox} title="Task Hub" text={`${metrics.available} order${metrics.available === 1 ? "" : "s"} waiting for a tasker.`} tone="blue" />
          </div>
        </Tile>
        <MyOrdersStrip m={metrics} href="/portal/my-work" />
      </Bento>
    </div>
  );
}

/* ================================================================== */
/* ADMIN                                                                */
/* ================================================================== */
export function AdminDashboard({ firstName, pipeline, attention, people, clockRunning }: Common & {
  pipeline: Pipeline; attention: Attention; people: People; clockRunning: boolean;
}) {
  const todo = attention.reassignments + attention.disputes + attention.paymentChanges + attention.applications + attention.overdue;
  return (
    <div className="evx-page">
      <Bento label="Administrator dashboard">
        <Lead className="evx-s12" icon={Settings2} kicker="Operations centre" title={`Welcome back, ${firstName}`}
          subtitle="Publish and assign work, keep orders moving, and look after the people who deliver them."
          figure={{ label: "Items needing your attention", value: String(todo), note: todo === 0 ? "You are all caught up" : "Reassignments, disputes, approvals, applicants and overdue orders" }}
          actions={<><LeadLink href="/portal/admin/task-management" primary><FolderKanban size={16} aria-hidden="true" />Task management</LeadLink><LeadLink href="/portal/admin/time-tracker"><Timer size={16} aria-hidden="true" />{clockRunning ? "Clock running" : "Start time tracker"}</LeadLink></>} />
        <PipelineTile p={pipeline} title="Order pipeline" />
        <AttentionTile a={attention} />
        <PeopleTile p={people} />
        <Tile className="evx-s12" title="Manage">
          <div className="evx-links">
            <QuickLink href="/portal/admin/employees" icon={Tags} title="Task categories per employee" text="Choose which categories each Tasker, Reviewer and QA can handle." tone="cyan" />
            <QuickLink href="/portal/admin/task-management" icon={FolderKanban} title="Task management" text="Create, edit, publish and assign orders." tone="blue" />
            <QuickLink href="/portal/admin/review-qa" icon={ShieldCheck} title="Review & QA oversight" text="Watch the review and QA stages." tone="violet" />
            <QuickLink href="/portal/admin/fines" icon={FileWarning} title="Fines & penalties" text="Issue, review or waive fines." tone="rose" />
            <QuickLink href="/portal/admin/force-reassign" icon={Repeat} title="Force reassign" text="Move an order to another employee." tone="violet" />
            <QuickLink href="/portal/admin/order-reinstatement" icon={RotateCcw} title="Order reinstatement" text="Bring cancelled orders back into the flow." tone="amber" />
          </div>
        </Tile>
      </Bento>
    </div>
  );
}

/* ================================================================== */
/* SUPER ADMIN                                                          */
/* ================================================================== */
export function SuperAdminDashboard({ firstName, pipeline, attention, people, payroll, inquiries }: Common & {
  pipeline: Pipeline; attention: Attention; people: People;
  payroll: { awaitingApproval: number; pendingEntries: number; pendingTotal: number }; inquiries: number;
}) {
  return (
    <div className="evx-page">
      <Bento label="Super administrator dashboard">
        <Lead className="evx-s8 evx-r2" icon={Crown} kicker="Executive overview" title={`Welcome back, ${firstName}`}
          subtitle="Hire and manage people, approve and record payouts, and oversee every order in the company."
          figure={{ label: "Net payroll pending payment", value: money(payroll.pendingTotal), note: `${payroll.pendingEntries} approved entries · ${payroll.awaitingApproval} earnings awaiting your approval` }}
          actions={<><LeadLink href="/portal/super-admin/payroll" primary><Landmark size={16} aria-hidden="true" />Open payroll</LeadLink><LeadLink href="/portal/super-admin/employees"><UserPlus size={16} aria-hidden="true" />Add employee</LeadLink><LeadLink href="/portal/super-admin/payroll/pay-team"><HandCoins size={16} aria-hidden="true" />Pay team</LeadLink></>} />
        <Kpi label="Earnings awaiting approval" value={payroll.awaitingApproval} icon={Stamp} tone="amber" accent={payroll.awaitingApproval > 0} href="/portal/super-admin/payroll" cta="Review" />
        <Kpi label="Client inquiries" value={inquiries} icon={MessageSquare} tone="cyan" accent={inquiries > 0} href="/portal/super-admin/inquiries" cta="Open inbox" />
        <PipelineTile p={pipeline} title="Company order pipeline" />
        <AttentionTile a={attention} extraLinks={[{ href: "/portal/super-admin/audit-log", label: "Audit log", icon: ScrollText }]} />
        <PeopleTile p={people} />
        <Tile className="evx-s12" title="Money and people">
          <div className="evx-links">
            <QuickLink href="/portal/super-admin/payroll" icon={Landmark} title="Payroll" text="Approve earnings and record payments." tone="green" badge={payroll.awaitingApproval} />
            <QuickLink href="/portal/super-admin/employees" icon={UserCog} title="Employees" text="Add staff, set roles, suspend or restore access." tone="cyan" />
            <QuickLink href="/portal/super-admin/payroll/admin-hours" icon={Timer} title="Admin hours" text="Review tracked Admin time and pay." tone="violet" />
            <QuickLink href="/portal/super-admin/categories" icon={Tags} title="Task categories" text="Create, rename or retire categories and rates." tone="blue" />
            <QuickLink href="/portal/super-admin/recruitment" icon={Users} title="Recruitment" text="Open roles and hire applicants." tone="cyan" badge={attention.applications} />
          </div>
        </Tile>
      </Bento>
    </div>
  );
}
