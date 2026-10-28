import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { getEarningsReport, cleanFilters, applyEarningsFilters, summarize } from "@/lib/earnings/report";

type Props = { searchParams: Promise<Record<string,string|undefined>> };
const money = (n:number) => n.toFixed(2);
async function Content({ searchParams }: Props) {
  await connection();
  const filters = cleanFilters(await searchParams);
  const { employee, rows } = await getEarningsReport();
  const selected = applyEarningsFilters(rows, filters);
  const totals = summarize(selected);
  const lifetime = summarize(rows);
  const categories = Array.from(new Set(rows.map(r=>r.category))).sort();
  const roles = Array.from(new Set(rows.map(r=>r.sourceType))).sort();
  const byRole = roles.map(role=>({ role, ...summarize(selected.filter(r=>r.sourceType===role)) }));
  const byCategory = categories.map(category=>({category,...summarize(selected.filter(r=>r.category===category))}));
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k,v])=>{ if(v) params.set(k,v); });
  return <main className="min-h-screen bg-[#071327] p-4 text-white sm:p-8">
    <div className="w-full space-y-6">
      <Link href="/portal" className="text-cyan-300 underline">← My Dashboard</Link>
      <header><h1 className="text-3xl font-bold">My Earnings</h1><p className="mt-2 text-slate-300">{employee.fullName} · {employee.role.replaceAll("_"," ")} · USD (confirm compensation currency)</p></header>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Selected period — net",totals.net],
          ["Selected period — pending",totals.pending],
          ["Lifetime recorded net",lifetime.net],
          ["Lifetime paid",lifetime.paid],
        ].map(([label,value])=><div key={String(label)} className="rounded-xl bg-[#101F39] p-5"><p className="text-sm text-slate-300">{label}</p><p className="mt-2 text-2xl font-bold">{money(Number(value))}</p></div>)}
      </section>
      <form method="GET" className="grid gap-3 rounded-xl bg-[#101F39] p-5 sm:grid-cols-2 lg:grid-cols-5">
        <label className="text-sm">Payout month<input name="month" type="month" defaultValue={filters.month} className="mt-1 w-full rounded-lg bg-[#071327] p-3"/></label>
        <label className="text-sm">Category<select name="category" defaultValue={filters.category} className="mt-1 w-full rounded-lg bg-[#071327] p-3"><option value="">All categories</option>{categories.map(x=><option key={x}>{x}</option>)}</select></label>
        <label className="text-sm">Work level<select name="role" defaultValue={filters.role} className="mt-1 w-full rounded-lg bg-[#071327] p-3"><option value="">All levels</option>{roles.map(x=><option key={x} value={x}>{x.replaceAll("_"," ")}</option>)}</select></label>
        <label className="text-sm">Payment status<select name="status" defaultValue={filters.status} className="mt-1 w-full rounded-lg bg-[#071327] p-3"><option value="">All</option><option value="PENDING">Pending</option><option value="PAID">Paid</option></select></label>
        <button className="self-end rounded-lg bg-[#0052CC] px-5 py-3 font-semibold">Apply filters</button>
      </form>
      <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-slate-300">{selected.length} earning entries · Gross {money(totals.gross)} · Fines {money(totals.fines)} · Net {money(totals.net)}</p><Link className="rounded-lg bg-[#0052CC] px-5 py-3 font-semibold" href={`/api/portal/earnings/pdf?${params.toString()}`}>Download branded PDF statement</Link></div>
      <div className="grid gap-3 md:grid-cols-2"><section className="rounded-xl bg-[#101F39] p-5"><h2 className="font-bold">Earnings by work level</h2>{byRole.filter(r=>r.net>0).map(r=><p className="mt-2 flex justify-between gap-2" key={r.role}><span>{r.role.replaceAll("_"," ")}</span><strong>{money(r.net)}</strong></p>)}</section><section className="rounded-xl bg-[#101F39] p-5"><h2 className="font-bold">Earnings by task category</h2>{byCategory.filter(r=>r.net>0).map(r=><p className="mt-2 flex justify-between gap-2" key={r.category}><span>{r.category}</span><strong>{money(r.net)}</strong></p>)}</section></div>
      <section className="space-y-3"><h2 className="text-xl font-semibold">Earnings history</h2>{selected.map(r=><article key={`${r.sourceType}:${r.id}`} className="rounded-xl border border-white/10 bg-[#101F39] p-4"><div className="flex flex-wrap justify-between gap-2"><strong>{r.label}</strong><span>{r.status}</span></div><p className="mt-1 text-sm text-slate-300">{r.category} · {r.sourceType.replaceAll("_"," ")} · Payout cycle {r.cycle}</p><p className="mt-2">Gross {money(r.gross)} · Fines {money(r.fines)} · Net {money(r.net)}</p></article>)}{selected.length===0&&<p className="text-slate-300">No approved earnings match the selected filters.</p>}</section>
      <p className="text-xs text-slate-400">Unapproved work and unsettled active Admin time are not included in the ledger totals. “Pending” means approved but not recorded as paid.</p>
    </div>
  </main>;
}
export default function Page(props: Props){ return <Suspense fallback={<p className="p-6">Loading earnings…</p>}><Content {...props}/></Suspense>; }
