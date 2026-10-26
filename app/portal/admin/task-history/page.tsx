import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";

const statuses: Record<string, string> = {
  ASSIGNED: "Assigned",
  PENDING_REVIEW: "Pending Review",
  REVIEW_IN_PROGRESS: "Under Review",
  REWORK_REQUIRED: "Revisions Required",
  PENDING_QA: "Awaiting QA",
  QA_IN_PROGRESS: "QA in Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

function formatDate(value: Date | null | undefined) {
  if (!value) return "Not set";

  return value.toLocaleString("en-KE", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusPill({ status }: { status: string }) {
  const color =
    status === "COMPLETED" || status === "APPROVED"
      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
      : status === "REWORK_REQUIRED"
        ? "border-amber-400/30 bg-amber-400/10 text-amber-200"
        : status === "CANCELLED"
          ? "border-slate-400/20 bg-slate-400/10 text-slate-300"
          : "border-cyan-400/20 bg-cyan-400/10 text-cyan-200";

  return (
    <span
      className={`inline-flex rounded-lg border px-3 py-1.5 text-xs font-semibold ${color}`}
    >
      {statuses[status] ?? status.replaceAll("_", " ")}
    </span>
  );
}

async function HistoryContent({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  await connection();

  const user = await requireEmployee(["ADMIN", "SUPER_ADMIN"]);
  const params = await searchParams;

  // TASK_HISTORY_FILTERS_V1
  const search = (params.q ?? "").trim().slice(0, 100);
  const allowedStatuses = [
    "ASSIGNED",
    "PENDING_REVIEW",
    "REVIEW_IN_PROGRESS",
    "REWORK_REQUIRED",
    "PENDING_QA",
    "QA_IN_PROGRESS",
    "COMPLETED",
    "CANCELLED",
  ];
  const status = allowedStatuses.includes(params.status ?? "")
    ? params.status ?? ""
    : "";

  const requestedPage = Number(params.page ?? "1");
  const safePage = Number.isSafeInteger(requestedPage)
    ? Math.max(1, requestedPage)
    : 1;

  const where = {
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" as const } },
            {
              project: {
                title: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            },
            {
              assignedTo: {
                fullName: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            },
          ],
        }
      : {}),
  };

  const filteredTotal = await prisma.workTask.count({ where });
  const totalPages = Math.max(1, Math.ceil(filteredTotal / 20));
  const currentPage = Math.min(safePage, totalPages);
  const pageUrl = (target: number) => {
    const query = new URLSearchParams();
    if (search) query.set("q", search);
    if (status) query.set("status", status);
    query.set("page", String(target));
    return "/portal/admin/task-history?" + query.toString();
  };

  const tasks = await prisma.workTask.findMany({
    where,
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      deadline: true,
      createdAt: true,
      updatedAt: true,
      project: {
        select: {
          title: true,
        },
      },
      assignedTo: {
        select: {
          fullName: true,
          email: true,
        },
      },
      createdBy: {
        select: {
          fullName: true,
        },
      },
      submissions: {
        orderBy: { submittedAt: "asc" },
        select: {
          id: true,
          content: true,
          status: true,
          submittedAt: true,
          employee: {
            select: { fullName: true },
          },
          reviews: {
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              stage: true,
              decision: true,
              feedback: true,
              createdAt: true,
              reviewer: {
                select: { fullName: true },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    skip: (currentPage - 1) * 20,
    take: 20,
  });

  const [totalTasks, completedTasks, waitingReview, waitingQA, revisions] =
    await Promise.all([
      prisma.workTask.count(),
      prisma.workTask.count({ where: { status: "COMPLETED" } }),
      prisma.workTask.count({ where: { status: "PENDING_REVIEW" } }),
      prisma.workTask.count({ where: { status: "PENDING_QA" } }),
      prisma.workTask.count({ where: { status: "REWORK_REQUIRED" } }),
    ]);

  const summary = [
    { label: "Total Tasks", value: totalTasks, color: "text-white" },
    { label: "Completed", value: completedTasks, color: "text-emerald-300" },
    { label: "Awaiting Review", value: waitingReview, color: "text-cyan-300" },
    { label: "Awaiting QA", value: waitingQA, color: "text-sky-300" },
    { label: "Revisions Required", value: revisions, color: "text-amber-300" },
  ];

  return (
    <div className="mx-auto max-w-7xl">
      <Link
        href={user.role === "SUPER_ADMIN" ? "/portal/super-admin" : "/portal/admin"}
        className="text-sm font-semibold text-cyan-300 hover:underline"
      >
        Back to Administration
      </Link>

      <header className="mt-8">
        <p className="text-xs font-bold tracking-widest text-cyan-300">
          EVARYN TECHNOLOGIES LIMITED
        </p>
        <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
          Task History & Reporting
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
          Track assignments, submissions, reviews, corrections
          and QA decisions across the organization.
        </p>
      </header>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {summary.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-white/10 bg-[#101F39] p-5"
          >
            <p className="text-sm text-slate-300">{item.label}</p>
            <p className={`mt-4 text-3xl font-bold ${item.color}`}>
              {item.value.toLocaleString("en-KE")}
            </p>
          </div>
        ))}
      </div>

      <section className="mt-8">
        <form
          method="GET"
          action="/portal/admin/task-history"
          className="mb-6 grid gap-4 rounded-2xl border border-white/10 bg-[#101F39] p-5 sm:grid-cols-[1fr_auto_auto] sm:items-end"
        >
          <label className="block text-sm font-medium">
            Search task, project or employee
            <input
              type="search"
              name="q"
              maxLength={100}
              defaultValue={search}
              placeholder="Search task records..."
              className="mt-2 w-full rounded-xl border border-white/20 bg-[#071327] px-4 py-3 text-white"
            />
          </label>
          <label className="block text-sm font-medium">
            Status
            <select
              name="status"
              defaultValue={status}
              className="mt-2 w-full rounded-xl border border-white/20 bg-[#071327] px-4 py-3 text-white"
            >
              <option value="">All statuses</option>
              {allowedStatuses.map((value) => (
                <option key={value} value={value}>
                  {statuses[value] ?? value.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="rounded-xl bg-[#0052CC] px-6 py-3 font-semibold text-white hover:bg-[#003F9E]"
          >
            Apply Filters
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-bold">Task Records</h2>
          <span className="rounded-lg border border-white/15 px-3 py-2 text-xs text-slate-300">
            Showing {tasks.length} of {filteredTotal} matching tasks
          </span>
        </div>

        {tasks.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-white/10 bg-[#101F39] p-8">
            <p className="text-sm text-slate-300">
              No task records exist yet. Tasks created by your
              administrators will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-5">
            {tasks.map((task) => (
              <details
                key={task.id}
                className="group rounded-2xl border border-white/10 bg-[#101F39] p-5 sm:p-7"
              >
                <summary className="cursor-pointer list-none">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">
                        {task.project?.title}
                      </p>
                      <h3 className="mt-2 text-lg font-bold">
                        {task.title}
                      </h3>
                      <p className="mt-2 text-sm text-slate-300">
                        Assigned to {task.assignedTo.fullName}
                      </p>
                      <p className="mt-2 text-xs text-slate-400">
                        Created {formatDate(task.createdAt)}
                      </p>
                    </div>
                    <StatusPill status={task.status} />
                  </div>
                  <p className="mt-5 text-xs font-semibold text-cyan-300 group-open:hidden">
                    View submissions, reviews and details
                  </p>
                  <p className="mt-5 hidden text-xs font-semibold text-cyan-300 group-open:block">
                    Hide task details
                  </p>
                </summary>

                <div className="mt-6 border-t border-white/10 pt-6">
                  <div className="grid gap-4 text-sm text-slate-300 sm:grid-cols-2">
                    <p>
                      <strong className="text-white">Created by:</strong>{" "}
                      {task.createdBy.fullName}
                    </p>
                    <p>
                      <strong className="text-white">Priority:</strong>{" "}
                      {task.priority}
                    </p>
                    <p>
                      <strong className="text-white">Deadline:</strong>{" "}
                      {formatDate(task.deadline)}
                    </p>
                    <p>
                      <strong className="text-white">Last updated:</strong>{" "}
                      {formatDate(task.updatedAt)}
                    </p>
                    <p className="sm:col-span-2 break-all">
                      <strong className="text-white">Employee email:</strong>{" "}
                      {task.assignedTo.email}
                    </p>
                  </div>

                  <h4 className="mt-6 font-semibold">Task Description</h4>
                  <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-300">
                    {task.description}
                  </p>

                  <h4 className="mt-8 font-semibold">
                    Submission History ({task.submissions.length})
                  </h4>

                  {task.submissions.length === 0 ? (
                    <p className="mt-3 text-sm text-slate-400">
                      No work submitted yet.
                    </p>
                  ) : (
                    <div className="mt-4 space-y-4">
                      {task.submissions.map((submission, index) => (
                        <div
                          key={submission.id}
                          className="rounded-xl border border-white/10 bg-[#071327] p-5"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <h5 className="font-semibold">
                                Submission {index + 1}
                              </h5>
                              <p className="mt-1 text-xs text-slate-400">
                                {submission.employee.fullName} ·{" "}
                                {formatDate(submission.submittedAt)}
                              </p>
                            </div>
                            <StatusPill status={submission.status} />
                          </div>

                          <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-slate-300">
                            {submission.content}
                          </p>

                          {submission.reviews.length > 0 && (
                            <div className="mt-5 space-y-3 border-t border-white/10 pt-5">
                              <h6 className="text-sm font-semibold">
                                Review Decisions
                              </h6>
                              {submission.reviews.map((review) => (
                                <div
                                  key={review.id}
                                  className="rounded-lg border border-white/10 p-4"
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-3">
                                    <p className="text-xs font-semibold text-cyan-300">
                                      {review.stage === "QA"
                                        ? "Quality Assurance"
                                        : "Reviewer Assessment"}
                                    </p>
                                    <StatusPill status={review.decision} />
                                  </div>
                                  <p className="mt-2 text-xs text-slate-400">
                                    {review.reviewer.fullName} ·{" "}
                                    {formatDate(review.createdAt)}
                                  </p>
                                  {review.feedback && (
                                    <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-300">
                                      {review.feedback}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </details>
            ))}
          </div>
        )}
      </section>

      <nav
        aria-label="Task history pagination"
        className="mt-7 flex flex-wrap items-center justify-between gap-4"
      >
        <p className="text-sm text-slate-300">
          Page {currentPage} of {totalPages}
        </p>
        <div className="flex items-center gap-3">
          {currentPage > 1 ? (
            <Link
              href={pageUrl(currentPage - 1)}
              className="rounded-xl border border-white/20 px-4 py-2 text-sm text-cyan-300 hover:bg-white/5"
            >
              Previous
            </Link>
          ) : (
            <span className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-500">
              Previous
            </span>
          )}
          {currentPage < totalPages ? (
            <Link
              href={pageUrl(currentPage + 1)}
              className="rounded-xl border border-white/20 px-4 py-2 text-sm text-cyan-300 hover:bg-white/5"
            >
              Next
            </Link>
          ) : (
            <span className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-500">
              Next
            </span>
          )}
        </div>
      </nav>

      <p className="mt-7 text-xs leading-6 text-slate-400">
        Reporting is read-only. Summary counts cover all tasks;
        the expanded history displays the 100 most recently created tasks.
        Review and QA counts elsewhere may represent decisions rather
        than unique tasks.
      </p>

      <div className="mt-8">
        <Link
          href="/portal/admin/task-management"
          className="text-sm font-semibold text-cyan-300 hover:underline"
        >
          Open Task Management
        </Link>
      </div>
    </div>
  );
}

export default function TaskHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  return (
    <main className="min-h-screen bg-[#071327] px-5 py-9 text-white sm:px-10">
      <Suspense
        fallback={
          <div className="mx-auto max-w-7xl rounded-2xl border border-white/10 bg-[#101F39] p-8 text-slate-300">
            Loading task history...
          </div>
        }
      >
        <HistoryContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}