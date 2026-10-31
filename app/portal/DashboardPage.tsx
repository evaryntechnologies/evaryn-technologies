import { Suspense } from "react";
import { connection } from "next/server";
import { requireEmployee, type PortalRole } from "@/lib/auth/require-employee";
import { getDashboardMetrics } from "@/lib/tasks/dashboard-metrics";
import {
  getAdminClockState,
  getAttention,
  getMyMoney,
  getNewInquiries,
  getPayrollPosition,
  getPeople,
  getPipeline,
  getQaExtras,
  getReviewerExtras,
  getTaskerExtras,
} from "@/lib/tasks/role-dashboard";
import {
  AdminDashboard,
  QaDashboard,
  ReviewerDashboard,
  SuperAdminDashboard,
  TaskerDashboard,
} from "./dashboards";

export type DashboardVariant =
  | "tasker"
  | "reviewer"
  | "qa"
  | "admin"
  | "super-admin";

async function DashboardContent({
  roles,
  variant,
}: {
  roles: readonly PortalRole[];
  variant: DashboardVariant;
}) {
  await connection();
  const user = await requireEmployee(roles);
  const { firstName } = user;

  if (variant === "admin") {
    const [pipeline, attention, people, clockRunning] = await Promise.all([
      getPipeline(),
      getAttention(),
      getPeople(),
      user.role === "ADMIN" ? getAdminClockState(user.id) : Promise.resolve(false),
    ]);
    return (
      <AdminDashboard
        firstName={firstName}
        pipeline={pipeline}
        attention={attention}
        people={people}
        clockRunning={clockRunning}
      />
    );
  }

  if (variant === "super-admin") {
    const [pipeline, attention, people, payroll, inquiries] = await Promise.all([
      getPipeline(),
      getAttention(),
      getPeople(),
      getPayrollPosition(),
      getNewInquiries(),
    ]);
    return (
      <SuperAdminDashboard
        firstName={firstName}
        pipeline={pipeline}
        attention={attention}
        people={people}
        payroll={payroll}
        inquiries={inquiries}
      />
    );
  }

  // Tasker, Reviewer and QA do the work, so they share the order metrics.
  const metrics = await getDashboardMetrics(user.id);
  if (!metrics) {
    return (
      <section className="rounded-2xl border border-amber-400/40 bg-[var(--ev-surface)] p-8">
        <h2 className="text-xl font-bold text-[var(--ev-ink)]">
          Employee Profile Unavailable
        </h2>
        <p className="mt-3 text-[var(--ev-muted)]">
          Your employee account has not been activated. Contact your
          administrator.
        </p>
      </section>
    );
  }

  if (variant === "tasker") {
    const [money, extras] = await Promise.all([
      getMyMoney(),
      getTaskerExtras(user.id),
    ]);
    return (
      <TaskerDashboard
        firstName={firstName}
        metrics={metrics}
        money={money}
        upcoming={extras.upcoming}
      />
    );
  }

  if (variant === "reviewer") {
    const [money, extras] = await Promise.all([
      getMyMoney(),
      getReviewerExtras(user.id),
    ]);
    return (
      <ReviewerDashboard
        firstName={firstName}
        metrics={metrics}
        money={money}
        extras={extras}
      />
    );
  }

  const [money, extras] = await Promise.all([
    getMyMoney(),
    getQaExtras(user.id),
  ]);
  return (
    <QaDashboard
      firstName={firstName}
      metrics={metrics}
      money={money}
      extras={extras}
    />
  );
}

export default function DashboardPage({
  roles,
  variant,
}: {
  roles: readonly PortalRole[];
  variant: DashboardVariant;
}) {
  return (
    <main className="min-h-screen bg-[var(--ev-page)] px-4 py-6 text-[var(--ev-ink)] sm:px-8 sm:py-8">
      <div className="mx-auto w-full max-w-[1400px]">
        <Suspense
          fallback={
            <div className="rounded-2xl border border-[var(--ev-border-soft)] bg-[var(--ev-surface)] p-8 text-[var(--ev-muted)]">
              Loading your dashboard...
            </div>
          }
        >
          <DashboardContent roles={roles} variant={variant} />
        </Suspense>
      </div>
    </main>
  );
}
