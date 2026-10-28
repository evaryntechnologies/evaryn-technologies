import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";

type Earn = { id:string; sourceType:string; label:string; grossAmount:unknown; fineAmount:unknown; payableAmount:unknown; payoutDate:Date; status:string; paidAt:Date|null; };
type OldEarn = { id:string; label:string; grossAmount:unknown; fineAmount:unknown; payableAmount:unknown; payoutDate:Date; status:string; paidAt:Date|null; };
async function Content() {
  await connection();
  const user = await requireEmployee();
  const employee = await prisma.employeeProfile.findUnique({ where:{authUserId:user.id}, select:{id:true,fullName:true} });
  if (!employee) throw new Error("Employee profile unavailable.");
  const modern = await prisma.$queryRaw<Earn[]>`
    SELECT l.id,l."sourceType",COALESCE(t.title,'Admin time session') AS label,
      l."grossAmount",l."fineAmount",l."payableAmount",l."payoutDate",l.status,l."paidAt"
    FROM public."WorkforcePayLedger" l LEFT JOIN public."WorkTask" t ON t.id=l."taskId"
    WHERE l."employeeId"=${employee.id}::uuid ORDER BY l."payoutDate" DESC LIMIT 250`;
  const legacy = await prisma.$queryRaw<OldEarn[]>`
    SELECT l.id,t.title AS label,l."grossAmount",l."fineAmount",l."payableAmount",l."payoutDate",l.status,l."paidAt"
    FROM public."PayrollEntry" l JOIN public."WorkTask" t ON t.id=l."taskId"
    WHERE l."employeeId"=${employee.id}::uuid ORDER BY l."payoutDate" DESC LIMIT 250`;
  const rows = [...modern,...legacy.map(x=>({...x,sourceType:"LEGACY"}))].sort((a,b)=>new Date(b.payoutDate).getTime()-new Date(a.payoutDate).getTime());
  const pending=rows.filter(x=>x.status==="PENDING").reduce((v,x)=>v+Number(x.payableAmount),0);
  const paid=rows.filter(x=>x.status==="PAID").reduce((v,x)=>v+Number(x.payableAmount),0);
  return <main className="min-h-screen bg-[#071327] p-5 text-white sm:p-9"><div className="w-full space-y-7"><header><Link href="/portal" className="text-cyan-300 underline">← My Dashboard</Link><h1 className="mt-5 text-3xl font-bold">My Earnings</h1><p className="mt-2 text-slate-300">{employee.fullName} · Approved earnings and recorded payments. Work awaiting approval is not shown as payable.</p></header><div className="grid gap-3 sm:grid-cols-2"><section className="rounded-xl bg-[#101F39] p-5"><p>Pending</p><strong className="mt-2 block text-3xl">{pending.toFixed(2)}</strong></section><section className="rounded-xl bg-[#101F39] p-5"><p>Total paid</p><strong className="mt-2 block text-3xl">{paid.toFixed(2)}</strong></section></div><div className="space-y-3">{rows.map(e=><article key={e.sourceType+e.id} className="rounded-xl border border-white/10 bg-[#101F39] p-5"><div className="flex flex-wrap justify-between gap-2"><strong>{e.label}</strong><span className="text-cyan-200">{e.status}</span></div><p className="mt-2 text-sm text-slate-300">{e.sourceType} · Cycle: {new Date(e.payoutDate).toISOString().slice(0,10)}</p><p className="mt-2">Gross {Number(e.grossAmount).toFixed(2)} · Deductions {Number(e.fineAmount).toFixed(2)} · Net {Number(e.payableAmount).toFixed(2)}</p></article>)}{!rows.length&&<p className="text-slate-300">No approved earnings yet.</p>}</div></div></main>;
}
export default function Page(){return <Suspense fallback={<p className="p-6">Loading earnings...</p>}><Content/></Suspense>}
