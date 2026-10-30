import { Suspense } from "react";
import { connection } from "next/server";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";

async function RatingsContent() {
  await connection();

  const user = await requireEmployee();

  const profile = await prisma.employeeProfile.findUnique({
    where: { authUserId: user.id },
    select: { id: true },
  });

  const reviews = profile
    ? await prisma.taskReview.findMany({
        where: { submission: { employeeId: profile.id } },
        select: {
          id: true,
          stage: true,
          decision: true,
          feedback: true,
          createdAt: true,
          submission: {
            select: {
              task: {
                select: {
                  title: true,
                  publicTaskId: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      })
    : [];

  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-300">
          Quality and Feedback
        </p>
        <h1 className="mt-2 text-2xl font-semibold">
          My Ratings
        </h1>
        <p className="mt-2 text-sm opacity-70">
          Your latest 100 order evaluations.
        </p>
      </div>

      <div className="grid gap-3">
        {reviews.map((review) => (
          <article
            key={review.id}
            className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 dark:border-white/10 dark:bg-[#102442] dark:text-white"
          >
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <p className="font-semibold">
                  {review.submission.task.title}
                </p>
                <p className="mt-1 text-xs opacity-70">
                  {review.submission.task.publicTaskId ?? "Order"}
                  {" · "}
                  {review.stage.replaceAll("_", " ")}
                </p>
              </div>

              <span className="h-fit rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-blue-900 dark:bg-cyan-400/10 dark:text-cyan-200">
                {review.decision.replaceAll("_", " ")}
              </span>
            </div>

            <p className="mt-4 whitespace-pre-wrap text-sm opacity-80">
              {review.feedback || "No written feedback provided."}
            </p>

            <time className="mt-3 block text-xs opacity-60">
              {review.createdAt.toLocaleDateString("en-GB")}
            </time>
          </article>
        ))}

        {reviews.length === 0 && (
          <p className="rounded-2xl border border-slate-200 p-8 text-sm opacity-70 dark:border-white/10">
            No evaluations have been recorded for your submissions yet.
          </p>
        )}
      </div>
    </section>
  );
}

export default function RatingsPage() {
  return (
    <Suspense
      fallback={
        <section className="space-y-3" aria-busy="true">
          <h1 className="text-2xl font-semibold">My Ratings</h1>
          <p className="text-sm opacity-70">
            Loading your evaluations...
          </p>
        </section>
      }
    >
      <RatingsContent />
    </Suspense>
  );
}
