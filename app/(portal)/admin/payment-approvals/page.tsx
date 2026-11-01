import { connection } from "next/server";
import { Suspense } from "react";
import { CheckCircle2, CreditCard, Lock, XCircle } from "lucide-react";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";
import { decidePaymentChange } from "./actions";
import { canChangePaymentNow } from "@/app/portal/payment-method/payment-utils";
import {
  PageShell, PageHeader, EmptyState, Pill, card, textareaCls, btnPrimary, dateTimeFmt,
} from "@/app/portal/ui";

type Request = { id: string; employeeId: string; method: string; accountName: string; requestedAt: Date; fullName: string; email: string };

async function Content() {
  await connection();
  const auth = await requireEmployee(["ADMIN", "SUPER_ADMIN"]);
  const p = await prisma.employeeProfile.findUnique({ where: { authUserId: auth.id }, select: { role: true, status: true } });
  if (!p || p.status !== "ACTIVE" || !["ADMIN", "SUPER_ADMIN"].includes(p.role)) throw new Error("Not authorized.");
  const requests = await prisma.$queryRaw<Request[]>`SELECT r."id",r."employeeId",r."method",r."accountName",r."requestedAt",e."fullName",e."email" FROM public."PaymentChangeRequest" r JOIN public."EmployeeProfile" e ON e."id"=r."employeeId" WHERE r."status"='PENDING' ORDER BY r."requestedAt" ASC LIMIT 100`;
  const locked = !canChangePaymentNow();

  return (
    <>
      <PageHeader
        eyebrow="Approvals"
        title="Payment method approvals"
        subtitle="Pending first-time registrations and changes appear here. Approve or reject each request. Account numbers stay encrypted and are never shown."
      />
      {locked && (
        <div role="status" className="mb-6 flex items-center gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-5 py-4 text-sm font-semibold">
          <Lock size={17} aria-hidden="true" /> Changes to an existing payment method are locked before payout. First-time registrations and rejections remain available.
        </div>
      )}
      {requests.length === 0 ? (
        <EmptyState icon={CreditCard} title="No pending requests" text="First-time registrations and payment method changes from employees will appear here." />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {requests.map((r) => (
            <article key={r.id} className={`${card} p-5`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-bold">{r.fullName}</h2>
                  <p className="mt-0.5 truncate text-sm text-[var(--ev-muted)]">{r.email}</p>
                </div>
                <Pill tone="blue">{r.method}</Pill>
              </div>
              <p className="mt-3 text-sm">Account name: <strong>{r.accountName}</strong></p>
              <p className="mt-1 text-xs text-[var(--ev-muted)]">Requested {dateTimeFmt(r.requestedAt)}</p>
              <form action={decidePaymentChange} className="mt-4 space-y-3">
                <input type="hidden" name="id" value={r.id} />
                <textarea name="note" placeholder="Reason or approval notes (optional)" maxLength={2000} rows={2} className={textareaCls} />
                <div className="flex gap-3">
                  <button name="decision" value="APPROVED" className={btnPrimary}><CheckCircle2 size={15} aria-hidden="true" /> Approve</button>
                  <button name="decision" value="REJECTED" className="inline-flex items-center gap-2 rounded-xl border border-rose-500/50 px-5 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-500 hover:text-white disabled:opacity-40 dark:text-rose-300"><XCircle size={15} aria-hidden="true" /> Reject</button>
                </div>
              </form>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
export default function Page() {
  return <PageShell><Suspense fallback={<div className={`${card} p-8 text-[var(--ev-muted)]`}>Loading approvals…</div>}><Content /></Suspense></PageShell>;
}
