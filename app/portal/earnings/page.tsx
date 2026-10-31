import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { Download, Receipt, SlidersHorizontal, Wallet } from "lucide-react";
import {
  getEarningsReport,
  cleanFilters,
  applyEarningsFilters,
  summarize,
} from "@/lib/earnings/report";
import {
  PageShell,
  PageHeader,
  EmptyState,
  Pill,
  Metric,
  card,
  inputCls,
  btnPrimary,
  btnGhost,
  moneyFmt,
} from "@/app/portal/ui";

type Props = { searchParams: Promise<Record<string, string | undefined>> };

const levelLabel = (s: string) =>
  s === "ADMIN_TIME" ? "Admin time" : s.replaceAll("_", " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

async function Content({ searchParams }: Props) {
  await connection();
  const filters = cleanFilters(await searchParams);
  const { employee, rows } = await getEarningsReport();
  const selected = applyEarningsFilters(rows, filters);
  const totals = summarize(selected);
  const lifetime = summarize(rows);
  const categories = Array.from(new Set(rows.map((r) => r.category))).sort();
  const roles = Array.from(new Set(rows.map((r) => r.sourceType))).sort();
  const byRole = roles.map((role) => ({ role, ...summarize(selected.filter((r) => r.sourceType === role)) }));
  const byCategory = categories.map((category) => ({ category, ...summarize(selected.filter((r) => r.category === category)) }));
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
  const filtering = Object.values(filters).some(Boolean);

  return (
    <>
      <PageHeader
        eyebrow="My earnings"
        title="Earnings"
        subtitle={`${employee.fullName} · ${employee.role.replaceAll("_", " ")} · USD (confirm compensation currency)`}
        actions={
          <Link href={`/api/portal/earnings/pdf?${params.toString()}`} className={btnPrimary}>
            <Download size={16} aria-hidden="true" /> Download statement (PDF)
          </Link>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Pending payments" value={moneyFmt(totals.pending)} accent="#10b981" note="Approved, not yet paid" />
        <Metric label="Completed payments" value={moneyFmt(totals.paid)} accent="#00b0f8" />
        <Metric label="Lifetime earnings" value={moneyFmt(lifetime.paid + lifetime.pending)} accent="#8b5cf6" note="Paid plus pending" />
        <Metric label="Lifetime completed payments" value={moneyFmt(lifetime.paid)} accent="#f59e0b" />
      </section>

      <form method="GET" className={`${card} mt-6 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto]`}>
        <label className="text-xs font-semibold text-[var(--ev-muted)]">Payout month
          <input name="month" type="month" defaultValue={filters.month} className={`${inputCls} mt-1.5`} />
        </label>
        <label className="text-xs font-semibold text-[var(--ev-muted)]">Category
          <select name="category" defaultValue={filters.category} className={`${inputCls} mt-1.5`}>
            <option value="">All categories</option>
            {categories.map((x) => <option key={x}>{x}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-[var(--ev-muted)]">Work level
          <select name="role" defaultValue={filters.role} className={`${inputCls} mt-1.5`}>
            <option value="">All levels</option>
            {roles.map((x) => <option key={x} value={x}>{levelLabel(x)}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-[var(--ev-muted)]">Payment status
          <select name="status" defaultValue={filters.status} className={`${inputCls} mt-1.5`}>
            <option value="">All</option>
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
          </select>
        </label>
        <div className="flex items-end gap-2">
          <button className={`${btnPrimary} h-11`}><SlidersHorizontal size={15} aria-hidden="true" /> Apply</button>
          {filtering && <Link href="/portal/earnings" className={`${btnGhost} h-11`}>Clear</Link>}
        </div>
      </form>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <div className={`${card} p-5`}>
          <h2 className="font-bold">Earnings by work level</h2>
          <ul className="mt-3 divide-y divide-[var(--ev-border-soft)]">
            {byRole.filter((r) => r.net > 0).map((r) => (
              <li key={r.role} className="flex justify-between gap-3 py-2.5 text-sm">
                <span>{levelLabel(r.role)}</span><strong className="tabular-nums">{moneyFmt(r.net)}</strong>
              </li>
            ))}
            {byRole.filter((r) => r.net > 0).length === 0 && <li className="py-2.5 text-sm text-[var(--ev-muted)]">Nothing in this view.</li>}
          </ul>
        </div>
        <div className={`${card} p-5`}>
          <h2 className="font-bold">Earnings by category</h2>
          <ul className="mt-3 divide-y divide-[var(--ev-border-soft)]">
            {byCategory.filter((r) => r.net > 0).map((r) => (
              <li key={r.category} className="flex justify-between gap-3 py-2.5 text-sm">
                <span>{r.category}</span><strong className="tabular-nums">{moneyFmt(r.net)}</strong>
              </li>
            ))}
            {byCategory.filter((r) => r.net > 0).length === 0 && <li className="py-2.5 text-sm text-[var(--ev-muted)]">Nothing in this view.</li>}
          </ul>
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-bold"><Receipt size={19} className="text-[var(--ev-accent-text)]" aria-hidden="true" /> Payment history</h2>
          <p className="text-sm text-[var(--ev-muted)]">{selected.length} entries · Gross {moneyFmt(totals.gross)} · Fines {moneyFmt(totals.fines)}</p>
        </div>
        {selected.length === 0 ? (
          <EmptyState icon={Wallet} title="No earnings to show" text="Approved earnings appear here once payroll has processed your completed work." />
        ) : (
          <ul className="space-y-3">
            {selected.map((r) => (
              <li key={`${r.sourceType}:${r.id}`} className={`${card} flex flex-wrap items-center justify-between gap-4 p-4`}>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{r.label}</p>
                  <p className="mt-1 text-xs text-[var(--ev-muted)]">{r.category} · {levelLabel(r.sourceType)} · cycle {r.cycle}</p>
                  {r.status === "PAID" && Math.abs(r.originalNet - r.net) > 0.001 && (
                    <p className="mt-1 text-xs font-semibold text-[var(--ev-accent-text)]">Originally approved {moneyFmt(r.originalNet)} · final adjusted payment {moneyFmt(r.net)}</p>
                  )}
                  {r.adjustmentReason && <p className="mt-1 text-xs text-[var(--ev-muted)]">Adjustment reason: {r.adjustmentReason}</p>}
                </div>
                <div className="flex items-center gap-5">
                  <div className="hidden text-right text-xs text-[var(--ev-muted)] sm:block">
                    Gross {moneyFmt(r.gross)}<br />Fines {moneyFmt(r.fines)}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold tabular-nums">{moneyFmt(r.net)}</p>
                    <p className="text-[11px] text-[var(--ev-muted)]">{r.status === "PAID" ? "Recorded as paid" : "Payable"}</p>
                  </div>
                  <Pill tone={r.status === "PAID" ? "green" : r.status === "PENDING" ? "amber" : "slate"}>{r.status === "PAID" ? "Completed payment" : r.status === "PENDING" ? "Pending payment" : r.status.replaceAll("_", " ")}</Pill>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-xs text-[var(--ev-muted)]">
          Unapproved work and unsettled active Admin time are not included in these totals. Lifetime earnings are completed payments plus approved, still-pending payments; a final adjusted settlement counts only the amount actually recorded as paid.
        </p>
      </section>
    </>
  );
}

export default function Page(props: Props) {
  return (
    <PageShell>
      <Suspense fallback={<div className={`${card} p-8 text-[var(--ev-muted)]`}>Loading earnings…</div>}>
        <Content {...props} />
      </Suspense>
    </PageShell>
  );
}
