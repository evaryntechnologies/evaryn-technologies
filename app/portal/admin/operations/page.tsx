import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";

async function OperationsContent() {
  await connection();

  const user = await requireEmployee(["ADMIN", "SUPER_ADMIN"]);

  const [
    total,
    assigned,
    pendingReview,
    pendingQA,
    revisions,
    completed,
    recentTasks,
  ] = await Promise.all([
    prisma.workTask.count(),
    prisma.workTask.count({ where: { status: "ASSIGNED" } }),
    prisma.workTask.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.workTask.count({ where: { status: "PENDING_QA" } }),
    prisma.workTask.count({ where: { status: "REWORK_REQUIRED" } }),
    prisma.workTask.count({ where: { status: "COMPLETED" } }),
    prisma.workTask.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        project: { select: { title: true } },
        assignedTo: { select: { fullName: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 15,
    }),
  ]);

  const metrics = [
    { label: "Total Tasks", value: total },
    { label: "Assigned", value: assigned },
    { label: "Awaiting Review", value: pendingReview },
    { label: "Awaiting QA", value: pendingQA },
    { label: "Revisions Required", value: revisions },
    { label: "Completed", value: completed },
  ];

  const superAdmin = user.role === "SUPER_ADMIN";

  return (
    <main className="min-h-screen bg-[#071327] px-5 py-9 text-white sm:px-10">
      <div className="w-full max-w-none">
        <Link
          href={superAdmin ? "/portal/super-admin" : "/portal/admin"}
          className="text-sm font-semibold text-cyan-300 hover:underline"
        >
          Back to Dashboard
        </Link>

        <header className="mt-8">
          <p className="text-xs font-bold tracking-widest text-cyan-300">
            EVARYN TECHNOLOGIES LIMITED
          </p>
          <h1 className="mt-4 text-3xl font-bold">
            Operations Overview
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            Monitor projects, assigned tasks, reviews and quality checks.
          </p>
        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map((metric) => (
            <article
              key={metric.label}
              className="rounded-2xl border border-white/10 bg-[#101F39] p-6"
            >
              <p className="text-sm text-slate-300">{metric.label}</p>
              <p className="mt-4 text-3xl font-bold text-cyan-300">
                {metric.value}
              </p>
            </article>
          ))}
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          {[
            {
              title: "Task Management",
              href: "/portal/admin/task-management",
            },
            {
              title: "Task History & Reports",
              href: "/portal/admin/task-history",
            },
            {
              title: "Reviewer Dashboard",
              href: "/portal/reviewer",
            },
            {
              title: "Quality Assurance",
              href: "/portal/qa",
            },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-2xl border border-white/10 bg-[#101F39] p-6 font-semibold text-cyan-300 transition hover:border-cyan-400/40"
            >
              {item.title}
            </Link>
          ))}
        </section>

        <section className="mt-8 rounded-2xl border border-white/10 bg-[#101F39] p-6 sm:p-8">
          <h2 className="text-xl font-bold">Recently Updated Tasks</h2>

          {recentTasks.length === 0 ? (
            <p className="mt-5 text-sm text-slate-300">
              No tasks have been created yet.
            </p>
          ) : (
            <div className="mt-5 space-y-3">
              {recentTasks.map((task) => (
                <article
                  key={task.id}
                  className="rounded-xl border border-white/10 bg-[#071327] p-5"
                >
                  <p className="text-xs font-semibold text-cyan-300">
                    {task.project?.title}
                  </p>
                  <h3 className="mt-2 font-semibold">{task.title}</h3>
                  <p className="mt-2 text-sm text-slate-300">
                    Assigned to {task.assignedTo?.fullName ?? "Unassigned"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-300">
                    <span>Status: {task.status.replaceAll("_", " ")}</span>
                    <span>Priority: {task.priority}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default function OperationsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#071327] p-8 text-slate-300">
          Loading operations...
        </main>
      }
    >
      <OperationsContent />
    </Suspense>
  );
}