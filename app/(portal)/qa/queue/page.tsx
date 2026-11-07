import { Suspense } from "react";
import { connection } from "next/server";
import { Download, ShieldCheck } from "lucide-react";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";
import { Empty, Kanban, KanbanCard, KanbanColumn, Notice, PageFrame, PageTitle, Pill, btn, field, fmtDateTime, pretty } from "@/app/(portal)/layouts";
import { qaDecision, claimQA, takeOverQA } from "./actions";

async function QAQueueContent({ searchParams }: { searchParams: Promise<{ result?: string; error?: string }> }) {
  await connection();
  const user = await requireEmployee(["QA", "ADMIN", "SUPER_ADMIN"]);
  const qaProfile = await prisma.employeeProfile.findUnique({ where: { authUserId: user.id }, select: { id: true, role: true } });

  if (!qaProfile) {
    return <PageFrame><Notice tone="amber">Your QA employee profile is unavailable.</Notice></PageFrame>;
  }

  const submissions = await prisma.taskSubmission.findMany({
    where: {
      status: "PENDING_QA",
      employeeId: { not: qaProfile.id },
      task: { status: "PENDING_QA", submissions: { none: { OR: [{ employeeId: qaProfile.id }, { reviews: { some: { reviewerId: qaProfile.id, stage: "REVIEWER" } } }] } } },
      reviews: { none: { reviewerId: qaProfile.id, stage: "REVIEWER" } },
    },
    include: {
      employee: { select: { fullName: true } },
      task: {
        select: {
          claimedQaId: true, title: true, description: true, id: true, publicTaskId: true, deadline: true, reviewDeadline: true,
          qaDeadline: true, attachmentKey: true, attachmentName: true, instructions: true, category: true,
        },
      },
      reviews: { where: { stage: "REVIEWER" }, select: { decision: true, feedback: true }, orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { submittedAt: "asc" },
    take: 50,
  });

  const params = await searchParams;
  const me = qaProfile.id;
  const canTakeOver = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
  const lanes = [
    { title: "Available to claim", tone: "cyan" as const, empty: "Nothing is waiting for QA.", test: (c: string | null) => !c },
    { title: "Claimed by you", tone: "violet" as const, empty: "Claim a submission to start your QA check.", test: (c: string | null) => !!c && c === me },
    { title: "Claimed by colleagues", tone: "slate" as const, empty: "No colleague has claimed work.", test: (c: string | null) => !!c && c !== me },
  ];

  return (
    <PageFrame>
      <PageTitle
        eyebrow="Quality assurance"
        title="QA queue"
        description="Final quality checks on reviewer-approved work. Approve it for delivery, or return it with clear feedback."
        actions={<Pill tone="violet">{submissions.length} awaiting QA</Pill>}
      />

      {params.result === "claimed" && <Notice tone="green">QA task claimed successfully.</Notice>}
      {params.result === "saved" && <Notice tone="green">Quality Assurance decision saved successfully.</Notice>}
      {params.error && (
        <Notice tone="amber">
          {params.error === "invalid"
            ? "Please provide a valid decision. Corrections require at least 10 characters of feedback."
            : "This submission is no longer available for QA review."}
        </Notice>
      )}

      {submissions.length === 0 ? (
        <Empty icon={ShieldCheck} title="No submissions awaiting QA" text="Work approved by a reviewer will appear here." />
      ) : (
        <Kanban columns={lanes.length} label="QA queue by claim status">
          {lanes.map((lane) => {
            const items = submissions.filter((s) => lane.test(s.task.claimedQaId));
            return (
              <KanbanColumn key={lane.title} title={lane.title} count={items.length} tone={lane.tone} empty={lane.empty}>
                {items.map((s) => {
                  const mine = s.task.claimedQaId === me;
                  const claimedByOther = s.task.claimedQaId !== null && !mine;
                  return (
                    <KanbanCard key={s.id} tone={lane.tone}>
                      <div className="evx-kcard-top"><Pill tone="violet">Pending QA</Pill><span className="evx-id">{s.task.publicTaskId ?? s.task.id.slice(0, 8)}</span></div>
                      <h3 className="evx-kcard-title">{s.task.title}</h3>
                      <p className="evx-meta">{s.task.category ?? "Uncategorized"} · by {s.employee.fullName}</p>
                      <p className="evx-meta">Submitted {fmtDateTime(s.submittedAt)}{s.task.qaDeadline ? ` · QA due ${fmtDateTime(s.task.qaDeadline)}` : ""}</p>

                      {s.task.claimedQaId === null && (
                        <>
                          <p className="evx-kcard-text">{s.task.description}</p>
                          <details className="evx-more">
                            <summary>Preview submitted work</summary>
                            <div className="evx-more-body">
                              <div className="evx-block"><h4>Order description</h4><p>{s.task.description}</p></div>
                              <div className="evx-block"><h4>Submitted work</h4><p>{s.content}</p></div>
                              {s.reviews.map((r, i) => (
                                <div key={i} className="evx-block"><h4>Reviewer assessment · {pretty(r.decision)}</h4>{r.feedback ? <p>{r.feedback}</p> : <p className="evx-muted">No written feedback.</p>}</div>
                              ))}
                              {s.task.attachmentKey && <a className={`${btn.ghost} ${btn.sm}`} href={"/portal/attachments/" + s.task.id}><Download size={14} aria-hidden="true" />{s.task.attachmentName ?? "Download attachment"}</a>}
                            </div>
                          </details>
                          <form action={claimQA}><input type="hidden" name="taskId" value={s.task.id} /><button className={`${btn.primary} ${btn.block}`}>Claim QA task</button></form>
                        </>
                      )}

                      {claimedByOther && !canTakeOver && (
                        <>
                          <p className="evx-meta">This QA check is claimed by a colleague.</p>
                          <details className="evx-more">
                            <summary>Preview submitted work</summary>
                            <div className="evx-more-body">
                              <div className="evx-block"><h4>Order description</h4><p>{s.task.description}</p></div>
                              <div className="evx-block"><h4>Submitted work</h4><p>{s.content}</p></div>
                              {s.reviews.map((r, i) => (
                                <div key={i} className="evx-block"><h4>Reviewer assessment · {pretty(r.decision)}</h4>{r.feedback ? <p>{r.feedback}</p> : <p className="evx-muted">No written feedback.</p>}</div>
                              ))}
                              {s.task.attachmentKey && <a className={`${btn.ghost} ${btn.sm}`} href={"/portal/attachments/" + s.task.id}><Download size={14} aria-hidden="true" />{s.task.attachmentName ?? "Download attachment"}</a>}
                            </div>
                          </details>
                        </>
                      )}
                      {claimedByOther && canTakeOver && (
                        <details className="evx-more">
                          <summary>Reassign this QA check</summary>
                          <form action={takeOverQA} className="evx-more-body">
                            <p className="evx-meta">Claimed by another colleague. An administrator may reassign the pending QA check with an explanation.</p>
                            <input type="hidden" name="taskId" value={s.task.id} />
                            <textarea name="reason" required minLength={10} maxLength={1000} placeholder="Reason for QA reassignment" className={field.textarea} />
                            <button className={btn.violet}>Assign QA to myself</button>
                          </form>
                        </details>
                      )}

                      {mine && (
                        <details className="evx-more" open>
                          <summary>Run the QA check</summary>
                          <div className="evx-more-body">
                            <div className="evx-block"><h4>Order description</h4><p>{s.task.description}</p></div>
                            {s.task.instructions && <div className="evx-block"><h4>Instructions</h4><p>{s.task.instructions}</p></div>}
                            <div className="evx-block"><h4>Submitted work</h4><p>{s.content}</p></div>
                            {s.reviews.map((r, i) => (
                              <div key={i} className="evx-block"><h4>Reviewer assessment · {pretty(r.decision)}</h4>{r.feedback ? <p>{r.feedback}</p> : <p className="evx-muted">No written feedback.</p>}</div>
                            ))}
                            <p className="evx-meta">Deadlines · submission {fmtDateTime(s.task.deadline)} · review {fmtDateTime(s.task.reviewDeadline)} · QA {fmtDateTime(s.task.qaDeadline)}</p>
                            {s.task.attachmentKey && <a className={`${btn.ghost} ${btn.sm}`} href={"/portal/attachments/" + s.task.id}><Download size={14} aria-hidden="true" />{s.task.attachmentName ?? "Download attachment"}</a>}
                            <form action={qaDecision} className="evx-form">
                              <label className="evx-field"><span>Supporting attachment (optional, max 10 MB)</span><input type="file" name="attachment" className={field.input} /></label>
                              <input type="hidden" name="submissionId" value={s.id} />
                              <label className="evx-field"><span>Quality assurance feedback</span>
                                <textarea name="feedback" rows={5} maxLength={5000} className={field.textarea} placeholder="Record your quality findings and any corrections required…" />
                              </label>
                              <div className="evx-actions">
                                <button type="submit" name="decision" value="APPROVED" className={btn.primary}>Approve and send to Post-QA</button>
                                <button type="submit" name="decision" value="REWORK_REQUIRED" className={btn.warn}>Return for corrections</button>
                              </div>
                            </form>
                          </div>
                        </details>
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

export default function QAQueuePage({ searchParams }: { searchParams: Promise<{ result?: string; error?: string }> }) {
  return (
    <Suspense fallback={<div className="evx-page"><div className="evx-card evx-card-pad evx-muted">Loading QA queue…</div></div>}>
      <QAQueueContent searchParams={searchParams} />
    </Suspense>
  );
}
