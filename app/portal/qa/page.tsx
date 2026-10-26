import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";

async function QAContent() {
  await connection();

  const user = await requireEmployee(["QA"]);

  const [pending, completed, returned] = await Promise.all([
    prisma.workTask.count({
      where: { status: "PENDING_QA" },
    }),
    prisma.workTask.count({
      where: { status: "COMPLETED" },
    }),
    prisma.taskReview.count({
      where: {
        stage: "QA",
        decision: "REWORK_REQUIRED",
      },
    }),
  ]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-widest text-cyan-300">
            EVARYN TECHNOLOGIES LIMITED
          </p>

          <h1 className="mt-4 text-3xl font-bold">
            Quality Assurance
          </h1>

          <p className="mt-3 text-sm leading-7 text-slate-300">
            Monitor submissions, conduct final quality checks,
            and track completed work.
          </p>
        </div>

        <Link
          href={
            user.role === "SUPER_ADMIN"
              ? "/portal/super-admin"
              : "/portal"
          }
          className="rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-cyan-300 hover:bg-white/5"
        >
          Back to Dashboard
        </Link>
      </div>

      {user.role === "SUPER_ADMIN" && (
        <div className="mt-7 rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-4 text-sm text-cyan-200">
          Super Admin oversight mode — you can inspect QA activity
          across the organization.
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-[#101F39] p-6">
          <p className="text-sm text-slate-300">Awaiting QA</p>
          <p className="mt-4 text-3xl font-bold text-cyan-300">
            {pending}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#101F39] p-6">
          <p className="text-sm text-slate-300">Completed Tasks</p>
          <p className="mt-4 text-3xl font-bold text-emerald-300">
            {completed}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#101F39] p-6">
          <p className="text-sm text-slate-300">QA Revision Decisions</p>
          <p className="mt-4 text-3xl font-bold text-amber-300">
            {returned}
          </p>
        </div>
      </div>

      <section className="mt-8 rounded-2xl border border-white/10 bg-[#101F39] p-6 sm:p-8">
        <h2 className="text-xl font-bold">
          Quality Assurance Queue
        </h2>

        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
          Review work approved by a Reviewer, inspect submissions,
          and provide a final quality decision.
        </p>

        <Link
          href="/portal/qa/queue"
          className="mt-6 inline-flex rounded-xl bg-[#0052CC] px-6 py-3 font-semibold text-white transition hover:bg-[#003F9E]"
        >
          Open QA Queue
        </Link>
      </section>

      <div className="mt-8">
        <Link
          href={user.role === "SUPER_ADMIN"
            ? "/portal/super-admin"
            : "/portal"}
          className="text-sm font-semibold text-cyan-300 hover:underline"
        >
          Return to Portal
        </Link>
      </div>
    </div>
  );
}

export default function QAPage() {
  return (
    <main className="min-h-screen bg-[#071327] px-5 py-9 text-white sm:px-10">
      <Suspense
        fallback={
          <div className="mx-auto max-w-6xl rounded-2xl border border-white/10 bg-[#101F39] p-8 text-slate-300">
            Loading Quality Assurance...
          </div>
        }
      >
        <QAContent />
      </Suspense>
    </main>
  );
}