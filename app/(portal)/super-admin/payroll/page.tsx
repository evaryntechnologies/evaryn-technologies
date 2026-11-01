import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { BadgeCheck, Clock, HandCoins, Hourglass, SlidersHorizontal, Wallet } from "lucide-react";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";
import { approveWorkforcePay, markWorkforcePaid } from "./actions";
import {
  PageShell,
  PageHeader,
  TabNav,
  EmptyState,
  Pill,
  Metric,
  card,
  inputCls,
  btnPrimary,
  btnGhost,
  moneyFmt,
  dateFmt,
} from "@/app/portal/ui";

type Candidate = {
  eventKey: string;
  sourceType: string;
  taskId: string | null;
  employeeId: string;
  fullName: string;
  grossAmount: unknown;
  fineAmount: unknown;
  payoutDate: Date;
  label: string;
};
type Ledger = {
  id: string;
  sourceType: string;
  fullName: string;
  label: string;
  grossAmount: unknown;
  fineAmount: unknown;
  payableAmount: unknown;
  payoutDate: Date;
  status: string;
  paymentReference: string | null;
  paidAt: Date | null;
  hasMethod: boolean;
};

const sourceLabel: Record<string, string> = {
  TASKER: "Tasker",
  REVIEWER: "Reviewer",
  QA: "QA",
  ADMIN_TIME: "Admin time",
};

async function Content({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  await connection();
  const user = await requireEmployee(["SUPER_ADMIN"]);
  if (user.role !== "SUPER_ADMIN") throw new Error("Access denied");
  const view = (await searchParams).view === "paid" ? "paid" : "pending";

  // Zero-value entries can never be approved (the ledger only accepts amounts above zero),
  // so they are not shown as "waiting for approval".
  const [candidates, entries] = await Promise.all([
    prisma.$queryRaw<Candidate[]>`
      SELECT c."eventKey",c."sourceType",c."taskId",c."employeeId",e."fullName",c."grossAmount",c."fineAmount",c."payoutDate",
        COALESCE(t.title, 'Admin time session') AS label
      FROM public."WorkforcePayCandidates" c
      JOIN public."EmployeeProfile" e ON e.id=c."employeeId"
      LEFT JOIN public."WorkTask" t ON t.id=c."taskId"
      WHERE (c."grossAmount" - c."fineAmount") > 0
      ORDER BY c."payoutDate" ASC,c."eventKey" LIMIT 250`,
    prisma.$queryRaw<Ledger[]>`
      SELECT l.id,l."sourceType",e."fullName",COALESCE(t.title,'Admin time session') AS label,
        l."grossAmount",l."fineAmount",l."payableAmount",l."payoutDate",l.status,l."paymentReference",l."paidAt",
        EXISTS(SELECT 1 FROM public."EmployeePaymentMethod" m WHERE m."employeeId"=l."employeeId" AND length(btrim(m.details))>0) AS "hasMethod"
      FROM public."WorkforcePayLedger" l JOIN public."EmployeeProfile" e ON e.id=l."employeeId"
      LEFT JOIN public."WorkTask" t ON t.id=l."taskId"
      ORDER BY l."payoutDate" DESC,l."createdAt" DESC LIMIT 500`,
  ]);

  const pending = entries.filter((x) => x.status === "PENDING");
  const paid = entries.filter((x) => x.status === "PAID");
  const pendingTotal = pending.reduce((v, x) => v + Number(x.payableAmount), 0);
  const shown = view === "paid" ? paid : pending;

  return (
    <>
      <PageHeader
        eyebrow="Super Admin"
        title="Payroll"
        subtitle="Approve completed work and closed Admin time sessions, then record the external payment. Money is never sent automatically from here."
        actions={
          <>
            <Link href="/portal/super-admin/payroll/pay-team" className={btnPrimary}>
              <HandCoins size={16} aria-hidden="true" /> Pay Team · employee balances
            </Link>
            <Link href="/portal/super-admin/payment-adjustments" className={btnGhost}>
              <SlidersHorizontal size={16} aria-hidden="true" /> Payment adjustments
            </Link>
            <Link href="/portal/super-admin/payroll/admin-hours" className={btnGhost}>
              <Clock size={16} aria-hidden="true" /> Admin hours
            </Link>
          </>
        }
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <Metric label="Awaiting your approval" value={candidates.length} accent="#f59e0b" note="Payable balance above $0 after fines" />
        <Metric label="Approved, not yet paid" value={pending.length} accent="#00b0f8" />
        <Metric label="Net pending payment" value={moneyFmt(pendingTotal)} accent="#10b981" />
      </section>

      {/* ---------- Awaiting approval ---------- */}
      <section className="mt-10">
        <div className="mb-4 flex items-center gap-3">
          <Hourglass size={19} className="text-[var(--ev-accent-text)]" aria-hidden="true" />
          <h2 className="text-lg font-bold">Earnings awaiting approval</h2>
        </div>
        <p className="mb-4 max-w-3xl text-sm leading-7 text-[var(--ev-muted)]">
          Tasker: order value minus active fines. Reviewer: 1.50 per review. QA: 1.00 per QA review. Admin: 2.00 per clocked hour. Reviewer and QA credits stay withheld until the client has paid and the order is completed.
        </p>
        {candidates.length === 0 ? (
          <EmptyState icon={BadgeCheck} title="Nothing waiting for approval" text="Every earning that can be approved has been approved." />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {candidates.map((c) => {
              const net = Math.max(0, Number(c.grossAmount) - Number(c.fineAmount));
              return (
                <article key={c.eventKey} className={`${card} flex flex-wrap items-center justify-between gap-4 p-5`}>
                  <div className="min-w-0">
                    <p className="truncate font-bold">{c.fullName}</p>
                    <p className="mt-1 truncate text-sm text-[var(--ev-muted)]">{c.label}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Pill tone="violet">{sourceLabel[c.sourceType] ?? c.sourceType}</Pill>
                      <span className="text-xs text-[var(--ev-muted)]">Cycle {dateFmt(c.payoutDate)}</span>
                    </div>
                    <p className="mt-2 text-xs text-[var(--ev-muted)]">
                      Gross {moneyFmt(c.grossAmount)} · Fines {moneyFmt(c.fineAmount)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold tabular-nums text-[var(--ev-accent-text)]">{moneyFmt(net)}</p>
                    <form action={approveWorkforcePay} className="mt-3">
                      <input type="hidden" name="eventKey" value={c.eventKey} />
                      <button className={btnPrimary}>Approve</button>
                    </form>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* ---------- Ledger ---------- */}
      <section className="mt-12">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Wallet size={19} className="text-[var(--ev-accent-text)]" aria-hidden="true" />
            <h2 className="text-lg font-bold">Payroll ledger</h2>
          </div>
          <TabNav
            label="Ledger view"
            tabs={[
              { key: "pending", label: "To pay", href: "/portal/super-admin/payroll", count: pending.length, active: view === "pending" },
              { key: "paid", label: "Paid", href: "/portal/super-admin/payroll?view=paid", count: paid.length, active: view === "paid" },
            ]}
          />
        </div>

        {shown.length === 0 ? (
          <EmptyState icon={HandCoins} title={view === "paid" ? "No payments recorded yet" : "No approved entries to pay"} text={view === "paid" ? "Recorded payments will appear here." : "Approve earnings above and they will show here, ready to pay."} />
        ) : (
          <ul className="space-y-3">
            {shown.map((e) => (
              <li key={e.id} className={`${card} p-5`}>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-bold">{e.fullName}</p>
                    <p className="mt-1 truncate text-sm text-[var(--ev-muted)]">
                      {sourceLabel[e.sourceType] ?? e.sourceType} · {e.label}
                    </p>
                    <p className="mt-1 text-xs text-[var(--ev-muted)]">
                      Cycle {dateFmt(e.payoutDate)} · Gross {moneyFmt(e.grossAmount)} · Fines {moneyFmt(e.fineAmount)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-xl font-bold tabular-nums">{moneyFmt(e.payableAmount)}</p>
                    <Pill tone={e.status === "PAID" ? "green" : "amber"}>{e.status === "PAID" ? "Paid" : "To pay"}</Pill>
                  </div>
                </div>

                {e.status === "PAID" ? (
                  <p className="mt-3 text-sm text-[var(--ev-muted)]">
                    Reference <strong className="text-[var(--ev-ink)]">{e.paymentReference}</strong> · {dateFmt(e.paidAt)}
                  </p>
                ) : (
                  <details className="group mt-4 rounded-xl bg-[var(--ev-inset)] p-4">
                    <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-[var(--ev-accent-text)]">
                      Record external payment
                      <span className="transition group-open:rotate-180" aria-hidden="true">▾</span>
                    </summary>
                    {!e.hasMethod && (
                      <p className="mt-3 text-sm font-semibold text-amber-700 dark:text-amber-300">
                        This employee has no payment details on file, so payment cannot be recorded yet.
                      </p>
                    )}
                    <form action={markWorkforcePaid} className="mt-3 grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
                      <input type="hidden" name="id" value={e.id} />
                      <input name="reference" required minLength={3} maxLength={150} placeholder="External payment reference" className={inputCls} />
                      <input name="note" maxLength={1000} placeholder="Optional reconciliation note" className={inputCls} />
                      <button disabled={!e.hasMethod} className={btnPrimary}>Record payment</button>
                    </form>
                  </details>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

export default function Page(props: { searchParams: Promise<{ view?: string }> }) {
  return (
    <PageShell>
      <Suspense fallback={<div className={`${card} p-8 text-[var(--ev-muted)]`}>Loading payroll…</div>}>
        <Content {...props} />
      </Suspense>
    </PageShell>
  );
}
