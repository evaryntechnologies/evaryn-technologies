import { Suspense } from "react";
import { connection } from "next/server";
import { ClipboardCheck, Download } from "lucide-react";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";
import { Empty, Kanban, KanbanCard, KanbanColumn, Notice, PageFrame, PageTitle, Pill, btn, field, fmtDateTime } from "@/app/(portal)/layouts";
import { reviewSubmission, claimReview } from "./actions";

async function ReviewQueueContent({ searchParams }: { searchParams: Promise<{ result?: string; error?: string }> }) {
  await connection();
  const reviewerUser = await requireEmployee(["REVIEWER", "QA", "ADMIN", "SUPER_ADMIN"]);
  const reviewerProfile = await prisma.employeeProfile.findUnique({ where: { authUserId: reviewerUser.id }, select: { id: true } });

  const submissions = await prisma.taskSubmission.findMany({
    where: {
      status: "PENDING_REVIEW",
      task: { status: "PENDING_REVIEW", submissions: { none: { employeeId: reviewerProfile?.id ?? "" } } },
      employeeId: { not: reviewerProfile?.id ?? "" },
    },
    include: {
      task: {
        select: {
          title: true, description: true, id: true, publicTaskId: true, deadline: true, reviewDeadline: true,
          claimedReviewerId: true, attachmentKey: true, attachmentName: true, category: true,
        },
      },
      employee: { select: { fullName: true, email: true } },
    },
    orderBy: { submittedAt: "asc" },
    take: 50,
  });

  const params = await searchParams;
  const me = reviewerProfile?.id;
  const lanes = [
    { title: "Available to claim", tone: "cyan" as const, empty: "Nothing is waiting for a reviewer.", test: (c: string | null) => !c },
    { title: "Claimed by you", tone: "blue" as const, empty: "Claim a submission to start reviewing.", test: (c: string | null) => !!c && c === me },
    { title: "Claimed by colleagues", tone: "slate" as const, empty: "No colleague has claimed work.", test: (c: string | null) => !!c && c !== me },
  ];

  return (
    <PageFrame>
      <PageTitle
        eyebrow="Review"
        title="Review queue"
        description="Examine submissions, give feedback, and approve work for Quality Assurance."
        actions={<Pill tone="blue">{submissions.length} awaiting review</Pill>}
      />

      {params.result === "saved" && <Notice tone="green">Review decision saved successfully.</Notice>}
      {params.error && (
        <Notice tone="amber">
          {params.error === "invalid"
            ? "Check your decision and feedback. Revisions require at least 10 characters of feedback."
            : "This submission has already been processed or is no longer available."}
        </Notice>
      )}

      {submissions.length === 0 ? (
        <Empty icon={ClipboardCheck} title="Nothing to review yet" text="Submitted work will appear here automatically." />
      ) : (
        <Kanban columns={lanes.length} label="Review queue by claim status">
          {lanes.map((lane) => {
            const items = submissions.filter((s) => lane.test(s.task.claimedReviewerId));
            return (
              <KanbanColumn key={lane.title} title={lane.title} count={items.length} tone={lane.tone} empty={lane.empty}>
                {items.map((s) => {
                  const mine = s.task.claimedReviewerId === me;
                  return (
                    <KanbanCard key={s.id} tone={lane.tone}>
                      <div className="evx-kcard-top"><Pill tone="blue">Pending review</Pill><span className="evx-id">{s.task.publicTaskId ?? s.task.id.slice(0, 8)}</span></div>
                      <h3 className="evx-kcard-title">{s.task.title}</h3>
                      <p className="evx-meta">{s.task.category ?? "Uncategorized"} · by {s.employee.fullName}</p>
                      <p className="evx-meta">Submitted {fmtDateTime(s.submittedAt)}{mine && s.task.reviewDeadline ? ` · review due ${fmtDateTime(s.task.reviewDeadline)}` : ""}</p>

                      {!s.task.claimedReviewerId && (
                        <>
                          <p className="evx-kcard-text">{s.task.description}</p>
                          <details className="evx-more">
                            <summary>Preview submitted work</summary>
                            <div className="evx-more-body"><div className="evx-block"><h4>Submitted work</h4><p>{s.content}</p></div><p className="evx-meta">Submission deadline: {fmtDateTime(s.task.deadline)}</p></div>
                          </details>
                          <form action={claimReview}><input type="hidden" name="taskId" value={s.task.id} /><button className={`${btn.primary} ${btn.block}`}>Claim task for review</button></form>
                        </>
                      )}

                      {mine && (
                        <details className="evx-more" open>
                          <summary>Review this submission</summary>
                          <div className="evx-more-body">
                            <div className="evx-block"><h4>Order description</h4><p>{s.task.description}</p></div>
                            <div className="evx-block"><h4>Submitted work</h4><p>{s.content}</p></div>
                            <p className="evx-meta">Submission deadline: {fmtDateTime(s.task.deadline)}</p>
                            {s.task.attachmentKey && <a className={`${btn.ghost} ${btn.sm}`} href={"/portal/attachments/" + s.task.id}><Download size={14} aria-hidden="true" />{s.task.attachmentName ?? "Download attachment"}</a>}
                            <form action={reviewSubmission} className="evx-form">
                              <label className="evx-field"><span>Supporting attachment (optional, max 10 MB)</span><input type="file" name="attachment" className={field.input} /></label>
                              <input type="hidden" name="submissionId" value={s.id} />
                              <label className="evx-field"><span>Review feedback</span>
                                <textarea name="feedback" rows={4} maxLength={5000} className={field.textarea} placeholder="Explain your findings. Feedback is required when requesting revisions." />
                              </label>
                              <div className="evx-actions">
                                <button type="submit" name="decision" value="APPROVED" className={btn.primary}>Approve for QA</button>
                                <button type="submit" name="decision" value="REWORK_REQUIRED" className={btn.warn}>Request revisions</button>
                              </div>
                            </form>
                          </div>
                        </details>
                      )}

                      {s.task.claimedReviewerId && !mine && (
                        <>
                          <p className="evx-meta">This review is claimed by a colleague.</p>
                          <details className="evx-more">
                            <summary>Preview submitted work</summary>
                            <div className="evx-more-body"><div className="evx-block"><h4>Order description</h4><p>{s.task.description}</p></div><div className="evx-block"><h4>Submitted work</h4><p>{s.content}</p></div></div>
                          </details>
                        </>
                      )}
                    </KanbanCard>
                  );
                })}
              </KanbanColumn>
            );
          })}
        </Kanban>
      )}
    </PageFrame>
  );
}

export default function ReviewQueuePage({ searchParams }: { searchParams: Promise<{ result?: string; error?: string }> }) {
  return (
    <Suspense fallback={<div className="evx-page"><div className="evx-card evx-card-pad evx-muted">Loading review queue…</div></div>}>
      <ReviewQueueContent searchParams={searchParams} />
    </Suspense>
  );
}
