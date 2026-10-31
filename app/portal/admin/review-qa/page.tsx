import { BackLink } from "@/app/portal/ui";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";

async function ReviewQAContent() {
  await connection();
  await requireEmployee(["ADMIN", "SUPER_ADMIN"]);
  const tasks = await prisma.workTask.findMany({
    select: { id: true, publicTaskId: true, title: true, category: true, status: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });
  const pendingReview = tasks.filter(t => t.status === "PENDING_REVIEW").length;
  const pendingQA = tasks.filter(t => t.status === "PENDING_QA").length;
  const delivered = tasks.filter(t => t.status === "DELIVERED").length;
  return (
    <main className="min-h-screen bg-[#071327] px-4 py-8 text-white sm:px-8">
      <div className="w-full">
        <BackLink href="/portal" label="Dashboard" />
        <header className="mt-6 border-b border-white/10 pb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan-300">EVARYN TECHNOLOGIES LIMITED</p>
          <h1 className="mt-3 text-3xl font-bold">Review &amp; QA Oversight</h1>
          <p className="mt-2 text-sm text-slate-300">Read-only monitoring of the latest 100 orders. Review and QA decisions remain restricted to their authorized roles.</p>
        </header>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            ["Awaiting Review", pendingReview],
            ["Awaiting QA", pendingQA],
            ["Delivered", delivered],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-white/10 bg-[#101F39] p-5">
              <p className="text-sm text-slate-300">{label}</p>
              <p className="mt-2 text-2xl font-bold">{value}</p>
            </div>
          ))}
        </div>
        <section className="mt-8 rounded-xl border border-white/10 bg-[#101F39] p-4 sm:p-6">
          <h2 className="text-xl font-semibold">Recent orders</h2>
          <div className="mt-4 space-y-3">
            {tasks.map(task => (
              <article key={task.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 p-4">
                <div className="min-w-0">
                  <p className="font-semibold break-words">{task.publicTaskId ?? task.id} Â· {task.title}</p>
                  <p className="mt-1 text-xs text-slate-300">{task.category} Â· {task.status.replaceAll("_", " ")} Â· {task.updatedAt.toLocaleDateString("en-KE", { timeZone: "Africa/Nairobi" })}</p>
                </div>
                <Link href="/portal/admin/task-management" className="text-sm font-semibold text-cyan-300 hover:underline">Task Management</Link>
              </article>
            ))}
            {!tasks.length && <p className="text-sm text-slate-300">No orders found.</p>}
          </div>
        </section>
      </div>
    </main>
  );
}

export default function ReviewQAPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#071327] p-8 text-slate-300">Loading Review &amp; QA oversight...</main>}>
      <ReviewQAContent />
    </Suspense>
  );
}