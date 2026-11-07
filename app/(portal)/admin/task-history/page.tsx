import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";
import { Empty, Notice, PageFrame, PageTitle, Pill, Strip, Timeline, btn, field, fmtDateTime, statusTone, type TimelineEntry } from "@/app/(portal)/layouts";
import { ScrollText } from "lucide-react";

const statuses: Record<string, string> = {
  ASSIGNED: "Assigned",
  PENDING_REVIEW: "Pending Review",
  REVIEW_IN_PROGRESS: "Under Review",
  REWORK_REQUIRED: "Revisions Required",
  PENDING_QA: "Awaiting QA",
  QA_IN_PROGRESS: "QA in Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  CANCELED: "Canceled",
};

const StatusPill = ({ status }: { status: string }) => <Pill tone={statusTone(status)}>{statuses[status] ?? status.replaceAll("_", " ")}</Pill>;

async function HistoryContent({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  await connection();

  const user = await requireEmployee(["QA", "ADMIN", "SUPER_ADMIN"]);
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
    "CANCELED",
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
      cancellationReason: true,
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

  const canceledTasks = await prisma.workTask.count({ where: { status: { in: ["CANCELED", "CANCELLED"] } } }); /* EVARYN_CANCELLATION_TOTAL_V1 */

  const entries: TimelineEntry[] = tasks.map((task) => {
    const cancelled = task.status === "CANCELED" || task.status === "CANCELLED";
    return {
      key: task.id,
      at: task.createdAt,
      tone: statusTone(task.status),
      node: (
        <details className="evx-more" style={{ border: 0, padding: 0 }}>
          <summary style={{ display: "block" }}>
            <div className="evx-tl-head">
              <div style={{ minWidth: 0 }}>
                {task.project?.title && <p className="evx-eyebrow" style={{ fontSize: 10.5 }}>{task.project.title}</p>}
                <h3 className="evx-tl-title" style={{ color: "var(--ev-ink)" }}>{task.title}</h3>
                <p className="evx-tl-sub">Assigned to {task.assignedTo?.fullName ?? "Unassigned"} · {task.submissions.length} submission{task.submissions.length === 1 ? "" : "s"}</p>
              </div>
              <StatusPill status={task.status} />
            </div>
            {cancelled && <p className="evx-tl-sub" style={{ marginTop: 8 }}><strong>Cancellation reason:</strong> {task.cancellationReason || "Not recorded (historical cancellation)"}</p>}
            <span className="evx-kpi-cta" style={{ padding: 0, marginTop: 10 }}>Submissions, reviews and details</span>
          </summary>

          <div className="evx-more-body" style={{ marginTop: 14 }}>
            <dl className="evx-facts" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))" }}>
              <div><dt>Created by</dt><dd>{task.createdBy.fullName}</dd></div>
              <div><dt>Priority</dt><dd>{task.priority}</dd></div>
              <div><dt>Deadline</dt><dd>{fmtDateTime(task.deadline)}</dd></div>
              <div><dt>Last updated</dt><dd>{fmtDateTime(task.updatedAt)}</dd></div>
              <div style={{ gridColumn: "1 / -1" }}><dt>Employee email</dt><dd style={{ wordBreak: "break-all" }}>{task.assignedTo?.email ?? "—"}</dd></div>
            </dl>
            <div className="evx-block"><h4>Task description</h4><p>{task.description}</p></div>

            <div>
              <h4 className="evx-section-title" style={{ fontSize: 13, marginBottom: 8 }}>Submission history</h4>
              {task.submissions.length === 0 ? (
                <p className="evx-meta">No work submitted yet.</p>
              ) : (
                <ol className="evx-tl-nested">
                  {task.submissions.map((submission, index) => (
                    <li key={submission.id} className={`evx-t-${statusTone(submission.status)}`}>
                      <div className="evx-tl-head">
                        <div><p className="evx-tl-title">Submission {index + 1}</p><p className="evx-tl-sub">{submission.employee.fullName} · {fmtDateTime(submission.submittedAt)}</p></div>
                        <StatusPill status={submission.status} />
                      </div>
                      <p className="evx-prose" style={{ fontSize: 13.5, lineHeight: 1.7, marginTop: 10 }}>{submission.content}</p>
                      {submission.reviews.length > 0 && (
                        <ol className="evx-tl-nested" style={{ marginTop: 12 }}>
                          {submission.reviews.map((review) => (
                            <li key={review.id} className={`evx-t-${statusTone(review.decision)}`}>
                              <div className="evx-tl-head">
                                <div><p className="evx-tl-title" style={{ fontSize: 13 }}>{review.stage === "QA" ? "Quality assurance" : "Reviewer assessment"}</p><p className="evx-tl-sub">{review.reviewer.fullName} · {fmtDateTime(review.createdAt)}</p></div>
                                <StatusPill status={review.decision} />
                              </div>
                              {review.feedback && <p className="evx-prose" style={{ fontSize: 13, lineHeight: 1.65, marginTop: 8 }}>{review.feedback}</p>}
                            </li>
                          ))}
                        </ol>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </details>
      ),
    };
  });

  return (
    <PageFrame>
      <PageTitle
        eyebrow="Reporting"
        title="Order history"
        description="Every assignment, submission, review and QA decision across the organization, newest first."
        back={{ href: user.role === "SUPER_ADMIN" ? "/portal/super-admin" : "/portal/admin", label: "Dashboard" }}
        actions={<Link href="/portal/admin/task-management" className={btn.ghost}>Open Task Management</Link>}
      />

      <Strip items={[
        { label: "Total orders", value: totalTasks.toLocaleString("en-KE"), tone: "blue" },
        { label: "Completed", value: completedTasks.toLocaleString("en-KE"), tone: "green" },
        { label: "Awaiting review", value: waitingReview.toLocaleString("en-KE"), tone: "cyan" },
        { label: "Awaiting QA", value: waitingQA.toLocaleString("en-KE"), tone: "violet" },
        { label: "In revision", value: revisions.toLocaleString("en-KE"), tone: "amber" },
        { label: "Cancelled", value: canceledTasks.toLocaleString("en-KE"), tone: "slate" },
      ]} />

      <form method="GET" action="/portal/admin/task-history" className="evx-card evx-filter" role="search">
        <label className="evx-field evx-grow"><span>Search order, project or employee</span>
          <input type="search" name="q" maxLength={100} defaultValue={search} placeholder="Search order records…" className={field.input} />
        </label>
        <label className="evx-field"><span>Status</span>
          <select name="status" defaultValue={status} className={field.select}>
            <option value="">All statuses</option>
            {allowedStatuses.map((value) => <option key={value} value={value}>{statuses[value] ?? value.replaceAll("_", " ")}</option>)}
          </select>
        </label>
        <div className="evx-actions"><button type="submit" className={btn.primary}>Apply filters</button>{(search || status) && <Link href="/portal/admin/task-history" className={btn.ghost}>Clear</Link>}</div>
      </form>

      <p className="evx-meta">Showing {tasks.length} of {filteredTotal} matching orders</p>

      {tasks.length === 0 ? (
        <Empty icon={ScrollText} title="No order records" text="Orders created by your administrators will appear here automatically." />
      ) : (
        <Timeline entries={entries} label="Order history timeline" />
      )}

      <nav aria-label="Order history pagination" className="evx-pagination">
        <p className="evx-meta">Page {currentPage} of {totalPages}</p>
        <div className="evx-actions">
          {currentPage > 1 ? <Link href={pageUrl(currentPage - 1)} className={btn.ghost}>Previous</Link> : <span className={btn.ghost} aria-disabled="true">Previous</span>}
          {currentPage < totalPages ? <Link href={pageUrl(currentPage + 1)} className={btn.ghost}>Next</Link> : <span className={btn.ghost} aria-disabled="true">Next</span>}
        </div>
      </nav>

      <Notice tone="cyan">Reporting is read-only. Summary counts cover all orders; review and QA counts elsewhere may represent decisions rather than unique orders.</Notice>
    </PageFrame>
  );
}

export default function TaskHistoryPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; page?: string }> }) {
  return (
    <Suspense fallback={<div className="evx-page"><div className="evx-card evx-card-pad evx-muted">Loading order history…</div></div>}>
      <HistoryContent searchParams={searchParams} />
    </Suspense>
  );
}
