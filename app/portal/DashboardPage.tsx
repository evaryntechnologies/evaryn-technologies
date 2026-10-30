import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  RotateCcw,
  Inbox,
  ArrowRight,
} from "lucide-react";
import {
  requireEmployee,
  type PortalRole,
} from "@/lib/auth/require-employee";
import { getDashboardMetrics } from "@/lib/tasks/dashboard-metrics";

const roleTitle: Record<PortalRole, string> = {
  TASKER: "Tasker",
  REVIEWER: "Reviewer",
  QA: "Quality Assurance",
  ADMIN: "Administrator",
  SUPER_ADMIN: "Super Administrator",
};

async function DashboardContent({ roles }: { roles: readonly PortalRole[] }) {
  await connection();

  const user = await requireEmployee(roles);
  const metrics = await getDashboardMetrics(user.id);

  if (!metrics) {
    return (
      <section className="rounded-2xl border border-amber-300/30 bg-[#101F39] p-8">
        <h2 className="text-xl font-bold">Employee Profile Unavailable</h2>
        <p className="mt-3 text-slate-300">
          Your employee account has not been activated. Contact your
          administrator.
        </p>
      </section>
    );
  }

  const ordersBase =
    user.role === "TASKER" ? "/portal/tasker/my-tasks" : "/portal/my-work";

  const cards = [
    {
      label: "Orders completed",
      value: metrics.completed,
      href: `${ordersBase}?tab=completed`,
      icon: CheckCircle2,
      accent: "border-l-emerald-400",
      chip: "bg-emerald-400/15 text-emerald-300",
    },
    {
      label: "Orders in progress",
      value: metrics.progress,
      href: `${ordersBase}?tab=progress`,
      icon: Loader2,
      accent: "border-l-cyan-400",
      chip: "bg-cyan-400/15 text-cyan-300",
    },
    {
      label: "Orders in revision",
      value: metrics.revision,
      href: `${ordersBase}?tab=revision`,
      icon: RotateCcw,
      accent: "border-l-amber-400",
      chip: "bg-amber-400/15 text-amber-300",
    },
    {
      label: "Orders cancelled",
      value: metrics.cancelled,
      href: `${ordersBase}?tab=cancelled`,
      icon: XCircle,
      accent: "border-l-slate-400",
      chip: "bg-slate-400/15 text-slate-300",
    },
  ];

  return (
    <>
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-cyan-300">
          {roleTitle[user.role]}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Welcome back, {user.firstName}
        </h1>
        <p className="mt-3 text-sm text-slate-300">
          A snapshot of your account. Use the menu at the top left to move
          around the workspace.
        </p>
      </header>

      <section
        aria-label="Order metrics"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {cards.map(({ label, value, href, icon: Icon, accent, chip }) => (
          <Link
            key={label}
            href={href}
            className={`group rounded-2xl border border-white/10 border-l-4 ${accent} bg-[#101F39] p-6 transition hover:border-cyan-400/40 hover:bg-[#15294B]`}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-300">{label}</p>
              <span className={`rounded-xl p-2.5 ${chip}`}>
                <Icon size={19} aria-hidden="true" />
              </span>
            </div>
            <p className="mt-5 text-4xl font-bold tabular-nums">{value}</p>
            <p className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-cyan-300 opacity-80 group-hover:opacity-100">
              View orders <ArrowRight size={13} aria-hidden="true" />
            </p>
          </Link>
        ))}
      </section>

      <Link
        href="/portal/task-hub"
        className="group mt-4 flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-white/10 border-l-4 border-l-blue-500 bg-[#101F39] p-6 transition hover:border-cyan-400/40 hover:bg-[#15294B]"
      >
        <div className="flex items-center gap-5">
          <span className="rounded-xl bg-blue-500/15 p-3 text-blue-300">
            <Inbox size={24} aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm text-slate-300">Orders available in Task Hub</p>
            <p className="mt-1 text-4xl font-bold tabular-nums">
              {metrics.available}
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-2 rounded-xl bg-[#0052CC] px-5 py-3 text-sm font-semibold text-white transition group-hover:bg-[#003F9E]">
          Open Task Hub <ArrowRight size={16} aria-hidden="true" />
        </span>
      </Link>
    </>
  );
}

export default function DashboardPage({
  roles,
}: {
  roles: readonly PortalRole[];
}) {
  return (
    <main className="min-h-screen bg-[#071327] px-5 py-9 text-white sm:px-10">
      <div className="w-full max-w-none">
        <Suspense
          fallback={
            <div className="rounded-2xl border border-white/10 bg-[#101F39] p-8 text-slate-300">
              Loading your dashboard...
            </div>
          }
        >
          <DashboardContent roles={roles} />
        </Suspense>
      </div>
    </main>
  );
}
