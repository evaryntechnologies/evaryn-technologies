import { Suspense } from "react";
import { connection } from "next/server";
import { requireEmployee, type PortalRole } from "@/lib/auth/require-employee";
import { getEligibleDashboardQueues } from "@/lib/tasks/eligible-dashboard-queues";
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
      <div className="evx-page">
        <div className="evx-empty">
          <h2>Employee profile unavailable</h2>
          <p>Your employee account has not been activated. Contact your administrator.</p>
        </div>
      </div>
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
    const [money, extras, queues] = await Promise.all([
      getMyMoney(),
      getReviewerExtras(user.id),
      getEligibleDashboardQueues(user.id, user.role),
    ]);
    return (
      <ReviewerDashboard
        firstName={firstName}
        metrics={metrics}
        money={money}
        extras={{...extras, awaiting: queues.awaitingReview}}
      />
    );
  }

  const [money, extras, queues] = await Promise.all([
    getMyMoney(),
    getQaExtras(user.id),
    getEligibleDashboardQueues(user.id, user.role),
  ]);
  return (
    <QaDashboard
      firstName={firstName}
      metrics={metrics}
      money={money}
      extras={{...extras, awaiting: queues.awaitingQa, awaitingReview: queues.awaitingReview}}
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
    <Suspense
      fallback={
        <div className="evx-page"><div className="evx-card evx-card-pad evx-muted">Loading your dashboard…</div></div>
      }
    >
      <DashboardContent roles={roles} variant={variant} />
    </Suspense>
  );
}
