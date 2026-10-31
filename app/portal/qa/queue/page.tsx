import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";
import { qaDecision, claimQA } from "./actions";

async function QAQueueContent({
  searchParams,
}: {
  searchParams: Promise<{ result?: string; error?: string }>;
}) {
  await connection();

  const user = await requireEmployee(["QA"]);

  const qaProfile = await prisma.employeeProfile.findUnique({
    where: { authUserId: user.id },
    select: { id: true },
  });

  if (!qaProfile) {
    return (
      <p className="text-amber-200">
        Your QA employee profile is unavailable.
      </p>
    );
  }

  const submissions = await prisma.taskSubmission.findMany({
    where: {
      status: "PENDING_QA",
      task: { status: "PENDING_QA", OR:[{claimedQaId:null},{claimedQaId:qaProfile.id}] },
      employeeId: { not: qaProfile.id },
    },
    include: {
      employee: {
        select: { fullName: true },
      },
      task: {
        select: {
          claimedQaId: true,
          title: true,
          description: true,
          id: true,
          publicTaskId: true,
          deadline: true,
          reviewDeadline: true,
          qaDeadline: true,
          attachmentKey: true,
          attachmentName: true,
          instructions: true,
          category: true,
        },
      },
      reviews: {
        where: { stage: "REVIEWER" },
        select: {
          decision: true,
          feedback: true,
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { submittedAt: "asc" },
    take: 50,
  });

  const params = await searchParams;

  return (
    <main className="min-h-screen bg-[#071327] px-5 py-9 text-white sm:px-10">
      <div className="w-full max-w-none">
        <Link
          href="/portal/qa"
          className="text-sm font-semibold text-cyan-300 hover:underline"
        >
          Back to QA Dashboard
        </Link>

        <header className="mt-8">
          <p className="text-xs font-bold tracking-widest text-cyan-300">
            EVARYN TECHNOLOGIES LIMITED
          </p>

          <h1 className="mt-4 text-3xl font-bold">
            Quality Assurance
          </h1>

          <p className="mt-3 text-sm leading-7 text-slate-300">
            Perform final quality checks on reviewer-approved work.
            Approve completed work or return it with clear feedback.
          </p>
        </header>

        <section className="mt-8 rounded-2xl border border-white/10 bg-[#101F39] p-6">
          <p className="text-sm text-slate-300">Awaiting QA</p>
          <p className="mt-3 text-3xl font-bold">{submissions.length}</p>
          <p className="mt-2 text-xs text-slate-400">
            Showing up to 50 pending submissions
          </p>
        </section>

        {params.result === "claimed" && <p role="status" className="mt-5 text-cyan-300">QA task claimed successfully.</p>}
        {params.result === "saved" && (
          <p
            role="status"
            className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-4 text-sm text-emerald-200"
          >
            Quality Assurance decision saved successfully.
          </p>
        )}

        {params.error && (
          <p
            role="alert"
            className="mt-6 rounded-xl border border-amber-500/30 bg-amber-950/30 p-4 text-sm text-amber-200"
          >
            {params.error === "invalid"
              ? "Please provide a valid decision. Corrections require at least 10 characters of feedback."
              : "This submission is no longer available for QA review."}
          </p>
        )}

        {submissions.length === 0 ? (
          <section className="mt-8 rounded-2xl border border-white/10 bg-[#101F39] p-10 text-center">
            <h2 className="text-xl font-semibold">
              No submissions awaiting QA
            </h2>
            <p className="mt-3 text-sm text-slate-300">
              Work approved by a Reviewer will appear here.
            </p>
          </section>
        ) : (
          <div className="mt-8 space-y-6">
            {submissions.map((submission) => (
              <article
                key={submission.id}
                className="rounded-2xl border border-white/10 bg-[#101F39] p-6 sm:p-8"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">
                      {submission.task.category ?? "Uncategorized"}
                    </p>

                    <h2 className="mt-2 text-xl font-bold">
                      {submission.task.publicTaskId ?? submission.task.id} · {submission.task.title}
                    </h2>

                    <p className="mt-2 text-sm text-slate-300">
                      Submitted by {submission.employee.fullName}
                    </p>
                  </div>

                  <span className="rounded-lg border border-sky-400/25 bg-sky-400/10 px-3 py-2 text-xs font-semibold text-sky-200">
                    PENDING QA
                  </span>
                </div>

                <div className="mt-6">
                  <h3 className="font-semibold">Task Description</h3>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-300">
                    {submission.task.description}
                  </p>

                  {submission.task.instructions && (
                    <>
                      <h3 className="mt-5 font-semibold">Instructions</h3>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-300">
                        {submission.task.instructions}
                      </p>
                    </>
                  )}
                </div>

                <div className="mt-6 rounded-xl border border-white/10 bg-[#071327] p-5">
                  <h3 className="font-semibold">Submitted Work</h3>
                  <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7">
                    {submission.content}
                  </p>
                  <p className="mt-4 text-xs text-slate-400">
                    Submitted{" "}
                    {submission.submittedAt.toLocaleString("en-KE", {
                      timeZone: "Africa/Nairobi",
                    })}
                  </p>
                </div>

                {submission.reviews.map((review, index) => (
                  <div
                    key={index}
                    className="mt-5 rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-5"
                  >
                    <h3 className="text-sm font-semibold text-cyan-300">
                      Reviewer Assessment
                    </h3>

                    <p className="mt-2 text-xs text-slate-300">
                      Decision: {review.decision.replaceAll("_", " ")}
                    </p>

                    {review.feedback && (
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-300">
                        {review.feedback}
                      </p>
                    )}
                  </div>
                ))}

                <div className="mt-4 space-y-1 text-sm text-cyan-200"><p>Submission: {submission.task.deadline?.toLocaleString("en-KE",{timeZone:"Africa/Nairobi"}) ?? "Not set"}</p><p>Review: {submission.task.reviewDeadline?.toLocaleString("en-KE",{timeZone:"Africa/Nairobi"}) ?? "Not set"}</p><p>QA: {submission.task.qaDeadline?.toLocaleString("en-KE",{timeZone:"Africa/Nairobi"}) ?? "Not set"}</p></div>
                {submission.task.attachmentKey && <a className="mt-2 block text-sm text-cyan-300 underline" href={"/portal/attachments/"+submission.task.id}>Download: {submission.task.attachmentName}</a>}
                {submission.task.claimedQaId === null ? (
                  <form action={claimQA} className="mt-6">
                    <input type="hidden" name="taskId" value={submission.task.id}/>
                    <button className="rounded-xl bg-[#0052CC] px-5 py-3 font-semibold">Claim QA task</button>
                  </form>
                ) : <form action={qaDecision} className="mt-6 space-y-5">
                  <label className="block text-sm font-semibold">
                    Optional QA supporting attachment (any file format, maximum 10 MB)
                    <input type="file" name="attachment" className="mt-2 block w-full rounded-xl border border-slate-600 p-3 text-sm" />
                  </label>
                  <input
                    type="hidden"
                    name="submissionId"
                    value={submission.id}
                  />

                  <label className="block text-sm font-semibold">
                    Quality Assurance Feedback
                    <textarea
                      name="feedback"
                      rows={5}
                      maxLength={5000}
                      placeholder="Record your quality findings and any corrections required..."
                      className="mt-2 w-full rounded-xl border border-slate-600 bg-[#071327] px-4 py-3 font-normal text-white"
                    />
                  </label>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="submit"
                      name="decision"
                      value="APPROVED"
                      className="rounded-xl bg-[#0052CC] px-5 py-3 text-sm font-semibold text-white hover:bg-[#003F9E]"
                    >
                      Approve & Deliver — Await Client
                    </button>

                    <button
                      type="submit"
                      name="decision"
                      value="REWORK_REQUIRED"
                      className="rounded-xl border border-amber-400/40 px-5 py-3 text-sm font-semibold text-amber-200 hover:bg-amber-400/10"
                    >
                      Return for Corrections
                    </button>
                  </div>
                </form>}
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default function QAQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ result?: string; error?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#071327] p-8 text-slate-300">
          Loading Quality Assurance queue...
        </main>
      }
    >
      <QAQueueContent searchParams={searchParams} />
    </Suspense>
  );
}
