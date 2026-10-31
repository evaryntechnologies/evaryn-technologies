import { connection } from "next/server";
import { Suspense } from "react";
import { CheckCircle2, Repeat, XCircle } from "lucide-react";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";
import { resolveReassignment } from "./actions";
import {
  PageShell, PageHeader, EmptyState, Pill, card, inputCls, btnPrimary, statusTone, prettyStatus,
} from "@/app/portal/ui";

async function Content() {
  await connection();
  await requireEmployee(["ADMIN", "SUPER_ADMIN"]);
  const rows = await prisma.taskReassignmentRequest.findMany({
    include: { employee: { select: { fullName: true } }, task: { select: { title: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const pending = rows.filter((r) => r.status === "PENDING");
  const history = rows.filter((r) => r.status !== "PENDING");

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Reassignment requests"
        subtitle="Employees asking to release an order they can no longer deliver. Approving returns the order to the Task Hub."
      />

      <h2 className="mb-4 flex items-center gap-3 text-lg font-bold">
        Waiting for a decision <Pill tone="amber">{pending.length}</Pill>
      </h2>
      {pending.length === 0 ? (
        <EmptyState icon={Repeat} title="No requests waiting" text="New reassignment requests will appear here." />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {pending.map((r) => (
            <article key={r.id} className={`${card} p-5`}>
              <h3 className="font-bold leading-snug">{r.task.title}</h3>
              <p className="mt-1 text-sm text-[var(--ev-muted)]">Requested by {r.employee.fullName}</p>
              <p className="mt-3 rounded-xl bg-[var(--ev-inset)] p-3 text-sm leading-7">{r.reason}</p>
              <form action={resolveReassignment} className="mt-4 space-y-3">
                <input type="hidden" name="requestId" value={r.id} />
                <input name="note" maxLength={2000} className={inputCls} placeholder="Admin note (optional)" />
                <div className="flex flex-wrap gap-3">
                  <button name="decision" value="APPROVED" className={btnPrimary}><CheckCircle2 size={15} aria-hidden="true" /> Approve and return to Hub</button>
                  <button name="decision" value="REJECTED" className="inline-flex items-center gap-2 rounded-xl border border-rose-500/50 px-5 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-500 hover:text-white dark:text-rose-300"><XCircle size={15} aria-hidden="true" /> Reject</button>
                </div>
              </form>
            </article>
          ))}
        </div>
      )}

      {history.length > 0 && (
        <>
          <h2 className="mb-4 mt-12 text-lg font-bold">Earlier decisions</h2>
          <ul className="divide-y divide-[var(--ev-border-soft)] overflow-hidden rounded-2xl border border-[var(--ev-border-soft)] bg-[var(--ev-surface)]">
            {history.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{r.task.title}</p>
                  <p className="text-xs text-[var(--ev-muted)]">{r.employee.fullName}</p>
                </div>
                <Pill tone={statusTone(r.status)}>{prettyStatus(r.status)}</Pill>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
export default function Page() {
  return <PageShell><Suspense fallback={<div className={`${card} p-8 text-[var(--ev-muted)]`}>Loading…</div>}><Content /></Suspense></PageShell>;
}
