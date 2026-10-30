import React from "react";
import Link from "next/link";

interface DashboardMetric {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: string;
  accent?: "blue" | "emerald" | "amber" | "purple";
}

interface DashboardPageProps {
  role?: string;
  userName?: string;
  metrics?: DashboardMetric[];
  recentTasks?: Array<{
    id: string;
    title: string;
    category: string;
    status: string;
    payout?: string;
    deadline?: string;
  }>;
}

export default function DashboardPage({
  role = "TASKER",
  userName = "Team Member",
  metrics,
  recentTasks = [],
}: DashboardPageProps) {
  const defaultMetrics: DashboardMetric[] = metrics || [
    {
      label: "Available Tasks",
      value: "24",
      subtext: "Ready in Task Hub",
      trend: "+12% today",
      accent: "blue",
    },
    {
      label: "Active In-Progress",
      value: "3",
      subtext: "Assigned to your queue",
      trend: "On schedule",
      accent: "emerald",
    },
    {
      label: "Quality Rubric Score",
      value: "98.4%",
      subtext: "Calibrated across 50 reviews",
      trend: "Top Tier",
      accent: "purple",
    },
    {
      label: "Pending Payouts",
      value: "$420.00",
      subtext: "Next cycle: Friday",
      trend: "Verified",
      accent: "amber",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="relative rounded-3xl overflow-hidden border border-white/[0.08] bg-gradient-to-r from-[#12141C] via-[#151928] to-[#0D1326] p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
              <span>Evaryn Workforce Portal</span>
              <span>•</span>
              <span className="uppercase">{role} VIEW</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Welcome back, {userName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Monitor your active task queues, review multi-stage quality rubrics, and track real-time automated rate calculations from one unified workspace.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/portal/task-hub"
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-lg shadow-blue-600/25 transition"
            >
              Launch Task Hub →
            </Link>
            <Link
              href="/portal/earnings"
              className="px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-slate-200 font-medium text-xs transition"
            >
              View Earnings Statement
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {defaultMetrics.map((m, idx) => (
          <div
            key={idx}
            className="bento-card p-5 flex flex-col justify-between bg-[#12141C] border border-white/[0.08] rounded-2xl"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">{m.label}</span>
              {m.trend && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {m.trend}
                </span>
              )}
            </div>
            <div className="my-4">
              <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {m.value}
              </div>
            </div>
            <div className="text-[11px] text-slate-500">{m.subtext}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl bg-[#12141C] border border-white/[0.08] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-semibold text-white">Active Queue & Pipeline</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time tasks currently assigned or awaiting quality verification
                </p>
              </div>
              <Link
                href="/portal/my-work"
                className="text-xs text-blue-400 hover:text-blue-300 font-medium"
              >
                Open Full Queue →
              </Link>
            </div>

            {recentTasks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 p-8 text-center space-y-3">
                <p className="text-xs text-slate-400">
                  Your personal work queue is currently clear.
                </p>
                <Link
                  href="/portal/task-hub"
                  className="inline-block px-4 py-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 text-xs font-medium hover:bg-blue-600/30 transition"
                >
                  Browse Available Tasks in Marketplace
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.08] text-[11px] uppercase text-slate-500">
                      <th className="pb-3 font-semibold">Task</th>
                      <th className="pb-3 font-semibold">Category</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold text-right">Payout</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05] text-xs">
                    {recentTasks.map((t) => (
                      <tr key={t.id} className="hover:bg-white/[0.02] transition">
                        <td className="py-3.5 font-medium text-white">{t.title}</td>
                        <td className="py-3.5 text-slate-400">{t.category}</td>
                        <td className="py-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {t.status}
                          </span>
                        </td>
                        <td className="py-3.5 text-right font-semibold text-slate-200">
                          {t.payout || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-[#12141C] border border-white/[0.08] p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-white">Quick Dispatch</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Direct access to high-frequency portal workflows
            </p>
          </div>

          <div className="space-y-2.5">
            <Link
              href="/portal/my-work"
              className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] transition"
            >
              <div>
                <div className="text-xs font-semibold text-white">Submit Deliverable</div>
                <div className="text-[11px] text-slate-400">Upload completed task files</div>
              </div>
              <span className="text-blue-400 text-sm">→</span>
            </Link>

            <Link
              href="/portal/reviewer/queue"
              className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] transition"
            >
              <div>
                <div className="text-xs font-semibold text-white">Peer & QA Calibration</div>
                <div className="text-[11px] text-slate-400">Audit pending submissions</div>
              </div>
              <span className="text-blue-400 text-sm">→</span>
            </Link>

            <Link
              href="/portal/payment-method"
              className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] transition"
            >
              <div>
                <div className="text-xs font-semibold text-white">Payout Configuration</div>
                <div className="text-[11px] text-slate-400">Manage disbursement details</div>
              </div>
              <span className="text-blue-400 text-sm">→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
