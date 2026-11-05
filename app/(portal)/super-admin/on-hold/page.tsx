import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireEmployee } from "@/lib/auth/require-employee";
import { changeHold, addFinalPayoutAdjustment, distributeOrderAdjustment } from "./actions";
import { declineWorkforcePay } from "../payroll/actions";

type Held = {
  id: string; employeeId: string; employeeName: string; taskId: string | null;
  title: string; publicTaskId: string | null; sourceType: string;
  grossAmount: unknown; fineAmount: unknown; payableAmount: unknown;
  payoutDate: Date | string; taskStatus: string | null; createdAt: Date;
};
type PayoutPeriod = {employeeId:string;employeeName:string;payoutDate:Date|string;original:unknown;adjustments:unknown;locked:boolean};
type PayoutAudit = {id:string;employeeName:string;label:string;reason:string;amount:unknown;payoutDate:Date|string;createdAt:Date;settlementId:string|null};
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
  const [entries, candidates, history, periods, payoutAudit] = await Promise.all([
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
    prisma.$queryRaw<PayoutPeriod[]>`
      SELECT l."employeeId",e."fullName" AS "employeeName",l."payoutDate",
        sum(l."payableAmount") AS original,
        coalesce((SELECT sum(a.amount) FROM public."WorkforcePayoutAdjustment" a
          WHERE a."employeeId"=l."employeeId" AND a."payoutDate"=l."payoutDate" AND a."settlementId" IS NULL),0) AS adjustments,
        (bool_or(l.status='PAID') OR bool_or(EXISTS(SELECT 1 FROM public."PayTeamAllocation" pa WHERE pa."ledgerId"=l.id))) AS locked
      FROM public."WorkforcePayLedger" l JOIN public."EmployeeProfile" e ON e.id=l."employeeId"
      WHERE l."payoutDate" IS NOT NULL
      GROUP BY l."employeeId",e."fullName",l."payoutDate"
      ORDER BY l."payoutDate" DESC,e."fullName" LIMIT 250`,
    prisma.$queryRaw<PayoutAudit[]>`
      SELECT a.id,e."fullName" AS "employeeName",a.label,a.reason,a.amount,a."payoutDate",a."createdAt",a."settlementId"
      FROM public."WorkforcePayoutAdjustment" a JOIN public."EmployeeProfile" e ON e.id=a."employeeId"
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
            <div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold text-[#D4E5F4]">Adjustment type<select name="kind" className={input} defaultValue="AMOUNT"><option value="AMOUNT">Set final unpaid amount ($)</option>{l.sourceType!=="ADMIN_TIME"&&<></>}{l.sourceType==="ADMIN_TIME"&&<option value="DISMISS_ADMIN_TIME">Dismiss unworked hours</option>}</select></label><label className="text-xs font-semibold text-[#D4E5F4]">New amount / adjustment percentage<input className={input} name="value" type="number" min="0" step="0.01" placeholder="e.g. 15.00" /></label></div>
            <label className="block text-xs font-semibold text-[#D4E5F4]">Required adjustment reason (free text)<textarea required minLength={10} maxLength={2000} rows={2} name="reason" className={input} placeholder="Explain why this entitlement is increasing, decreasing, or being dismissed" /></label>
            <button className="w-full rounded-xl bg-[#7956AF] px-4 py-3 text-sm font-semibold text-white hover:bg-[#9068C8]">Save audited adjustment</button>
          </form>
        </article>)}</div>}
      </section>
      <section className="space-y-4"><h2 className="text-xl font-bold">Dismiss incorrect Admin hours before approval</h2><p className="text-sm text-[#B9CEE5]">Declining a candidate permanently excludes that Admin time session from payroll approval. A written reason is mandatory.</p>
        {candidates.length===0?<p className="text-sm text-[#B6CBE2]">No unapproved Admin time candidates.</p>:<div className="grid gap-3 md:grid-cols-2">{candidates.map(c=><article key={c.eventKey} className="rounded-2xl border border-[#335578] bg-[#122F50] p-4"><p className="font-semibold">{c.employeeName}</p><p className="mt-1 text-sm text-[#B9CEE5]">{cash(Number(c.grossAmount)-Number(c.fineAmount))} · {day(c.payoutDate)}</p><form action={declineWorkforcePay} className="mt-3 space-y-2"><input type="hidden" name="eventKey" value={c.eventKey}/><textarea required minLength={10} maxLength={1000} name="reason" rows={2} className={input} placeholder="Reason for dismissing hours (required)"/><button className="rounded-xl border border-[#A785DB] px-4 py-2 text-sm font-semibold text-[#DECAFA] hover:bg-[#7956AF]/20">Dismiss Admin hours</button></form></article>)}</div>}
      </section>
      <section className="space-y-4">
        <div><h2 className="text-xl font-bold">Order-wide bonuses and fines</h2><p className="mt-1 text-sm text-[#B9CEE5]">Bonus: Evaryn retains 30%; the remainder is shared Tasker 50%, Reviewer 30%, QA 20%. Fine: the full amount is deducted in the same 50/30/20 proportions. Existing base rates remain unchanged. All three participants must have exactly one eligible unpaid entry.</p></div>
        <div className="grid gap-4 xl:grid-cols-2">{Array.from(new Map(entries.filter(e=>e.taskId&&e.taskStatus==="COMPLETED").map(e=>[e.taskId!,e])).values()).map(e=><article key={e.taskId!} className="rounded-2xl border border-[#335578] bg-[#122F50] p-5">
          <h3 className="font-semibold">{e.title}</h3><p className="mt-1 text-xs text-[#BDD2E4]">{e.publicTaskId??e.taskId}</p>
          <form action={distributeOrderAdjustment} className="mt-4 space-y-3"><input type="hidden" name="taskId" value={e.taskId!}/>
            <label className="block text-xs font-semibold">Adjustment type<select name="kind" className={input}><option value="BONUS">Bonus (30% administration retained)</option><option value="FINE">Fine (full amount distributed)</option></select></label>
            <label className="block text-xs font-semibold">Total amount in USD<input name="amount" type="number" required min="0.01" step="0.01" className={input} placeholder="4.00"/></label>
            <label className="block text-xs font-semibold">Required reason<textarea name="reason" required minLength={10} maxLength={2000} rows={2} className={input} placeholder="Describe this bonus or fine"/></label>
            <button className="w-full rounded-xl bg-[#7956AF] px-4 py-3 text-sm font-semibold text-white hover:bg-[#9068C8]">Apply 50 / 30 / 20 allocation</button>
          </form></article>)}</div>
      </section>
      <section className="space-y-4">
        <div><h2 className="text-xl font-bold">Final employee payout adjustments</h2><p className="mt-1 text-sm text-[#B9CEE5]">These are independent of individual orders. Record an advance, loan recovery, damaged equipment, reward, reimbursement, or another named adjustment using a signed USD amount. They change the final unpaid total for the selected employee and payout period.</p></div>
        <div className="grid gap-4 xl:grid-cols-2">{periods.filter(p=>!p.locked).map(p=><article key={`${p.employeeId}-${p.payoutDate}`} className="rounded-2xl border border-[#335578] bg-[#122F50] p-5">
          <h3 className="font-semibold">{p.employeeName}</h3><p className="mt-1 text-sm text-[#B9CEE5]">Payout {day(p.payoutDate)} · Approved {cash(p.original)} · Other adjustments {cash(p.adjustments)}</p>
          <strong className="mt-2 block text-lg text-[#7BE1F2]">Final pending: {cash(Number(p.original)+Number(p.adjustments))}</strong>
          <form action={addFinalPayoutAdjustment} className="mt-4 space-y-3">
            <input type="hidden" name="employeeId" value={p.employeeId}/><input type="hidden" name="payoutDate" value={new Date(p.payoutDate).toISOString().slice(0,10)}/>
            <label className="block text-xs font-semibold">Adjustment name<input className={input} name="label" required minLength={2} maxLength={100} placeholder="Advance, equipment damage, bonus, reimbursement..."/></label>
            <label className="block text-xs font-semibold">Signed USD amount<input className={input} name="amount" required type="number" step="0.01" placeholder="-2500.00 or +180.00"/></label>
            <label className="block text-xs font-semibold">Why is this adjustment necessary?<textarea className={input} name="reason" required minLength={10} maxLength={2000} rows={2} placeholder="Include the reason and any relevant reference"/></label>
            <button className="w-full rounded-xl bg-[#7956AF] px-4 py-3 text-sm font-semibold text-white hover:bg-[#9068C8]">Record final payout adjustment</button>
          </form></article>)}
        </div>
        <h3 className="text-base font-semibold">Employee-wide adjustment history</h3>
        <div className="space-y-2">{payoutAudit.map(a=><div key={a.id} className="rounded-xl border border-[#335578] bg-[#122F50] p-3 text-sm"><strong>{a.employeeName} · {a.label} · {Number(a.amount)>0?"+":""}{cash(a.amount)}</strong><p className="mt-1 text-[#B9CEE5]">{a.reason}</p><p className="mt-1 text-xs text-[#A9C2D9]">{day(a.payoutDate)} · {a.settlementId?"Settled — locked":"On Hold"}</p></div>)}</div>
      </section>
      <section className="space-y-3"><h2 className="text-xl font-bold">Permanent adjustment history</h2>{history.length===0?<p className="text-sm text-[#B9CEE5]">No adjustments recorded yet.</p>:<div className="overflow-x-auto rounded-2xl border border-[#335578]"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-[#17395E] text-[#CDE7F7]"><tr><th className="p-3">Employee and order</th><th className="p-3">Change</th><th className="p-3">Reason</th><th className="p-3">Date</th></tr></thead><tbody>{history.map(a=><tr key={a.id} className="border-t border-[#335578] bg-[#102C4C]"><td className="p-3"><strong>{a.employeeName}</strong><p className="text-xs text-[#B9CEE5]">{a.title}</p></td><td className="p-3 tabular-nums">{cash(a.oldPayable)} → {cash(a.newPayable)}<p className="text-xs text-[#BEA7E8]">{a.adjustmentKind}</p></td><td className="max-w-xs p-3 text-[#CDE1F1]">{a.reason}</td><td className="p-3 whitespace-nowrap">{day(a.createdAt)}</td></tr>)}</tbody></table></div>}</section>
    </div>
  </main>;
}
export default function Page(){return <Suspense fallback={<p className="p-6">Loading On Hold…</p>}><Content/></Suspense>}
