import { connection } from "next/server";
import Link from "next/link";
import { Suspense } from "react";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";

async function TaskerContent() {
  await connection();

  const user = await requireEmployee(["TASKER"]);

  const profile = await prisma.employeeProfile.findUnique({
    where: { authUserId: user.id },
    select: {
      id: true,
      fullName: true,
      status: true,
    },
  });

  if (!profile || profile.status !== "ACTIVE") {
    return (
      <section className="rounded-2xl border border-amber-300/30 bg-[#101F39] p-8">
        <h2 className="text-xl font-bold">
          Employee Profile Unavailable
        </h2>
        <p className="mt-3 text-slate-300">
          Your employee account has not been activated.
          Contact your administrator.
        </p>
      </section>
    );
  }

  const tasks = await prisma.workTask.findMany({
    where: {
      assignedToId: profile.id,
    },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      deadline: true,
      publicTaskId: true,
      category: true,
      attachmentName: true,
    },
    orderBy: [
      { deadline: "asc" },
      { createdAt: "desc" },
    ],
    take: 50,
  });

  const active = tasks.filter(
    (task) => !["COMPLETED", "CANCELLED"].includes(task.status)
  ).length;

  const statusLabels: Record<string, string> = {
    ASSIGNED: "Assigned",
    PENDING_REVIEW: "Pending Review",
    REVIEW_IN_PROGRESS: "Under Review",
    REWORK_REQUIRED: "Revisions Required",
    PENDING_QA: "Pending Quality Assurance",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
  };

  function getTaskAction(status: string) {
    if (status === "ASSIGNED") {
      return "Open Task / Submit Work";
    }

    if (status === "REWORK_REQUIRED") {
      return "Review Feedback / Resubmit";
    }

    return "View Task Details";
  }

  return (
    <>
      {/* Workspace heading */}
      <div className="mb-8">
        <p className="text-sm font-semibold tracking-widest text-cyan-300">
          TASKER WORKSPACE
        </p>

        <h1 className="mt-3 text-3xl font-bold">
          Welcome, {profile.fullName}
        </h1>

        <p className="mt-3 text-slate-300">
          View and manage your assigned work.
        </p>
      </div>

      <Link href="/portal/notifications" className="rounded-lg border border-white/20 px-4 py-2 text-cyan-300">Notifications</Link><Link href="/portal/task-hub" className="mb-6 inline-block rounded-xl bg-[#0052CC] px-5 py-3 font-semibold text-white">Browse Task Hub</Link>
      {/* Task summary */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-[#101F39] p-6">
          <p className="text-sm text-slate-300">
            Tasks loaded
          </p>

          <p className="mt-3 text-3xl font-bold">
            {tasks.length}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#101F39] p-6">
          <p className="text-sm text-slate-300">
            Active tasks
          </p>

          <p className="mt-3 text-3xl font-bold text-cyan-300">
            {active}
          </p>
        </div>
      </div>

      {/* Assigned tasks */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">
          My Assigned Tasks
        </h2>

        <span className="rounded-lg border border-white/10 bg-[#101F39] px-3 py-2 text-xs text-slate-300">
          Showing {tasks.length} tasks
        </span>
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#101F39] p-8 text-center">
          <h3 className="text-lg font-semibold">
            No tasks assigned yet
          </h3>

          <p className="mt-3 text-sm text-slate-300">
            Tasks assigned by your administrator will appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {tasks.map((task) => {
            const isRework = task.status === "REWORK_REQUIRED";
            const isCompleted = task.status === "COMPLETED";
            const isCancelled = task.status === "CANCELLED";

            const statusStyle = isRework
              ? "border-amber-400/30 bg-amber-400/10 text-amber-200"
              : isCompleted
                ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                : isCancelled
                  ? "border-slate-400/20 bg-slate-400/10 text-slate-300"
                  : task.status === "PENDING_REVIEW" ||
                      task.status === "PENDING_QA"
                    ? "border-sky-400/30 bg-sky-400/10 text-sky-200"
                    : "border-white/15 bg-white/5 text-slate-200";

            return (
              <article
                key={task.id}
                className="rounded-2xl border border-white/10 bg-[#101F39] p-6 transition-colors hover:border-white/20"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">
                      {task.category ?? "Uncategorized"}
                    </p>

                    <h3 className="mt-2 text-lg font-bold">
                      <Link
                        href={`/portal/tasker/tasks/${task.id}`}
                        className="transition-colors hover:text-cyan-300 hover:underline"
                      >
                        {task.publicTaskId ?? task.id} · {task.title}
                      </Link>
                    </h3>
                  </div>

                  <span
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${statusStyle}`}
                  >
                    {statusLabels[task.status] ??
                      task.status.replaceAll("_", " ")}
                  </span>
                </div>

                <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-300">
                  {task.description}
                </p>

                <div className="mt-5 flex flex-wrap gap-4 text-xs text-slate-300">
                  <span>
                    Priority: {task.priority}
                  </span>

                  <span>
                    Deadline:{" "}
                    {task.deadline
                      ? task.deadline.toLocaleString("en-KE", { timeZone: "Africa/Nairobi" })
                      : "Not set"}
                  </span>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5">
                  <p className="text-xs text-slate-400">
                    {task.status === "ASSIGNED"
                      ? "Ready for your submission."
                      : isRework
                        ? "Reviewer feedback is available. You can revise and resubmit your work."
                        : task.status === "PENDING_REVIEW"
                          ? "Your work is awaiting reviewer assessment."
                          : task.status === "PENDING_QA"
                            ? "Your work has passed review and is awaiting QA."
                            : isCompleted
                              ? "This task has been completed."
                              : isCancelled
                                ? "This task has been cancelled."
                                : "Open the task to view its current progress."}
                  </p>

                  <Link
                    href={`/portal/tasker/tasks/${task.id}`}
                    className="inline-flex items-center justify-center rounded-xl bg-[#0052CC] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#003F9E]"
                  >
                    {getTaskAction(task.status)}
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Portal navigation */}
      <div className="mt-10">
        <Link
          href="/portal"
          className="text-sm font-semibold text-cyan-300 hover:underline"
        >
          Return to portal
        </Link>
      </div>
    </>
  );
}

export default function TaskerPage() {
  return (
    <main className="min-h-screen bg-[#071327] px-5 py-10 text-white sm:px-10">
      <div className="w-full max-w-none">
        <Suspense
          fallback={
            <div className="rounded-2xl border border-white/10 bg-[#101F39] p-8 text-slate-300">
              Loading your assigned tasks...
            </div>
          }
        >
          <TaskerContent />
        </Suspense>
      </div>
    </main>
  );
}
