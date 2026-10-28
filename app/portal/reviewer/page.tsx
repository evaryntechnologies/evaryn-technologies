import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";

async function ReviewerContent() {
  await connection();

  const user = await requireEmployee(["REVIEWER"]);

  const [
    pendingReviews,
    approvedReviews,
    revisionRequests,
    recentlyReviewed,
  ] = await Promise.all([
    prisma.taskSubmission.count({
      where: {
        status: "PENDING_REVIEW",
        task: { status: "PENDING_REVIEW" },
      },
    }),

    prisma.taskReview.count({
      where: {
        stage: "REVIEWER",
        decision: "APPROVED",
      },
    }),

    prisma.taskReview.count({
      where: {
        stage: "REVIEWER",
        decision: "REWORK_REQUIRED",
      },
    }),

    prisma.taskReview.findMany({
      where: {
        stage: "REVIEWER",
      },
      select: {
        id: true,
        decision: true,
        feedback: true,
        createdAt: true,
        reviewer: {
          select: { fullName: true },
        },
        submission: {
          select: {
            task: {
              select: {
                title: true,
                project: { select: { title: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const superAdmin = user.role === "SUPER_ADMIN";

  return (
    <div className="w-full max-w-none">
      <nav aria-label="Workspace navigation" className="mb-5 flex flex-wrap gap-3"><Link href="/portal/notifications" className="rounded-lg border border-white/20 px-4 py-2 text-cyan-300">Notifications</Link><Link href="/portal/task-hub" className="rounded-lg bg-[#0052CC] px-4 py-2 text-white">Task Hub</Link><Link href="/portal/reviewer/queue" className="rounded-lg border border-white/20 px-4 py-2 text-cyan-300">My Queue</Link></nav>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <header>
          <p className="text-xs font-bold tracking-widest text-cyan-300">
            EVARYN TECHNOLOGIES LIMITED
          </p>

          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Reviewer Dashboard
          </h1>
          <p className="mt-3 text-lg font-semibold text-cyan-200">Welcome back, {user.firstName}</p>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
            Monitor submitted work, assess quality, provide
            feedback, and forward approved submissions to
            Quality Assurance.
          </p>
        </header>

        <Link
          href={superAdmin ? "/portal/super-admin" : "/portal"}
          className="rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-cyan-300 hover:bg-white/5"
        >
          Back to Dashboard
        </Link>
      </div>

      {superAdmin && (
        <div className="mt-7 rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-4 text-sm text-cyan-200">
          Super Admin oversight — view reviewer activity
          across the organization.
        </div>
      )}

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-[#101F39] p-6">
          <p className="text-sm text-slate-300">
            Awaiting Review
          </p>
          <p className="mt-4 text-3xl font-bold text-cyan-300">
            {pendingReviews}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#101F39] p-6">
          <p className="text-sm text-slate-300">
            Reviewer Approvals
          </p>
          <p className="mt-4 text-3xl font-bold text-emerald-300">
            {approvedReviews}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#101F39] p-6">
          <p className="text-sm text-slate-300">
            Revision Decisions
          </p>
          <p className="mt-4 text-3xl font-bold text-amber-300">
            {revisionRequests}
          </p>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-white/10 bg-[#101F39] p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <h2 className="text-xl font-bold">
              Submission Review Queue
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
              Open the queue to examine pending submissions,
              check employee work, and provide assessments.
            </p>
          </div>

          <Link
            href="/portal/reviewer/queue"
            className="inline-flex items-center justify-center rounded-xl bg-[#0052CC] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#003F9E]"
          >
            Open Review Queue
          </Link>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-white/10 bg-[#101F39] p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold">
            Recent Review Activity
          </h2>

          <span className="text-xs text-slate-400">
            Latest 10 decisions
          </span>
        </div>

        {recentlyReviewed.length === 0 ? (
          <p className="mt-5 text-sm text-slate-300">
            No review decisions have been recorded yet.
          </p>
        ) : (
          <div className="mt-6 space-y-3">
            {recentlyReviewed.map((review) => {
              const approved = review.decision === "APPROVED";

              return (
                <article
                  key={review.id}
                  className="rounded-xl border border-white/10 bg-[#071327]/70 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-cyan-300">
                        {review.submission.task.project?.title}
                      </p>

                      <h3 className="mt-2 font-semibold">
                        {review.submission.task.title}
                      </h3>

                      <p className="mt-2 text-xs text-slate-400">
                        Reviewed by {review.reviewer.fullName}
                      </p>
                    </div>

                    <span
                      className={
                        approved
                          ? "rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-300"
                          : "rounded-lg border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-xs font-semibold text-amber-300"
                      }
                    >
                      {approved ? "APPROVED" : "REVISIONS REQUESTED"}
                    </span>
                  </div>

                  {review.feedback && (
                    <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-slate-300">
                      {review.feedback}
                    </p>
                  )}

                  <p className="mt-4 text-xs text-slate-400">
                    {review.createdAt.toLocaleString("en-KE", {
                      timeZone: "Africa/Nairobi",
                    })}
                  </p>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <div className="mt-8">
        <Link
          href={superAdmin ? "/portal/super-admin" : "/portal"}
          className="text-sm font-semibold text-cyan-300 hover:underline"
        >
          Return to Portal
        </Link>
      </div>
    </div>
  );
}

export default function ReviewerPage() {
  return (
    <main className="min-h-screen bg-[#071327] px-5 py-9 text-white sm:px-10">
      <Suspense
        fallback={
          <div className="w-full max-w-none rounded-2xl border border-white/10 bg-[#101F39] p-8 text-slate-300">
            Loading Reviewer Dashboard...
          </div>
        }
      >
        <ReviewerContent />
      </Suspense>
    </main>
  );
}