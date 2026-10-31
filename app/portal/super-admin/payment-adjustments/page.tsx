import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireEmployee } from "@/lib/auth/require-employee";
import { adjustClientSettlement, resolveClientAdjustmentLine } from "./actions";

type Task = {id:string; publicTaskId:string|null; title:string;status:string;clientPaidPercent:unknown;clientRating:number|null};
type Line = {id:string;taskId:string;title:string;fullName:string;sourceType:string;oldPercent:unknown;newPercent:unknown;deltaAmount:unknown;status:string;createdAt:Date;reason:string;reference:string|null};
const cash=(n:unknown)=>Number(n??0).toFixed(2);
async function Content(){
  await connection();
  const auth=await requireEmployee(["SUPER_ADMIN"]);
  const actor=await prisma.employeeProfile.findUnique({where:{authUserId:auth.id},select:{role:true,status:true}});
  if(actor?.role!=="SUPER_ADMIN"||actor.status!=="ACTIVE") throw new Error("Access denied.");
  const tasks=await prisma.$queryRaw<Task[]>`
    SELECT id,"publicTaskId",title,status,"clientPaidPercent","clientRating" FROM public."WorkTask"
    WHERE status IN ('COMPLETED','CANCELED') AND "clientActionAt" IS NOT NULL
    ORDER BY "clientActionAt" DESC LIMIT 100`;
  const lines=await prisma.$queryRaw<Line[]>`
    SELECT l.id,a."taskId",t.title,e."fullName",l."sourceType",a."oldPercent",a."newPercent",l."deltaAmount",l.status,l."createdAt",a.reason,l.reference
    FROM public."ClientPaymentAdjustmentLine" l
    JOIN public."ClientPaymentAdjustment" a ON a.id=l."adjustmentId"
    JOIN public."WorkTask" t ON t.id=a."taskId"
    JOIN public."EmployeeProfile" e ON e.id=l."employeeId"
    ORDER BY l."createdAt" DESC LIMIT 300`;
  return <main className="min-h-screen bg-[#071327] p-5 text-white sm:p-8">
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="space-y-3"><Link href="/portal/super-admin/payroll" className="text-sm text-cyan-300">← Payroll</Link><h1 className="text-3xl font-semibold">Client payment adjustments</h1><p className="max-w-3xl text-sm text-slate-300">Record updated client payment percentages and ratings, with a permanent audit trail. Positive differences require a separate external payment; negative differences require a documented recovery or waiver. Previously paid ledger records are never rewritten.</p></header>
      <section className="space-y-4"><h2 className="text-xl font-semibold">Update an order outcome</h2><div className="grid gap-4 lg:grid-cols-2">{tasks.map(t=>{
        const old= t.clientPaidPercent===null?(t.status==="COMPLETED"?100:0):Number(t.clientPaidPercent);
        return <article key={t.id} className="rounded-2xl border border-white/10 bg-[#101F39] p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-cyan-300">{t.publicTaskId??t.id} · {t.status}</p><h3 className="mt-2 font-semibold">{t.title}</h3><p className="mt-2 text-sm text-slate-300">Current payment: {old.toFixed(2)}% · Rating: {t.clientRating??"Not rated"}</p>
          <form action={adjustClientSettlement} className="mt-4 space-y-3"><input type="hidden" name="taskId" value={t.id}/><div className="grid grid-cols-2 gap-3"><label className="text-sm">New paid %<input required type="number" name="percent" min="0" max="100" step="0.01" defaultValue={old} className="mt-1 w-full rounded-lg border border-white/10 bg-[#071327] p-3"/></label><label className="text-sm">New rating<select required name="rating" defaultValue={String(t.clientRating??5)} className="mt-1 w-full rounded-lg border border-white/10 bg-[#071327] p-3">{[1,2,3,4,5].map(r=><option key={r} value={r}>{r} stars</option>)}</select></label></div><label className="block text-sm">Client decision and explanation<textarea required name="reason" minLength={10} maxLength={2000} rows={2} placeholder="Explain the client refund, additional payment, or revised rating" className="mt-1 w-full rounded-lg border border-white/10 bg-[#071327] p-3"/></label><button className="rounded-lg bg-[#0052CC] px-4 py-2 font-medium hover:bg-[#1268e3]">Record adjustment</button></form>
        </article>;
      })}{tasks.length===0&&<p className="text-slate-300">No completed or canceled orders available.</p>}</div></section>
      <section className="space-y-4"><h2 className="text-xl font-semibold">Adjustment reconciliation</h2><p className="text-sm text-slate-300">For positive entries, settle only after sending the additional amount externally. For negative entries, settle only after confirming recovery or an authorized offset. Waive when the balance will not be recovered. No automatic transfers occur.</p><div className="grid gap-3 lg:grid-cols-2">{lines.map(l=><article key={l.id} className="rounded-xl border border-white/10 bg-[#101F39] p-5"><div className="flex items-center justify-between gap-2"><strong>{l.fullName}</strong><span className="text-xs text-cyan-300">{l.status}</span></div><p className="mt-1 text-sm text-slate-300">{l.title} · {l.sourceType}</p><p className="mt-2 font-semibold">{Number(l.deltaAmount)>0?"Additional payable":"Recovery / credit"}: ${cash(Math.abs(Number(l.deltaAmount)))}</p><p className="mt-1 text-xs text-slate-400">Client payment: {cash(l.oldPercent)}% → {cash(l.newPercent)}%</p><p className="mt-2 text-sm text-slate-300">{l.reason}</p>{l.status==="OPEN"?<form action={resolveClientAdjustmentLine} className="mt-4 space-y-2"><input name="id" type="hidden" value={l.id}/><input name="reference" placeholder="External transaction or recovery reference" className="w-full rounded-lg border border-white/10 bg-[#071327] p-3 text-sm"/><input name="note" maxLength={1000} placeholder="Optional reconciliation note" className="w-full rounded-lg border border-white/10 bg-[#071327] p-3 text-sm"/><div className="flex gap-2"><button name="outcome" value="SETTLED" className="rounded-lg bg-[#0052CC] px-4 py-2 text-sm">Mark reconciled</button><button name="outcome" value="WAIVED" className="rounded-lg border border-white/20 px-4 py-2 text-sm">Waive</button></div></form>:<p className="mt-2 text-xs text-slate-400">Reference: {l.reference??"Waived / no reference"}</p>}</article>)}{lines.length===0&&<p className="text-slate-300">No adjustments yet.</p>}</div></section>
    </div>
  </main>;
}
export default function Page(){return <Suspense fallback={<p className="p-6">Loading adjustments…</p>}><Content/></Suspense>}
