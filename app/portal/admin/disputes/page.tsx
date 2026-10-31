import { Suspense } from "react";
import { connection } from "next/server";
import { Gavel, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { requireEmployee } from "@/lib/auth/require-employee";
import { resolveTaskIssue } from "@/app/portal/tasks/[taskId]/issues/actions";
import {
  PageShell, PageHeader, EmptyState, Pill, card, textareaCls, btnPrimary, dateTimeFmt,
} from "@/app/portal/ui";

async function Content() {
  await connection();
  await requireEmployee(["QA", "ADMIN", "SUPER_ADMIN"]);
  const issues = await prisma.taskDispute.findMany({
    where: { status: "OPEN" },
    include: { task: { select: { title: true, publicTaskId: true } }, raisedBy: { select: { fullName: true } } },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  return (
    <>
      <PageHeader
        eyebrow="Quality"
        title="Task disputes"
        subtitle="Resolve review concerns without changing the task status. Only authorised QA and management can resolve."
      />
      {issues.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="No unresolved disputes" text="Open disputes raised on orders will appear here." />
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {issues.map((i) => (
            <article key={i.id} className={`${card} p-5`}>
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone="rose"><Gavel size={12} className="mr-1" aria-hidden="true" /> Open</Pill>
                <span className="text-xs font-semibold text-[var(--ev-muted)]">{i.task.publicTaskId ?? i.taskId.slice(0, 8)}</span>
              </div>
              <h2 className="mt-3 text-lg font-bold leading-snug">{i.task.title}</h2>
              <p className="mt-1 text-xs text-[var(--ev-muted)]">Raised by {i.raisedBy.fullName}{` · ${dateTimeFmt(i.createdAt)}`}</p>
              <p className="mt-3 whitespace-pre-wrap rounded-xl bg-[var(--ev-inset)] p-3 text-sm leading-7">{i.reason}</p>
              <form action={resolveTaskIssue} className="mt-4 flex flex-col gap-3">
                <input type="hidden" name="id" value={i.id} />
                <textarea required minLength={10} maxLength={5000} name="resolution" rows={3} className={textareaCls} placeholder="Explain the resolution" />
                <button className={`${btnPrimary} self-start`}>Resolve issue</button>
              </form>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
export default function Page() {
  return <PageShell><Suspense fallback={<div className={`${card} p-8 text-[var(--ev-muted)]`}>Loading disputes…</div>}><Content /></Suspense></PageShell>;
}
