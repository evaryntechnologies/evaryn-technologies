const PAY_TEAM_RENDER_REFERENCE_TIME = Date.now();
import { connection } from "next/server";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";
import { Cell, ExpandRow, ListTable, Notice, PageFrame, PageTitle, Pill, Strip } from "@/app/(portal)/layouts";
import { PaymentCard } from "./PaymentCard";
import {addEmployeePayoutAdjustment,publishEmployeeStatements,resolveEmployeePayIssue,verifyStatementFunds} from "./actions";

type Employee={id:string;fullName:string;role:string;status:string;hasMethod:boolean;preferredCurrency:"USD"|"KES"};
type Period={employeeId:string;payoutDate:Date;accrued:unknown;adjustments:unknown;entries:bigint};
type Statement={employeeId:string;payoutDate:Date;state:string;finalPayable:unknown;publishedAt:Date;fundsVerifiedAt:Date|null;issueText:string|null;resolution:string|null};
const cash=(n:number)=>n.toLocaleString("en-US",{style:"currency",currency:"USD"});
const day=(d:Date)=>new Date(d).toISOString().slice(0,10);
const control="evx-input";

export default async function PayTeamPage(){
 await connection();const auth=await requireEmployee(["SUPER_ADMIN"]);
 const actor=await prisma.employeeProfile.findUnique({where:{authUserId:auth.id},select:{role:true,status:true}});
 if(actor?.role!=="SUPER_ADMIN"||actor.status!=="ACTIVE")throw new Error("Super Admin access required");
 const [employees,periods,statements]=await Promise.all([
  prisma.$queryRaw<Employee[]>`SELECT e.id,e."fullName",e.role,e.status,
   EXISTS(SELECT 1 FROM public."EmployeePaymentMethod" m WHERE m."employeeId"=e.id AND length(btrim(m.details))>0) AS "hasMethod",
   COALESCE((SELECT NULLIF(to_jsonb(m)->>'currency','') FROM public."EmployeePaymentMethod" m WHERE m."employeeId"=e.id LIMIT 1),'USD') AS "preferredCurrency"
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
 const totalAccrued=cards.reduce((n,x)=>n+x.accrued,0);const totalFinal=cards.reduce((n,x)=>n+x.final,0);
 const issues=cards.reduce((n,x)=>n+x.openIssues.length,0);
 const statusOf=(c:(typeof cards)[number])=>c.openIssues.length?{t:"Issue open",tone:"rose" as const}:c.list.length?(c.canSettle?{t:"Ready to pay",tone:"green" as const}:{t:"Awaiting settlement",tone:"amber" as const}):{t:"Nothing owed",tone:"slate" as const};
 return <PageFrame>
 <PageTitle eyebrow="Super Admin · Finance" title="Pay team" back={{href:"/portal/super-admin/payroll",label:"Payroll overview"}} description="One entry per employee: USD accounting totals, named USD/KES adjustments, and payouts recorded in USD or KES with their verified exchange rates. Publish the statement at least 48 hours before recording payment."/>
 <Strip items={[{label:"Employees",value:cards.length,tone:"blue"},{label:"Accrued earnings",value:cash(totalAccrued),tone:"cyan"},{label:"Final payable",value:cash(totalFinal),tone:"green"},{label:"Open issues",value:issues,tone:issues?"rose":"slate"}]}/>
 <ListTable label="Employee payouts" cols="minmax(0,2fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1.1fr) minmax(0,1.2fr) 20px" headers={[{text:"Employee"},{text:"Accrued",end:true},{text:"Adjustments",end:true},{text:"Final payable",end:true},{text:"Status"},{text:""}]}>
 {cards.map(c=>{const {e,list,accrued,adjustments,final,published,canSettle,mismatched,openIssues}=c;const st=statusOf(c);return <ExpandRow key={e.id} defaultOpen={openIssues.length>0} summary={<>
  <Cell><p className="evx-cell-title">{e.fullName}</p><p className="evx-meta">{e.role.replaceAll("_"," ")} · {e.status} · {list.length} period{list.length===1?"":"s"}</p></Cell>
  <Cell label="Accrued" end><span className="evx-num">{cash(accrued)}</span></Cell>
  <Cell label="Adjustments" end><span className="evx-num">{adjustments>=0?"+":""}{cash(adjustments)}</span></Cell>
  <Cell label="Final payable" end><strong className="evx-num">{cash(final)}</strong></Cell>
  <Cell label="Status"><Pill tone={st.tone}>{st.t}</Pill></Cell></>}>
  <div className="evx-split2">
   <div className="evx-stack">
    <dl className="evx-panel evx-dl"><div><dt>Accrued earnings</dt><dd>{cash(accrued)}</dd></div><div><dt>Employee-level adjustments</dt><dd>{adjustments>=0?"+":""}{cash(adjustments)}</dd></div><div className="evx-dl-total"><dt>Final payable</dt><dd>{cash(final)}</dd></div></dl>
    {list.length? <form action={addEmployeePayoutAdjustment} className="evx-panel evx-form"><h3>Adjust employee’s final payout</h3><input type="hidden" name="employeeId" value={e.id}/>
     <label className="evx-field"><span>Payout period</span><select name="payoutDate" required className="evx-select">{list.map(p=><option key={day(p.payoutDate)} value={day(p.payoutDate)}>{day(p.payoutDate)}</option>)}</select></label>
     <div className="evx-grid-2" style={{gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))"}}><label className="evx-field"><span>Adjustment name</span><input className={control} name="label" minLength={2} maxLength={100} required placeholder="Advance / Reward / Loan"/></label><label className="evx-field"><span>Signed amount</span><input className={control} name="amount" required placeholder="-2500.00 or +180.00"/></label></div>
     <label className="evx-field"><span>Adjustment currency</span><select name="currency" className="evx-select" required defaultValue="USD"><option value="USD">USD — US Dollar</option><option value="KES">KES — Kenyan Shilling</option></select></label>
     <label className="evx-field"><span>KES per 1 USD (required for KES adjustments; otherwise leave blank)</span><input name="exchangeRate" type="number" min="1" max="10000" step="0.000001" className="evx-input" placeholder="Verified exchange rate"/></label>
     <p className="evx-meta">Adjustments in KES are converted to USD for the ledger and preserve the original KES amount and your recorded rate.</p>
     <label className="evx-field"><span>Reason</span><textarea name="reason" className="evx-textarea" required minLength={10} maxLength={2000} rows={2} placeholder="Explain why this amount is added or deducted"/></label>
     <div><button type="submit" className="evx-btn evx-btn-violet">Save adjustment</button></div></form>
    : <p className="evx-panel evx-meta">Opening unpaid balance is $0.00. Adjustments become available when there is an eligible, unpaid earnings period.</p>}
   </div>
   <div className="evx-stack">
    <h3 className="evx-section-title">Final payable review and settlement</h3>
    {list.length? <>
     <div className="evx-stack" style={{gap:8}}>{list.map((p,i)=><div key={day(p.payoutDate)} className="evx-panel" style={{gap:4,padding:12}}><div style={{display:"flex",justifyContent:"space-between",gap:8}}><strong>Period {day(p.payoutDate)}</strong><Pill tone={published[i]?.state==="DISPUTED"?"rose":published[i]?"cyan":"slate"} plain>{published[i]?.state??"Not published"}</Pill></div><p className="evx-meta">{Number(p.entries)} entries · {cash(Number(p.accrued)+Number(p.adjustments))} payable</p>{published[i]&&<p className="evx-meta">Published {new Date(published[i]!.publishedAt).toLocaleString("en-GB")} · {published[i]!.fundsVerifiedAt?"Funds verified":"Funds verification pending"} · 48-hour review window</p>}</div>)}</div>
     <form action={publishEmployeeStatements}><input type="hidden" name="employeeId" value={e.id}/><button className="evx-btn evx-btn-ghost" type="submit">Publish / refresh statement</button></form>
     {list.map((p,i)=>published[i]&&!published[i]!.fundsVerifiedAt&&published[i]!.state!=="DISPUTED"?<form key={day(p.payoutDate)} action={verifyStatementFunds} className="evx-panel evx-form"><input type="hidden" name="employeeId" value={e.id}/><input type="hidden" name="payoutDate" value={day(p.payoutDate)}/><h4>Verify received funds · {day(p.payoutDate)}</h4><input className={control} name="evidence" required minLength={5} maxLength={300} placeholder="External payment evidence / bank reference"/><div><button type="submit" className="evx-btn evx-btn-ghost evx-btn-sm">Confirm funds received</button></div></form>:null)}
     {openIssues.map(s=><form key={day(s!.payoutDate)} action={resolveEmployeePayIssue} className="evx-panel evx-form evx-t-amber" style={{borderColor:"var(--evx-amber)"}}><h4>Issue · {day(s!.payoutDate)}</h4><p style={{margin:0,fontSize:14}}>{s!.issueText}</p><input type="hidden" name="employeeId" value={e.id}/><input type="hidden" name="payoutDate" value={day(s!.payoutDate)}/><textarea name="resolution" className="evx-textarea" rows={2} minLength={10} required placeholder="Written explanation / resolution"/><div><button className="evx-btn evx-btn-violet evx-btn-sm">Resolve issue</button></div></form>)}
     <Notice tone={canSettle?"green":"cyan"}>{mismatched?"Statement is missing or outdated. Publish the updated amount before settlement.":openIssues.length?"Employee clarification is unresolved; payment is blocked.":canSettle?"All published amounts have completed the 48-hour review period.":"Payment requires Super Admin funds verification, a published statement and 48 hours for employee review."}</Notice>
     <PaymentCard employeeId={e.id} fullName={e.fullName} amount={final.toFixed(2)} hasMethod={e.hasMethod} canSettle={canSettle&&final>0} preferredCurrency={e.preferredCurrency}/>
    </>:<p className="evx-meta">No eligible unpaid entries. The employee remains visible with a zero pending balance.</p>}
   </div>
  </div>
 </ExpandRow>})}
 </ListTable>
 </PageFrame>;
}
