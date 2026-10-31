import { Suspense } from "react";
import { connection } from "next/server";
import { Star } from "lucide-react";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";

function OrderStars({ rating }: { rating: number | null }) {
  const valid = rating !== null && Number.isFinite(rating);
  const score = valid ? Math.max(0, Math.min(5, rating)) : 0;
  return (
    <div className="flex flex-wrap items-center gap-2" aria-label={valid ? `Client rating: ${score} out of 5` : "Not yet rated"}>
      <div className="flex items-center gap-0.5" aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => (
          <Star
            key={index}
            className={`h-4 w-4 ${valid && index < Math.round(score) ? "text-amber-500" : "text-slate-300 dark:text-slate-600"}`}
            fill={valid && index < Math.round(score) ? "#FBBF24" : "#CBD5E1"}
            strokeWidth={1.5}
          />
        ))}
      </div>
      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
        {valid ? `${score.toFixed(1)} / 5` : "Not rated"}
      </span>
    </div>
  );
}

function PaymentBar({ percent }: { percent: number | null }) {
  if (percent === null || !Number.isFinite(percent)) {
    return <p className="text-xs text-slate-500 dark:text-slate-400">Payment not recorded</p>;
  }
  const value = Math.max(0, Math.min(100, percent));
  const color = value >= 80 ? "bg-emerald-500" : value > 50 ? "bg-amber-400" : "bg-rose-500";
  return (
    <div className="w-full max-w-xs space-y-1.5">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-semibold text-slate-800 dark:text-white">{value.toLocaleString("en-US", { maximumFractionDigits: 1 })}% paid</span>
        <span className="text-slate-500 dark:text-slate-400">of order</span>
      </div>
      <div
        role="progressbar"
        aria-label="Client payment percentage"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        className="h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
      >
        <div className={`h-full rounded-full transition-[width] ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

async function RatingsContent() {
  await connection();
  const user = await requireEmployee();
  const profile = await prisma.employeeProfile.findUnique({
    where: { authUserId: user.id },
    select: { id: true },
  });
  const reviews = profile
    ? await prisma.taskReview.findMany({
        where: {
          OR: [
            { submission: { employeeId: profile.id } },
            { submission: { reviews: { some: { reviewerId: profile.id } } } },
          ],
        },
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
                  clientRating: true,
                  clientPaidPercent: true,
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
    <section className="min-w-0 space-y-5">
      <header>
        <p className="text-xs font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-300">Quality and Feedback</p>
        <h1 className="mt-2 text-2xl font-semibold">My Ratings &amp; Rubrics</h1>
        <p className="mt-1 text-sm opacity-70">Client ratings and payment completion for orders you worked on.</p>
      </header>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#102442]">
        <div className="hidden grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 md:grid">
          <span>Order Details</span><span>Order Rating</span><span>% of Completion</span>
        </div>
        {reviews.map((review) => (
          <article key={review.id} className="grid min-w-0 gap-4 border-b border-slate-200 p-4 last:border-b-0 dark:border-white/10 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)] md:items-center">
            <div className="min-w-0 space-y-1">
              <p className="break-words text-sm font-semibold text-slate-900 dark:text-white">{review.submission.task.title}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{review.submission.task.publicTaskId ?? "Order"} · {review.stage.replaceAll("_", " ")}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{review.createdAt.toLocaleDateString("en-GB")}</p>
              {review.feedback && <p className="break-words whitespace-pre-wrap text-xs text-slate-600 dark:text-slate-300">{review.feedback}</p>}
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 md:hidden">Order Rating</p>
              <OrderStars rating={review.submission.task.clientRating} />
            </div>
            <div className="min-w-0 space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 md:hidden">% of Completion</p>
              <PaymentBar percent={review.submission.task.clientPaidPercent == null ? null : Number(review.submission.task.clientPaidPercent)} />
            </div>
          </article>
        ))}
        {reviews.length === 0 && <p className="p-6 text-sm text-slate-500 dark:text-slate-400">No order evaluations recorded for your work yet.</p>}
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">Payment bar: green 80–100%, yellow above 50% to below 80%, red 0–50%. The bar shows the client payment percentage, not task progress.</p>
    </section>
  );
}

export default function RatingsPage() {
  return (
    <Suspense fallback={<section className="space-y-3" aria-busy="true"><h1 className="text-2xl font-semibold">My Ratings &amp; Rubrics</h1><p className="text-sm opacity-70">Loading ratings...</p></section>}>
      <RatingsContent />
    </Suspense>
  );
}
