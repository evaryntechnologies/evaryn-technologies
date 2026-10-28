import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";
import { reviewSubmission, claimReview } from "./actions";

async function ReviewQueueContent({
  searchParams,
}: {
  searchParams: Promise<{ result?: string; error?: string }>;
}) {
  await connection();
  const reviewerUser = await requireEmployee(["REVIEWER","QA"]);
  const reviewerProfile = await prisma.employeeProfile.findUnique({where:{authUserId:reviewerUser.id},select:{id:true}});

  const submissions = await prisma.taskSubmission.findMany({
    where: {
      status: "PENDING_REVIEW",
      task: { status: "PENDING_REVIEW" },
    },
    include: {
      task: {
        select: {
          title: true,
          description: true,
          id: true,
          publicTaskId: true,
          deadline: true,
          reviewDeadline: true,
          claimedReviewerId: true,
          attachmentKey: true,
          attachmentName: true,
          category: true,
        },
      },
      employee: {
        select: { fullName: true, email: true },
      },
    },
    orderBy: { submittedAt: "asc" },
    take: 50,
  });

  const params = await searchParams;

  return (
    <main className="min-h-screen bg-[#071327] px-5 py-9 text-white sm:px-10">
      <div className="w-full max-w-none">
        <Link href="/portal/reviewer" className="text-sm font-semibold text-cyan-300 hover:underline">
          Back to Reviewer Dashboard
        </Link>

        <header className="mt-8">
          <p className="text-xs font-bold tracking-widest text-cyan-300">
            EVARYN TECHNOLOGIES LIMITED
          </p>
          <h1 className="mt-4 text-3xl font-bold">Review Queue</h1>
          <p className="mt-3 text-sm text-slate-300">
            Examine employee submissions, provide feedback and approve work for Quality Assurance.
          </p>
        </header>

        <div className="mt-7 rounded-xl border border-white/10 bg-[#101F39] p-5">
          <span className="text-sm text-slate-300">Submissions awaiting review</span>
          <p className="mt-2 text-3xl font-bold">{submissions.length}</p>
          <p className="mt-1 text-xs text-slate-400">Showing up to 50 pending submissions</p>
        </div>

        {params.result === "saved" && (
          <p role="status" className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-4 text-sm text-emerald-200">
            Review decision saved successfully.
          </p>
        )}

        {params.error && (
          <p role="alert" className="mt-6 rounded-xl border border-amber-500/30 bg-amber-950/30 p-4 text-sm text-amber-200">
            {params.error === "invalid"
              ? "Check your decision and feedback. Revisions require at least 10 characters of feedback."
              : "This submission has already been processed or is no longer available."}
          </p>
        )}

        {submissions.length === 0 ? (
          <section className="mt-8 rounded-2xl border border-white/10 bg-[#101F39] p-10 text-center">
            <h2 className="text-xl font-semibold">Nothing to review yet</h2>
            <p className="mt-3 text-sm text-slate-300">
              Submitted employee work will appear here automatically.
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
                    <p className="text-xs font-semibold text-cyan-300">
                      {submission.task.category ?? "Uncategorized"}
                    </p>
                    <h2 className="mt-2 text-xl font-bold">
                      {submission.task.publicTaskId ?? submission.task.id} · {submission.task.title}
                    </h2>
                    <p className="mt-2 text-sm text-slate-300">
                      Submitted by {submission.employee.fullName}
                    </p>
                  </div>
                  <span className="rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs font-semibold text-amber-200">
                    PENDING REVIEW
                  </span>
                </div>

                <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-slate-300">
                  {submission.task.description}
                </p>

                <div className="mt-6 rounded-xl border border-white/10 bg-[#071327] p-5">
                  <h3 className="font-semibold">Submitted Work</h3>
                  <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7">
                    {submission.content}
                  </p>
                  <p className="mt-4 text-xs text-slate-400">
                    Submitted {submission.submittedAt.toLocaleString("en-KE", { timeZone: "Africa/Nairobi" })}
                  </p>
                </div>

                <div className="mt-4 text-sm text-cyan-200">Submission deadline: {submission.task.deadline?.toLocaleString("en-KE",{timeZone:"Africa/Nairobi"}) ?? "Not set"}</div>
                {submission.task.claimedReviewerId === reviewerProfile?.id ? <div className="mt-2 text-sm text-cyan-200">Review deadline: {submission.task.reviewDeadline?.toLocaleString("en-KE",{timeZone:"Africa/Nairobi"}) ?? "Not set"}</div> : null}
                {submission.task.attachmentKey && submission.task.claimedReviewerId === reviewerProfile?.id && <a className="mt-2 block text-sm text-cyan-300 underline" href={"/portal/attachments/"+submission.task.id}>Download: {submission.task.attachmentName}</a>}
                {!submission.task.claimedReviewerId && <form action={claimReview} className="mt-4"><input type="hidden" name="taskId" value={submission.task.id}/><button className="rounded-xl bg-[#0052CC] px-5 py-3 font-bold">Claim task for review</button></form>}
                {submission.task.claimedReviewerId === reviewerProfile?.id && <form action={reviewSubmission} className="mt-6 space-y-4">
<label className="block text-sm font-semibold">Required work attachment (any file format, maximum 10 MB)
<input type="file" name="attachment" required className="mt-2 block w-full rounded-lg border border-cyan-400/30 p-3 text-sm" />
</label>
                  <input type="hidden" name="submissionId" value={submission.id} />

                  <label className="block text-sm font-semibold">
                    Review Feedback
                    <textarea
                      name="feedback"
                      rows={4}
                      maxLength={5000}
                      placeholder="Explain your findings. Feedback is required when requesting revisions."
                      className="mt-2 w-full rounded-xl border border-slate-600 bg-[#071327] px-4 py-3 font-normal"
                    />
                  </label>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="submit"
                      name="decision"
                      value="APPROVED"
                      className="rounded-xl bg-[#0052CC] px-5 py-3 text-sm font-semibold hover:bg-[#003F9E]"
                    >
                      Approve for QA
                    </button>
                    <button
                      type="submit"
                      name="decision"
                      value="REWORK_REQUIRED"
                      className="rounded-xl border border-amber-400/40 px-5 py-3 text-sm font-semibold text-amber-200 hover:bg-amber-400/10"
                    >
                      Request Revisions
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

export default function ReviewQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ result?: string; error?: string }>;
}) {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#071327] p-8 text-slate-300">Loading review queue...</main>}>
      <ReviewQueueContent searchParams={searchParams} />
    </Suspense>
  );
}
