import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireEmployee } from "@/lib/auth/require-employee";
import { changeHold } from "./actions";
import { declineWorkforcePay } from "../payroll/actions";

type Held = {
  id: string; employeeId: string; employeeName: string; taskId: string | null;
  title: string; publicTaskId: string | null; sourceType: string;
  grossAmount: unknown; fineAmount: unknown; payableAmount: unknown;
  payoutDate: Date | string; taskStatus: string | null; createdAt: Date;
};
type AdminCandidate = { eventKey:string; employeeName:string; grossAmount:unknown; fineAmount:unknown; payoutDate:Date };
type Audit = { id:string; employeeName:string; title:string; oldPayable:unknown; newPayable:unknown; adjustmentKind:string; reason:string; createdAt:Date };
const cash = (n:unknown) => Number(n ?? 0).toLocaleString("en-US",{style:"currency",currency:"USD"});
const day = (d:Date|string) => new Date(d).toLocaleDateString("en-GB",{timeZone:"Africa/Nairobi"});
const input="mt-1 w-full rounded-xl border border-[#31587E] bg-[#102C4C] px-3 py-2.5 text-sm text-white placeholder:text-[#A9BBD2] focus:border-[#3DCEF1] focus:outline-none focus:ring-2 focus:ring-[#3DCEF1]/25";

async function Content(){
  await connection();
  const auth = await requireEmployee(["SUPER_ADMIN"]);
  const actor = await prisma.employeeProfile.findUnique({where:{authUserId:auth.id},select:{role:true,status:true}});
  if (actor?.role !== "SUPER_ADMIN" || actor.status !== "ACTIVE") throw new Error("Super Admin access required.");
  const [entries, candidates, history] = await Promise.all([
    prisma.$queryRaw<Held[]>`
      SELECT l.id,l."employeeId",e."fullName" AS "employeeName",l."taskId",
        COALESCE(t.title,'Admin time') AS title,t."publicTaskId",l."sourceType",
        l."grossAmount",l."fineAmount",l."payableAmount",l."payoutDate",t.status AS "taskStatus",l."createdAt"
      FROM public."WorkforcePayLedger" l
      JOIN public."EmployeeProfile" e ON e.id=l."employeeId"
      LEFT JOIN public."WorkTask" t ON t.id=l."taskId"
      WHERE l.status='PENDING'
        AND NOT EXISTS (SELECT 1 FROM public."PayTeamAllocation" a WHERE a."ledgerId"=l.id)
        AND NOT EXISTS (SELECT 1 FROM public."WorkforcePayDecision" d WHERE d."ledgerId"=l.id)
        AND NOT EXISTS (SELECT 1 FROM public."WorkforcePayLedger" paid WHERE paid.id<>l.id AND paid.status='PAID'
          AND paid."taskId"=l."taskId" AND l."taskId" IS NOT NULL AND paid."employeeId"=l."employeeId" AND paid."sourceType"=l."sourceType")
      ORDER BY l."payoutDate" ASC,l."createdAt" DESC LIMIT 350`,
    prisma.$queryRaw<AdminCandidate[]>`
      SELECT c."eventKey",e."fullName" AS "employeeName",c."grossAmount",c."fineAmount",c."payoutDate"
      FROM public."WorkforcePayCandidates" c JOIN public."EmployeeProfile" e ON e.id=c."employeeId"
      WHERE c."sourceType"='ADMIN_TIME'
        AND NOT EXISTS (SELECT 1 FROM public."WorkforcePayDecision" d WHERE d."eventKey"=c."eventKey")
      ORDER BY c."eligibleAt" DESC LIMIT 100`,
    prisma.$queryRaw<Audit[]>`
      SELECT a.id,e."fullName" AS "employeeName",COALESCE(t.title,'Admin time') AS title,
        a."oldPayable",a."newPayable",a."adjustmentKind",a.reason,a."createdAt"
      FROM public."WorkforceHoldAdjustment" a
      JOIN public."EmployeeProfile" e ON e.id=a."employeeId"
      LEFT JOIN public."WorkTask" t ON t.id=a."taskId"
      ORDER BY a."createdAt" DESC LIMIT 100`,
  ]);
  const total = entries.reduce((sum,e)=>sum+Number(e.payableAmount),0);
  return <main className="min-h-screen bg-[#081E38] px-4 py-8 font-sans text-[#F1F8FF] sm:px-8">
    <div className="mx-auto max-w-7xl space-y-8">
      <header className="space-y-3">
        <Link href="/portal/super-admin/payroll" className="text-sm font-semibold text-[#67D7F1] hover:underline">← Back to payroll</Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="text-xs font-semibold uppercase tracking-[.17em] text-[#7BE1F2]">Super Admin · Payroll control</p><h1 className="mt-2 text-3xl font-bold tracking-tight">On Hold</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-[#C0D5EB]">Adjust approved but unpaid order earnings and Admin hours. Every adjustment is recorded, explained, and reflected in employee earnings and Pay Team balances.</p></div>
          <Link className="rounded-xl border border-[#7956AF] px-4 py-2 text-sm font-semibold text-[#DBCCFA] hover:bg-[#7956AF]/15" href="/portal/super-admin/payroll/pay-team">Open Pay Team</Link>
        </div>
      </header>
      <section className="grid gap-4 sm:grid-cols-3" aria-label="On Hold totals">
        <div className="rounded-2xl border border-[#335578] bg-[#122F50] p-5"><p className="text-sm text-[#BACDE1]">Approved, unpaid balance</p><p className="mt-2 text-3xl font-semibold tabular-nums text-[#7BE1F2]">{cash(total)}</p></div>
        <div className="rounded-2xl border border-[#335578] bg-[#122F50] p-5"><p className="text-sm text-[#BACDE1]">Unpaid earning entries</p><p className="mt-2 text-3xl font-semibold">{entries.length}</p></div>
        <div className="rounded-2xl border border-[#335578] bg-[#122F50] p-5"><p className="text-sm text-[#BACDE1]">Admin sessions awaiting approval</p><p className="mt-2 text-3xl font-semibold text-[#D5B7FF]">{candidates.length}</p></div>
      </section>
      <section className="space-y-4">
        <div><h2 className="text-xl font-bold">Adjust unpaid earnings</h2><p className="mt-1 text-sm text-[#B9CEE5]">Order lines are shown separately for the tasker, reviewer, and QA. Use a percentage bonus or fine on the relevant line to preserve role-specific allocations. Paid entries are excluded and cannot be edited.</p></div>
        {entries.length===0?<div className="rounded-2xl border border-[#335578] bg-[#122F50] p-7 text-[#BFD3EA]">No approved unpaid entries. Completed client work must enter payroll approval before it appears here; delivered work awaiting client completion is not yet a payable ledger item.</div>:
        <div className="grid gap-4 xl:grid-cols-2">{entries.map(l=><article key={l.id} className="rounded-2xl border border-[#335578] bg-[#122F50] p-5 shadow-lg shadow-black/10">
          <div className="flex flex-wrap items-center justify-between gap-2"><span className="rounded-full bg-[#7956AF]/20 px-3 py-1 text-xs font-semibold text-[#DAC7F5]">{l.sourceType.replace("_"," ")}</span><span className="text-xs text-[#ADD6ED]">Payout: {day(l.payoutDate)}</span></div>
          <h3 className="mt-3 font-semibold">{l.title}</h3><p className="mt-1 text-xs text-[#AAC3DB]">{l.publicTaskId??"Admin time"} · {l.employeeName}{l.taskStatus?` · ${l.taskStatus}`:""}</p>
          <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-[#0A2442] p-3 text-sm"><div><p className="text-xs text-[#AFC8DF]">Gross</p><strong>{cash(l.grossAmount)}</strong></div><div><p className="text-xs text-[#AFC8DF]">Fines</p><strong>{cash(l.fineAmount)}</strong></div><div><p className="text-xs text-[#AFC8DF]">On hold</p><strong className="text-[#6AE0EF]">{cash(l.payableAmount)}</strong></div></div>
          <form action={changeHold} className="mt-4 space-y-3"><input type="hidden" name="ledgerId" value={l.id}/>
            <div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold text-[#D4E5F4]">Adjustment type<select name="kind" className={input} defaultValue="AMOUNT"><option value="AMOUNT">Set final unpaid amount ($)</option>{l.sourceType!=="ADMIN_TIME"&&<><option value="BONUS_PERCENT">Increase by bonus (%)</option><option value="FINE_PERCENT">Increase fine (%)</option></>}{l.sourceType==="ADMIN_TIME"&&<option value="DISMISS_ADMIN_TIME">Dismiss unworked hours</option>}</select></label><label className="text-xs font-semibold text-[#D4E5F4]">New amount / adjustment percentage<input className={input} name="value" type="number" min="0" step="0.01" placeholder="e.g. 15.00" /></label></div>
            <label className="block text-xs font-semibold text-[#D4E5F4]">Required adjustment reason (free text)<textarea required minLength={10} maxLength={2000} rows={2} name="reason" className={input} placeholder="Explain why this entitlement is increasing, decreasing, or being dismissed" /></label>
            <button className="w-full rounded-xl bg-[#7956AF] px-4 py-3 text-sm font-semibold text-white hover:bg-[#9068C8]">Save audited adjustment</button>
          </form>
        </article>)}</div>}
      </section>
      <section className="space-y-4"><h2 className="text-xl font-bold">Dismiss incorrect Admin hours before approval</h2><p className="text-sm text-[#B9CEE5]">Declining a candidate permanently excludes that Admin time session from payroll approval. A written reason is mandatory.</p>
        {candidates.length===0?<p className="text-sm text-[#B6CBE2]">No unapproved Admin time candidates.</p>:<div className="grid gap-3 md:grid-cols-2">{candidates.map(c=><article key={c.eventKey} className="rounded-2xl border border-[#335578] bg-[#122F50] p-4"><p className="font-semibold">{c.employeeName}</p><p className="mt-1 text-sm text-[#B9CEE5]">{cash(Number(c.grossAmount)-Number(c.fineAmount))} · {day(c.payoutDate)}</p><form action={declineWorkforcePay} className="mt-3 space-y-2"><input type="hidden" name="eventKey" value={c.eventKey}/><textarea required minLength={10} maxLength={1000} name="reason" rows={2} className={input} placeholder="Reason for dismissing hours (required)"/><button className="rounded-xl border border-[#A785DB] px-4 py-2 text-sm font-semibold text-[#DECAFA] hover:bg-[#7956AF]/20">Dismiss Admin hours</button></form></article>)}</div>}
      </section>
      <section className="space-y-3"><h2 className="text-xl font-bold">Permanent adjustment history</h2>{history.length===0?<p className="text-sm text-[#B9CEE5]">No adjustments recorded yet.</p>:<div className="overflow-x-auto rounded-2xl border border-[#335578]"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-[#17395E] text-[#CDE7F7]"><tr><th className="p-3">Employee and order</th><th className="p-3">Change</th><th className="p-3">Reason</th><th className="p-3">Date</th></tr></thead><tbody>{history.map(a=><tr key={a.id} className="border-t border-[#335578] bg-[#102C4C]"><td className="p-3"><strong>{a.employeeName}</strong><p className="text-xs text-[#B9CEE5]">{a.title}</p></td><td className="p-3 tabular-nums">{cash(a.oldPayable)} → {cash(a.newPayable)}<p className="text-xs text-[#BEA7E8]">{a.adjustmentKind}</p></td><td className="max-w-xs p-3 text-[#CDE1F1]">{a.reason}</td><td className="p-3 whitespace-nowrap">{day(a.createdAt)}</td></tr>)}</tbody></table></div>}</section>
    </div>
  </main>;
}
export default function Page(){return <Suspense fallback={<p className="p-6">Loading On Hold…</p>}><Content/></Suspense>}
