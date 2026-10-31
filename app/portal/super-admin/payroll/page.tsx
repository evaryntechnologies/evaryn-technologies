import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";
import { approveWorkforcePay, markWorkforcePaid, declineWorkforcePay } from "./actions";

type Candidate = { eventKey: string; sourceType: string; taskId: string | null; employeeId: string; fullName: string; grossAmount: unknown; fineAmount: unknown; payoutDate: Date; label: string; };
type Ledger = { employeeId: string; id: string; sourceType: string; fullName: string; label: string; grossAmount: unknown; fineAmount: unknown; payableAmount: unknown; payoutDate: Date; status: string; paymentReference: string | null; paidAt: Date | null; hasMethod: boolean; };
const amount = (n: unknown) => Number(n ?? 0).toFixed(2);
const date = (d: Date) => new Date(d).toISOString().slice(0,10);
async function Content() {
  await connection();
  const user = await requireEmployee(["SUPER_ADMIN"]);
  if (user.role !== "SUPER_ADMIN") throw new Error("Access denied");
  const candidates = await prisma.$queryRaw<Candidate[]>`
    SELECT c."eventKey",c."sourceType",c."taskId",c."employeeId",e."fullName",c."grossAmount",c."fineAmount",c."payoutDate",
      COALESCE(t.title, 'Admin time session') AS label
    FROM public."WorkforcePayCandidates" c
    JOIN public."EmployeeProfile" e ON e.id=c."employeeId"
    LEFT JOIN public."WorkTask" t ON t.id=c."taskId"
    WHERE (c."grossAmount" - c."fineAmount") > 0
      AND NOT EXISTS(SELECT 1 FROM public."WorkforcePayDecision" d WHERE d."eventKey"=c."eventKey")
      AND NOT EXISTS(SELECT 1 FROM public."WorkforcePayLedger" l
        WHERE c."taskId" IS NOT NULL AND l."taskId"=c."taskId" AND l."employeeId"=c."employeeId"
        AND l."sourceType"=c."sourceType" AND l.status='PAID')
    ORDER BY c."payoutDate" ASC,c."eventKey" LIMIT 250`;
  const entries = await prisma.$queryRaw<Ledger[]>`
    SELECT l.id,l."employeeId",l."sourceType",e."fullName",COALESCE(t.title,'Admin time session') AS label,
      l."grossAmount",l."fineAmount",l."payableAmount",l."payoutDate",l.status,l."paymentReference",l."paidAt",
      EXISTS(SELECT 1 FROM public."EmployeePaymentMethod" m WHERE m."employeeId"=l."employeeId" AND length(btrim(m.details))>0) AS "hasMethod"
    FROM public."WorkforcePayLedger" l JOIN public."EmployeeProfile" e ON e.id=l."employeeId"
    LEFT JOIN public."WorkTask" t ON t.id=l."taskId"
    WHERE NOT EXISTS(SELECT 1 FROM public."WorkforcePayDecision" d WHERE d."ledgerId"=l.id)
    ORDER BY l."payoutDate" DESC,l."createdAt" DESC LIMIT 500`;
  const pending = entries.filter(x => x.status === "PENDING");
  const pendingTotal = pending.reduce((v,x) => v+Number(x.payableAmount),0);
  const people = new Map<string,{name:string;total:number;count:number}>();
  for(const e of pending){const item=people.get(e.employeeId)??{name:e.fullName,total:0,count:0};item.total+=Number(e.payableAmount);item.count++;people.set(e.employeeId,item);}
  return <main className="min-h-screen bg-[#071327] p-5 text-white sm:p-9">
    <div className="w-full space-y-8">
      <header><Link href="/portal" className="text-cyan-300 underline">← My Dashboard</Link><h1 className="mt-5 text-3xl font-bold">Super Admin Payroll</h1><p className="mt-2 text-slate-300">Client-paid completed work and closed Admin time sessions. These entries record external payments only; money is never sent automatically.</p></header>
      <section className="grid gap-3 sm:grid-cols-3">{[["Unapproved earnings",String(candidates.length)],["Pending entries",String(pending.length)],["Net pending",amount(pendingTotal)]].map(([name,v])=><article key={name} className="rounded-xl border border-white/10 bg-[#101F39] p-5"><p className="text-sm text-slate-300">{name}</p><strong className="mt-2 block text-2xl">{v}</strong></article>)}</section>
      <section className="space-y-3"><h2 className="text-xl font-bold">Pay Team — employee overview</h2><p className="text-sm text-slate-300">Approved pending balances only. These totals exclude declined entries and are not proof that a transfer occurred. Use the ledger below to record each external transfer.</p><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{Array.from(people.entries()).map(([id,e])=><article key={id} className="rounded-xl border border-cyan-400/20 bg-[#101F39] p-5"><p className="font-semibold">{e.name}</p><p className="mt-2 text-2xl font-bold text-cyan-200">${amount(e.total)}</p><p className="mt-2 text-xs text-slate-400">{e.count} pending item(s)</p></article>)}{people.size===0&&<p className="text-slate-300">No payable employee balances.</p>}</div><Link href="/portal/super-admin/payment-adjustments" className="inline-block text-sm text-cyan-300 underline">Review client payment adjustments</Link></section>
      <section><h2 className="text-xl font-bold">Earnings awaiting approval</h2><p className="mt-2 text-sm text-slate-300">Tasker: order value minus active fines; Reviewer: 1.50 per review; QA: 1.00 per QA review; Admin: 2.00 per clocked hour. QA/Reviewer credits remain withheld until the client has paid and the order is completed.</p><div className="mt-4 grid gap-3 lg:grid-cols-2">{candidates.map(c=><article key={c.eventKey} className="rounded-xl border border-white/10 bg-[#101F39] p-5"><p className="font-semibold">{c.fullName} · {c.sourceType}</p><p className="mt-1 text-sm text-slate-300">{c.label}</p><p className="mt-2 text-sm">Gross {amount(c.grossAmount)} · Fines {amount(c.fineAmount)} · Net {amount(Math.max(0,Number(c.grossAmount)-Number(c.fineAmount)))}</p><p className="mt-1 text-xs text-slate-400">Cycle: {date(c.payoutDate)}</p><form action={approveWorkforcePay} className="mt-3"><input type="hidden" name="eventKey" value={c.eventKey}/><button className="rounded-lg bg-[#0052CC] px-4 py-2 font-semibold">Approve earnings</button></form><form action={declineWorkforcePay} className="mt-3 space-y-2"><input type="hidden" name="eventKey" value={c.eventKey}/><input name="reason" minLength={10} maxLength={1000} required placeholder="Reason for decline (required)" className="w-full rounded-lg bg-[#071327] p-3 text-sm"/><button className="rounded-lg border border-rose-400/50 px-4 py-2 text-sm text-rose-200">Decline earnings</button></form></article>)}{!candidates.length&&<p className="text-slate-300">No unapproved earnings.</p>}</div></section>
      <section><h2 className="text-xl font-bold">Payroll ledger</h2><div className="mt-4 grid gap-3 lg:grid-cols-2">{entries.map(e=><article key={e.id} className="rounded-xl border border-white/10 bg-[#101F39] p-5"><div className="flex justify-between gap-2"><strong>{e.fullName}</strong><span className="text-cyan-300">{e.status}</span></div><p className="mt-2 text-sm text-slate-300">{e.sourceType} · {e.label}</p><p className="mt-2">Gross {amount(e.grossAmount)} · Fines {amount(e.fineAmount)} · Payable {amount(e.payableAmount)}</p><p className="mt-1 text-sm text-slate-300">Cycle {date(e.payoutDate)}</p>{e.status==="PAID"?<p className="mt-3 text-sm text-emerald-200">Paid · {e.paymentReference} · {e.paidAt&&date(e.paidAt)}</p>:<form action={markWorkforcePaid} className="mt-3 space-y-2"><input type="hidden" name="id" value={e.id}/>{!e.hasMethod&&<p className="text-amber-200 text-sm">Employee payment details are missing.</p>}<input name="reference" required minLength={3} maxLength={150} placeholder="External payment reference" className="w-full rounded-lg bg-[#071327] p-3"/><textarea name="note" maxLength={1000} placeholder="Optional reconciliation note" className="w-full rounded-lg bg-[#071327] p-3"/><button disabled={!e.hasMethod} className="rounded-lg bg-[#0052CC] px-4 py-2 font-semibold disabled:opacity-40">Record external payment</button></form>}{e.status==="PENDING"&&<form action={declineWorkforcePay} className="mt-3 space-y-2"><input type="hidden" name="ledgerId" value={e.id}/><input name="reason" required minLength={10} maxLength={1000} placeholder="Reason for declining payment" className="w-full rounded-lg bg-[#071327] p-3 text-sm"/><button className="rounded-lg border border-rose-400/50 px-4 py-2 text-sm text-rose-200">Decline pending payment</button></form>}</article>)}{!entries.length&&<p className="text-slate-300">No approved entries yet.</p>}</div></section>
    </div>
  </main>;
}
export default function Page(){return <Suspense fallback={<p className="p-6">Loading payroll...</p>}><Content/></Suspense>}
