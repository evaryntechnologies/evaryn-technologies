import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";
import { approvePayrollEntry, markPayrollPaid } from "./actions";

type Candidate = { id: string; publicTaskId: string|null; title: string; fullName: string; email: string; clientActionAt: Date; totalOrderCost: unknown; fines: unknown; };
type Entry = { id: string; title: string; fullName: string; email: string; grossAmount: unknown; payableAmount: unknown; fineAmount: unknown; payoutDate: Date; status: string; paymentReference: string|null; paidAt: Date|null; };
const money = (n: unknown) => Number(n ?? 0).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
async function PayrollContent() {
  await connection();
  const user = await requireEmployee(["SUPER_ADMIN"]);
  if (user.role !== "SUPER_ADMIN") throw new Error("Super Admin only");
  const candidates = await prisma.$queryRaw<Candidate[]>`
    SELECT t.id,t."publicTaskId",t.title,e."fullName",e.email,t."clientActionAt",t."totalOrderCost",
    COALESCE((SELECT SUM(p.amount) FROM public."TaskPenalty" p WHERE p."taskId"=t.id AND p.status='ACTIVE'),0) AS fines
    FROM public."WorkTask" t JOIN public."EmployeeProfile" e ON e.id=t."assignedToId"
    WHERE t.status='COMPLETED' AND t."clientActionAt" IS NOT NULL AND t."totalOrderCost" > 0
    AND NOT EXISTS (SELECT 1 FROM public."PayrollEntry" l WHERE l."taskId"=t.id AND l."employeeId"=t."assignedToId")
    ORDER BY t."clientActionAt" DESC LIMIT 100`;
  const entries = await prisma.$queryRaw<Entry[]>`
    SELECT p.id,t.title,e."fullName",e.email,p."grossAmount",p."payableAmount",p."fineAmount",p."payoutDate",p.status,p."paymentReference",p."paidAt"
    FROM public."PayrollEntry" p JOIN public."WorkTask" t ON t.id=p."taskId" JOIN public."EmployeeProfile" e ON e.id=p."employeeId"
    ORDER BY p."payoutDate" DESC,p."createdAt" DESC LIMIT 200`;
  const pending = entries.filter(e=>e.status==='PENDING');
  const total = pending.reduce((sum,e)=>sum+Number(e.payableAmount),0);
  return <main className="min-h-screen bg-[#071327] p-5 text-white sm:p-9">
    <div className="w-full space-y-8">
      <div><Link className="text-sm text-cyan-300 hover:underline" href="/portal">← My Dashboard</Link><h1 className="mt-4 text-3xl font-bold">Super Admin Payroll</h1><p className="mt-2 text-slate-300">Review completed and client-paid orders, approve employee pay, and record external payments. No transfers are sent automatically.</p></div>
      <div className="grid gap-4 sm:grid-cols-3">{[["Unapproved eligible orders",String(candidates.length)],["Pending payroll entries",String(pending.length)],["Pending total",money(total)]].map(([label,value])=><div key={label} className="rounded-xl border border-white/10 bg-[#101F39] p-5"><p className="text-sm text-slate-300">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></div>)}</div>
      <section><h2 className="text-xl font-semibold">Eligible orders awaiting approval</h2><p className="mt-2 text-sm text-slate-300">Order value is not necessarily employee wages. Review and enter the employee amount before approving. Active fines reduce the maximum available amount.</p><div className="mt-4 grid gap-4 lg:grid-cols-2">
        {candidates.map(t=>{const max=Math.max(0,Number(t.totalOrderCost)-Number(t.fines));return <article className="rounded-xl border border-white/10 bg-[#101F39] p-5" key={t.id}><h3 className="font-semibold">{t.publicTaskId??t.id} — {t.title}</h3><p className="mt-2 text-sm text-slate-300">{t.fullName} · {t.email}</p><p className="mt-2 text-sm">Order value: {money(t.totalOrderCost)} · Active fines: {money(t.fines)} · Available cap: {money(max)}</p><form action={approvePayrollEntry} className="mt-4 flex flex-wrap gap-2"><input type="hidden" name="taskId" value={t.id}/><input type="number" name="gross" min="0" max={max.toFixed(2)} step="0.01" required placeholder="Approved employee amount" aria-label="Approved employee amount" className="min-w-0 flex-1 rounded-lg bg-[#071327] p-3"/><button className="rounded-lg bg-[#0052CC] px-4 py-3 font-semibold">Approve payroll</button></form></article>})}
        {candidates.length===0&&<p className="text-slate-300">No eligible orders awaiting approval.</p>}</div></section>
      <section><h2 className="text-xl font-semibold">Payroll register</h2><div className="mt-4 grid gap-4 lg:grid-cols-2">{entries.map(e=><article key={e.id} className="rounded-xl border border-white/10 bg-[#101F39] p-5"><div className="flex flex-wrap justify-between gap-2"><h3 className="font-semibold">{e.fullName}</h3><span className="text-sm text-cyan-300">{e.status}</span></div><p className="mt-1 text-sm text-slate-300">{e.title}</p><p className="mt-3">Payable: {money(e.payableAmount)} · Active fines at approval: {money(e.fineAmount)}</p><p className="mt-2 text-sm text-slate-300">Payout cycle: {new Date(e.payoutDate).toISOString().slice(0,10)}</p>{e.status==='PENDING'?<form action={markPayrollPaid} className="mt-4 space-y-2"><input type="hidden" name="entryId" value={e.id}/><input name="paymentReference" required minLength={3} maxLength={150} placeholder="External payment reference" className="w-full rounded-lg bg-[#071327] p-3"/><textarea name="paymentNote" maxLength={1000} placeholder="Optional payment note" className="w-full rounded-lg bg-[#071327] p-3"/><button className="rounded-lg bg-[#0052CC] px-4 py-3 font-semibold">Record as paid</button></form>:<p className="mt-3 text-sm text-emerald-200">Paid · Reference {e.paymentReference} · {e.paidAt?.toLocaleDateString("en-KE")}</p>}</article>)}{entries.length===0&&<p className="text-slate-300">No payroll entries recorded yet.</p>}</div></section>
    </div></main>;
}
export default function Page(){return <Suspense fallback={<main className="min-h-screen bg-[#071327] p-8 text-slate-300">Loading payroll…</main>}><PayrollContent/></Suspense>}
