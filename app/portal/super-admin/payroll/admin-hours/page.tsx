import { Suspense } from "react";
import { connection } from "next/server";
import { BadgeCheck, Clock, Timer } from "lucide-react";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";
import { approveWorkforcePay } from "../actions";
import {
  PageShell,
  PageHeader,
  EmptyState,
  Pill,
  card,
  btnPrimary,
  moneyFmt,
  dateFmt,
  statusTone,
  prettyStatus,
} from "@/app/portal/ui";

type Row = {
  eventKey: string;
  employeeId: string;
  fullName: string;
  eligibleAt: Date;
  grossAmount: unknown;
  fineAmount: unknown;
  payoutDate: Date;
  sessionId: string | null;
};
type Approved = {
  id: string;
  fullName: string;
  grossAmount: unknown;
  payableAmount: unknown;
  status: string;
  payoutDate: Date;
};

async function Content() {
  await connection();
  const user = await requireEmployee(["SUPER_ADMIN"]);
  if (user.role !== "SUPER_ADMIN") throw new Error("Super Admin only");

  // Sessions with no payable balance above $0.00 cannot be approved, so they are not listed as waiting.
  const [items, approved] = await Promise.all([
    prisma.$queryRaw<Row[]>`
      SELECT c."eventKey",c."employeeId",e."fullName",c."eligibleAt",c."grossAmount",c."fineAmount",c."payoutDate",c."sessionId"
      FROM public."WorkforcePayCandidates" c
      JOIN public."EmployeeProfile" e ON e.id=c."employeeId"
      WHERE c."sourceType"='ADMIN_TIME' AND (c."grossAmount" - c."fineAmount") > 0
      ORDER BY c."eligibleAt" DESC LIMIT 200`,
    prisma.$queryRaw<Approved[]>`
      SELECT l.id,e."fullName",l."grossAmount",l."payableAmount",l.status,l."payoutDate"
      FROM public."WorkforcePayLedger" l JOIN public."EmployeeProfile" e ON e.id=l."employeeId"
      WHERE l."sourceType"='ADMIN_TIME' ORDER BY l."createdAt" DESC LIMIT 200`,
  ]);

  return (
    <>
      <PageHeader
        back={{ href: "/portal/super-admin/payroll", label: "Payroll" }}
        eyebrow="Super Admin"
        title="Approve tracked Admin hours"
        subtitle="Only finished, server-recorded active sessions are payable. Approval adds the amount to the payroll ledger; it does not send money."
      />

      <div className="mb-4 flex items-center gap-3">
        <Timer size={19} className="text-[var(--ev-accent-text)]" aria-hidden="true" />
        <h2 className="text-lg font-bold">Awaiting approval</h2>
        <Pill tone="amber">{items.length}</Pill>
      </div>
      {items.length === 0 ? (
        <EmptyState icon={BadgeCheck} title="No sessions awaiting approval" text="Completed Admin sessions with payable time will appear here." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((x) => (
            <article key={x.eventKey} className={`${card} flex items-center justify-between gap-4 p-5`}>
              <div className="min-w-0">
                <p className="font-bold">{x.fullName}</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-[var(--ev-muted)]">
                  <Clock size={13} aria-hidden="true" /> {dateFmt(x.eligibleAt)} · pay period {dateFmt(x.payoutDate)}
                </p>
                <p className="mt-2 text-2xl font-bold tabular-nums text-[var(--ev-accent-text)]">{moneyFmt(x.grossAmount)}</p>
              </div>
              <form action={approveWorkforcePay}>
                <input type="hidden" name="eventKey" value={x.eventKey} />
                <button className={btnPrimary}>Approve hours</button>
              </form>
            </article>
          ))}
        </div>
      )}

      <h2 className="mb-4 mt-12 text-lg font-bold">Already approved</h2>
      {approved.length === 0 ? (
        <p className="text-sm text-[var(--ev-muted)]">None yet.</p>
      ) : (
        <ul className="divide-y divide-[var(--ev-border-soft)] overflow-hidden rounded-2xl border border-[var(--ev-border-soft)] bg-[var(--ev-surface)]">
          {approved.map((x) => (
            <li key={x.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <span className="font-semibold">{x.fullName}</span>
              <span className="text-sm text-[var(--ev-muted)]">{dateFmt(x.payoutDate)}</span>
              <span className="font-bold tabular-nums">{moneyFmt(x.payableAmount)}</span>
              <Pill tone={statusTone(x.status)}>{prettyStatus(x.status)}</Pill>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default function Page() {
  return (
    <PageShell>
      <Suspense fallback={<div className={`${card} p-8 text-[var(--ev-muted)]`}>Loading Admin hours…</div>}>
        <Content />
      </Suspense>
    </PageShell>
  );
}
