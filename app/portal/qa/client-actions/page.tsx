import { Suspense } from "react";
import { connection } from "next/server";
import {
  CheckCircle2,
  Clock,
  PackageCheck,
  Paperclip,
  Percent,
  RotateCcw,
  Star,
  XCircle,
} from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { requireEmployee } from "@/lib/auth/require-employee";
import { finalizeClientAction } from "./actions";
import {
  PageShell,
  PageHeader,
  EmptyState,
  Pill,
  Metric,
  card,
  inputCls,
  textareaCls,
  btnPrimary,
  moneyFmt,
  dateTimeFmt,
} from "@/app/portal/ui";

function waiting(d: Date) {
  const hrs = Math.max(1, Math.round((Date.now() - d.getTime()) / 3600000));
  if (hrs < 24) return `${hrs} hr`;
  const days = Math.round(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"}`;
}

function Stars({ required }: { required?: boolean }) {
  return (
    <div className="mt-2 flex gap-1.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <label key={i} className="cursor-pointer">
          <input type="radio" name="rating" value={i} required={required} className="peer sr-only" />
          <span className="flex h-10 w-10 flex-col items-center justify-center rounded-xl border border-[var(--ev-border)] bg-[var(--ev-surface)] text-sm font-bold transition peer-checked:border-transparent peer-checked:bg-[var(--ev-primary)] peer-checked:text-[var(--ev-on-primary)] peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--ev-cyan)]">
            <Star size={10} aria-hidden="true" />
            {i}
          </span>
          <span className="sr-only">{i} stars</span>
        </label>
      ))}
    </div>
  );
}

const panel = "flex flex-col rounded-xl bg-[var(--ev-inset)] p-4";

async function Content() {
  await connection();
  await requireEmployee(["QA", "ADMIN", "SUPER_ADMIN"]);

  const tasks = await prisma.workTask.findMany({
    where: { status: "DELIVERED_AWAITING_CLIENT" },
    select: {
      id: true,
      publicTaskId: true,
      title: true,
      category: true,
      totalOrderCost: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "asc" },
    take: 100,
  });

  return (
    <>
      <PageHeader
        eyebrow="Client operations"
        title="Delivered, awaiting the client"
        subtitle="Record what the client decided. A revision goes straight back to the Tasker. A partial payment prorates Tasker, Reviewer and QA earnings: 50% or more completes the order, below 50% cancels it."
      />

      <section className="mb-8 grid gap-4 sm:grid-cols-3">
        <Metric label="Awaiting an outcome" value={tasks.length} accent="#00b0f8" />
        <Metric label="Completion threshold" value="50%" accent="#10b981" note="Partial payment at or above this completes" />
        <Metric label="Revisions" value="Direct" accent="#f59e0b" note="Returned to the assigned Tasker" />
      </section>

      {tasks.length === 0 ? (
        <EmptyState icon={PackageCheck} title="All caught up" text="No delivered orders are awaiting a client decision right now." />
      ) : (
        <div className="grid gap-6 2xl:grid-cols-2">
          {tasks.map((t) => (
            <article key={t.id} className={`${card} overflow-hidden`}>
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--ev-border-soft)] p-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill tone="cyan">Delivered</Pill>
                    <span className="text-xs font-semibold text-[var(--ev-muted)]">
                      {t.publicTaskId ?? t.id.slice(0, 8)} · {t.category ?? "General"}
                    </span>
                  </div>
                  <h2 className="mt-3 text-lg font-bold leading-snug">{t.title}</h2>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold tabular-nums text-[var(--ev-accent-text)]">
                    {t.totalOrderCost == null ? "—" : moneyFmt(t.totalOrderCost.toString())}
                  </p>
                  <p className="mt-1 inline-flex items-center gap-1 text-xs text-[var(--ev-muted)]" title={dateTimeFmt(t.updatedAt)}>
                    <Clock size={12} aria-hidden="true" /> Waiting {waiting(t.updatedAt)}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 p-5 md:grid-cols-2">
                {/* 1. Paid in full */}
                <form action={finalizeClientAction} encType="multipart/form-data" className={panel}>
                  <input type="hidden" name="taskId" value={t.id} />
                  <p className="flex items-center gap-2 text-sm font-bold">
                    <CheckCircle2 size={16} className="text-emerald-500" aria-hidden="true" /> Client paid 100%
                  </p>
                  <fieldset className="mt-3 flex-1">
                    <legend className="text-xs font-semibold text-[var(--ev-muted)]">Client rating (required)</legend>
                    <Stars required />
                  </fieldset>
                  <button name="action" value="PAID_FULL" className={`${btnPrimary} mt-4 w-full`}>
                    <CheckCircle2 size={16} aria-hidden="true" /> Complete order
                  </button>
                </form>

                {/* 2. Paid partially */}
                <form action={finalizeClientAction} encType="multipart/form-data" className={panel}>
                  <input type="hidden" name="taskId" value={t.id} />
                  <p className="flex items-center gap-2 text-sm font-bold">
                    <Percent size={16} className="text-cyan-500" aria-hidden="true" /> Client paid partially
                  </p>
                  <label className="mt-3 text-xs font-semibold text-[var(--ev-muted)]">
                    Percentage paid
                    <input name="percentage" type="number" required min="0.01" max="99.99" step="0.01" placeholder="e.g. 60" className={`${inputCls} mt-1.5`} />
                  </label>
                  <fieldset className="mt-3 flex-1">
                    <legend className="text-xs font-semibold text-[var(--ev-muted)]">Rating (needed when 50% or more)</legend>
                    <Stars />
                  </fieldset>
                  <button name="action" value="PAID_PARTIAL" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--ev-cyan)] px-5 py-2.5 text-sm font-semibold text-[var(--ev-accent-text)] transition hover:bg-[var(--ev-cyan)] hover:text-[#00224f]">
                    <Percent size={16} aria-hidden="true" /> Record partial payment
                  </button>
                </form>

                {/* 3. Revision */}
                <form action={finalizeClientAction} encType="multipart/form-data" className={panel}>
                  <input type="hidden" name="taskId" value={t.id} />
                  <p className="flex items-center gap-2 text-sm font-bold">
                    <RotateCcw size={16} className="text-amber-500" aria-hidden="true" /> Client wants a revision
                  </p>
                  <label className="mt-3 flex-1 text-xs font-semibold text-[var(--ev-muted)]">
                    Revision instructions (required)
                    <textarea name="note" required minLength={10} maxLength={5000} rows={3} placeholder="Explain the requested changes" className={`${textareaCls} mt-1.5 block`} />
                  </label>
                  <label className="mt-3 text-xs font-semibold text-[var(--ev-muted)]">
                    <span className="inline-flex items-center gap-1.5"><Paperclip size={12} aria-hidden="true" /> Supporting attachment (optional, up to 10 MB)</span>
                    <input name="attachment" type="file" className="mt-1.5 block w-full text-sm" />
                  </label>
                  <button name="action" value="REVISION" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-amber-500/60 px-5 py-2.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-500 hover:text-white dark:text-amber-300">
                    <RotateCcw size={16} aria-hidden="true" /> Return to Tasker
                  </button>
                </form>

                {/* 4. Cancelled */}
                <form action={finalizeClientAction} encType="multipart/form-data" className={panel}>
                  <input type="hidden" name="taskId" value={t.id} />
                  <p className="flex items-center gap-2 text-sm font-bold">
                    <XCircle size={16} className="text-rose-500" aria-hidden="true" /> Client cancelled (0% paid)
                  </p>
                  <label className="mt-3 flex-1 text-xs font-semibold text-[var(--ev-muted)]">
                    Reason for cancellation (required)
                    <textarea name="note" required minLength={10} maxLength={5000} rows={3} placeholder="Explain the grounds, with enough detail for investigation" className={`${textareaCls} mt-1.5 block`} />
                  </label>
                  <button name="action" value="CANCELED" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/60 px-5 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-500 hover:text-white dark:text-rose-300">
                    <XCircle size={16} aria-hidden="true" /> Mark cancelled
                  </button>
                </form>
              </div>
              <p className="border-t border-[var(--ev-border-soft)] px-5 py-3 text-xs text-[var(--ev-muted)]">
                Partial percentages apply to role-specific gross earnings. Entries that are already approved or paid are never rewritten.
              </p>
            </article>
          ))}
        </div>
      )}
    </>
  );
}

export default function Page() {
  return (
    <PageShell>
      <Suspense fallback={<div className={`${card} p-8 text-[var(--ev-muted)]`}>Loading client actions…</div>}>
        <Content />
      </Suspense>
    </PageShell>
  );
}
