const PAY_TEAM_RENDER_REFERENCE_TIME = Date.now();
import { connection } from "next/server";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";
import Link from "next/link";
import { PaymentCard } from "./PaymentCard";
import {addEmployeePayoutAdjustment,publishEmployeeStatements,resolveEmployeePayIssue,verifyStatementFunds} from "./actions";

type Employee={id:string;fullName:string;role:string;status:string;hasMethod:boolean};
type Period={employeeId:string;payoutDate:Date;accrued:unknown;adjustments:unknown;entries:bigint};
type Statement={employeeId:string;payoutDate:Date;state:string;finalPayable:unknown;publishedAt:Date;fundsVerifiedAt:Date|null;issueText:string|null;resolution:string|null};
const cash=(n:number)=>n.toLocaleString("en-US",{style:"currency",currency:"USD"});
const day=(d:Date)=>new Date(d).toISOString().slice(0,10);
const control="w-full rounded-xl border border-[#426486] bg-[#071D38] px-3 py-2.5 text-sm text-white placeholder:text-[#9DB9CD] focus:border-[#69D9F1] focus:outline-none";

export default async function PayTeamPage(){
 await connection();const auth=await requireEmployee(["SUPER_ADMIN"]);
 const actor=await prisma.employeeProfile.findUnique({where:{authUserId:auth.id},select:{role:true,status:true}});
 if(actor?.role!=="SUPER_ADMIN"||actor.status!=="ACTIVE")throw new Error("Super Admin access required");
 const [employees,periods,statements]=await Promise.all([
  prisma.$queryRaw<Employee[]>`SELECT e.id,e."fullName",e.role,e.status,
   EXISTS(SELECT 1 FROM public."EmployeePaymentMethod" m WHERE m."employeeId"=e.id AND length(btrim(m.details))>0) AS "hasMethod"
   FROM public."EmployeeProfile" e ORDER BY e."fullName"`,
  prisma.$queryRaw<Period[]>`WITH eligible AS (
    SELECT l."employeeId",l."payoutDate",l."payableAmount" FROM public."WorkforcePayLedger" l
    WHERE l.status='PENDING'
      AND NOT EXISTS(SELECT 1 FROM public."PayTeamAllocation" a WHERE a."ledgerId"=l.id)
      AND NOT EXISTS(SELECT 1 FROM public."WorkforcePayDecision" d WHERE d."ledgerId"=l.id)
      AND NOT EXISTS(SELECT 1 FROM public."WorkforcePayLedger" prior WHERE prior.id<>l.id AND prior.status='PAID'
          AND l."taskId" IS NOT NULL AND prior."taskId"=l."taskId" AND prior."employeeId"=l."employeeId" AND prior."sourceType"=l."sourceType")
      AND (l."taskId" IS NULL OR EXISTS(SELECT 1 FROM public."WorkTask" t WHERE t.id=l."taskId" AND t.status='COMPLETED' AND t."clientActionAt" IS NOT NULL))
   ) SELECT e."employeeId",e."payoutDate",sum(e."payableAmount") AS accrued,count(*)::bigint AS entries,
    COALESCE((SELECT sum(a.amount) FROM public."WorkforcePayoutAdjustment" a WHERE a."employeeId"=e."employeeId"
       AND a."payoutDate"=e."payoutDate" AND a."settlementId" IS NULL),0) AS adjustments
   FROM eligible e GROUP BY e."employeeId",e."payoutDate" ORDER BY e."payoutDate"`,
  prisma.$queryRaw<Statement[]>`SELECT "employeeId","payoutDate",state,"finalPayable","publishedAt","fundsVerifiedAt","issueText",resolution
    FROM public."WorkforcePayStatement" WHERE state<>'PAID'`
 ]);
 const now=PAY_TEAM_RENDER_REFERENCE_TIME;const cards=employees.map(e=>{
   const list=periods.filter(p=>p.employeeId===e.id);
   const accrued=list.reduce((n,p)=>n+Number(p.accrued),0);
   const adjustments=list.reduce((n,p)=>n+Number(p.adjustments),0);
   const published=list.map(p=>statements.find(s=>s.employeeId===e.id&&day(s.payoutDate)===day(p.payoutDate)));
   const allPublished=list.length>0&&published.every(Boolean);
   const mismatched=list.some((p,i)=>!published[i]||Math.abs(Number(p.accrued)+Number(p.adjustments)-Number(published[i]?.finalPayable))>0.001);
   const openIssues=published.filter(s=>s?.state==="DISPUTED");
   const canSettle=allPublished&&!mismatched&&openIssues.length===0&&published.every(s=>s&&s.fundsVerifiedAt&&now-new Date(s.publishedAt).getTime()>=48*3600*1000);
   return {e,list,accrued,adjustments,final:accrued+adjustments,published,canSettle,mismatched,openIssues};
 });
 return <main className="ev-layout-list min-h-screen bg-[#071D38] px-4 py-7 font-sans text-white sm:px-8"><div className="mx-auto max-w-7xl space-y-7">
 <header className="space-y-2"><Link href="/super-admin/payroll" className="text-sm font-semibold text-cyan-300 hover:underline">← Payroll overview</Link><p className="pt-4 text-xs font-semibold uppercase tracking-[.2em] text-cyan-300">EVARYN / SUPER ADMIN / FINANCE</p><h1 className="text-3xl font-bold tracking-tight">Pay Team</h1><p className="max-w-3xl text-sm leading-6 text-slate-300">One entry per employee. Accrued earnings from eligible completed work, named employee-level adjustments and one final payable amount. Publish the statement at least 48 hours before recording payment.</p></header>
 <section className="grid gap-3 sm:grid-cols-3">{[["Employees",String(cards.length)],["Accrued earnings",cash(cards.reduce((n,x)=>n+x.accrued,0))],["Final payable",cash(cards.reduce((n,x)=>n+x.final,0))]].map(([label,v])=><div key={label} className="rounded-2xl border border-[#2E526F] bg-[#112D4E] p-5"><div className="text-sm text-slate-300">{label}</div><div className="mt-2 text-2xl font-semibold tabular-nums">{v}</div></div>)}</section>
 <section className="ev-layout-list-items space-y-4">{cards.map(({e,list,accrued,adjustments,final,published,canSettle,mismatched,openIssues})=><article key={e.id} className="overflow-hidden rounded-2xl border border-[#315878] bg-[#102B4A]">
 <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#315878] p-5"><div><h2 className="text-lg font-semibold">{e.fullName}</h2><p className="mt-1 text-xs text-slate-300">{e.role.replaceAll("_"," ")} · {e.status} · {list.length} eligible payout period(s)</p></div><span className="rounded-full border border-[#775FB0] bg-[#342753] px-3 py-1 text-xs text-[#E7D7FF]">{openIssues.length?"Employee issue open":list.length?"Awaiting settlement":"No outstanding balance"}</span></div>
 <div className="grid gap-5 p-5 lg:grid-cols-[1fr_1.05fr]"><div className="space-y-4"><dl className="space-y-3 rounded-xl bg-[#071D38] p-4 text-sm"><div className="flex justify-between gap-3"><dt className="text-slate-300">Accrued earnings</dt><dd className="font-semibold tabular-nums">{cash(accrued)}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-300">Employee-level adjustments</dt><dd className="font-semibold tabular-nums">{adjustments>=0?"+":""}{cash(adjustments)}</dd></div><div className="flex justify-between gap-3 border-t border-[#365574] pt-3"><dt className="font-semibold">Final payable</dt><dd className="text-xl font-bold tabular-nums text-cyan-200">{cash(final)}</dd></div></dl>
 {list.length? <form action={addEmployeePayoutAdjustment} className="space-y-3 rounded-xl border border-[#355875] p-4"><h3 className="font-semibold">Adjust employee’s final payout</h3><input type="hidden" name="employeeId" value={e.id}/><label className="block text-xs text-slate-300">Payout period<select name="payoutDate" required className={`${control} mt-1`}>{list.map(p=><option key={day(p.payoutDate)} value={day(p.payoutDate)}>{day(p.payoutDate)}</option>)}</select></label><div className="grid gap-3 sm:grid-cols-2"><label className="block text-xs text-slate-300">Adjustment name<input className={`${control} mt-1`} name="label" minLength={2} maxLength={100} required placeholder="Advance / Reward / Loan"/></label><label className="block text-xs text-slate-300">Signed amount (USD)<input className={`${control} mt-1`} name="amount" required placeholder="-2500.00 or +180.00"/></label></div><label className="block text-xs text-slate-300">Reason<textarea name="reason" className={`${control} mt-1`} required minLength={10} maxLength={2000} rows={2} placeholder="Explain why this amount is added or deducted"/></label><button type="submit" className="rounded-xl bg-[#7956AF] px-4 py-2.5 text-sm font-semibold hover:bg-[#916CCC]">Save adjustment</button></form> : <p className="rounded-xl border border-[#365574] p-4 text-sm text-slate-300">Opening unpaid balance is $0.00. Adjustments become available when there is an eligible, unpaid earnings period.</p>}
 </div><div className="space-y-3"><h3 className="font-semibold">Final payable review and settlement</h3>{list.length? <><div className="space-y-2">{list.map((p,i)=><div key={day(p.payoutDate)} className="rounded-xl border border-[#355875] p-3 text-xs"><div className="flex justify-between gap-2"><strong>Period {day(p.payoutDate)}</strong><span>{published[i]?.state??"Not published"}</span></div><p className="mt-1 text-slate-300">{Number(p.entries)} entries · {cash(Number(p.accrued)+Number(p.adjustments))} payable</p>{published[i]&&<p className="mt-1 text-slate-300">Published {new Date(published[i]!.publishedAt).toLocaleString("en-GB")} · {published[i]!.fundsVerifiedAt?"Funds verified":"Funds verification pending"} · 48-hour review window</p>}</div>)}</div>
 <form action={publishEmployeeStatements}><input type="hidden" name="employeeId" value={e.id}/><button className="rounded-xl border border-cyan-400 px-4 py-2.5 text-sm font-semibold text-cyan-200 hover:bg-[#183B5B]" type="submit">Publish / refresh statement</button></form>
 {list.map((p,i)=>published[i]&&!published[i]!.fundsVerifiedAt&&published[i]!.state!=="DISPUTED"?<form key={day(p.payoutDate)} action={verifyStatementFunds} className="space-y-2 rounded-xl border border-[#365574] p-3"><input type="hidden" name="employeeId" value={e.id}/><input type="hidden" name="payoutDate" value={day(p.payoutDate)}/><p className="text-xs font-semibold">Verify received funds · {day(p.payoutDate)}</p><input className={control} name="evidence" required minLength={5} maxLength={300} placeholder="External payment evidence / bank reference"/><button type="submit" className="rounded-lg border border-cyan-400 px-3 py-2 text-xs text-cyan-200">Confirm funds received</button></form>:null)}
 {openIssues.map(s=><form key={day(s!.payoutDate)} action={resolveEmployeePayIssue} className="space-y-2 rounded-xl border border-amber-400/50 bg-[#4A3827] p-3"><p className="text-sm font-semibold">Issue · {day(s!.payoutDate)}</p><p className="text-sm">{s!.issueText}</p><input type="hidden" name="employeeId" value={e.id}/><input type="hidden" name="payoutDate" value={day(s!.payoutDate)}/><textarea name="resolution" className={control} rows={2} minLength={10} required placeholder="Written explanation / resolution"/><button className="rounded-lg bg-[#7956AF] px-3 py-2 text-sm font-semibold">Resolve issue</button></form>)}
 <p className="text-xs leading-5 text-slate-300">{mismatched?"Statement is missing or outdated. Publish the updated amount before settlement.":openIssues.length?"Employee clarification is unresolved; payment is blocked.":canSettle?"All published amounts have completed the 48-hour review period.":"Payment requires Super Admin funds verification, a published statement and 48 hours for employee review."}</p>
 <PaymentCard employeeId={e.id} fullName={e.fullName} amount={final.toFixed(2)} hasMethod={e.hasMethod} canSettle={canSettle&&final>0}/>
 </>:<p className="text-sm text-slate-300">No eligible unpaid entries. The employee remains visible with a zero pending balance.</p>}</div></div>
 </article>)}</section>
 </div></main>;
}
