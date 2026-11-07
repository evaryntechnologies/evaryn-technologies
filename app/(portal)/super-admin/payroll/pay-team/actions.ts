"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireEmployee } from "@/lib/auth/require-employee";

const idPattern=/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;
const dayPattern=/^\d{4}-\d{2}-\d{2}$/;
const cents=(x:unknown)=>{const n=Math.round(Number(x)*100);if(!Number.isSafeInteger(n))throw new Error("Invalid monetary value");return n;};
const amount=(n:number)=>(n/100).toFixed(2);
async function authorizedActor(){
 const user=await requireEmployee(["SUPER_ADMIN"]);
 const actor=await prisma.employeeProfile.findUnique({where:{authUserId:user.id},select:{id:true,role:true,status:true}});
 if(actor?.role!=="SUPER_ADMIN"||actor.status!=="ACTIVE")throw new Error("Super Admin access required");
 return actor;
}
function refresh(){
 for(const path of ["/super-admin/payroll/pay-team","/earnings","/notifications"] )revalidatePath(path);
}
// Employee-level adjustment, never attributed to an individual order.
export async function addEmployeePayoutAdjustment(form:FormData):Promise<void>{
 const actor=await authorizedActor();
 const employeeId=String(form.get("employeeId")??"");
 const payoutDate=String(form.get("payoutDate")??"");
 const label=String(form.get("label")??"").trim();
 const reason=String(form.get("reason")??"").trim();
 const value=String(form.get("amount")??"").trim();
 const currency=String(form.get("currency")??"");
 const rateText=String(form.get("exchangeRate")??"").trim();
 const rate=currency==="USD"?1:Number(rateText);
 if(!["USD","KES"].includes(currency))throw new Error("Select USD or KES");
 if(currency==="KES"&&(!/^\d+(?:\.\d{1,6})?$/.test(rateText)||!Number.isFinite(rate)||rate<1||rate>10000))throw new Error("Enter a verified USD to KES exchange rate");
 if(!idPattern.test(employeeId)||!dayPattern.test(payoutDate))throw new Error("Select an employee and payout period");
 if(label.length<2||label.length>100||reason.length<10||reason.length>2000)throw new Error("Adjustment name and a detailed reason are required");
 if(!/^[+-]?(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/.test(value))throw new Error("Enter a signed amount, e.g. -2500.00 or +180.00");
 const delta=currency==="USD"?cents(value):Math.round(Number(value)*100/rate);if(!Number.isSafeInteger(delta))throw new Error("Invalid monetary value");if(delta===0)throw new Error("The adjustment cannot be zero");
 await prisma.$transaction(async tx=>{
   const locked=await tx.$queryRaw<Array<{id:string}>>`SELECT id FROM public."EmployeeProfile" WHERE id=${employeeId}::uuid FOR UPDATE`;
   if(!locked.length)throw new Error("Employee not found");
   const base=await tx.$queryRaw<Array<{sum:unknown;entries:bigint;paid:bigint}>>`
    SELECT COALESCE(sum(l."payableAmount") FILTER (WHERE l.status='PENDING'
      AND NOT EXISTS(SELECT 1 FROM public."PayTeamAllocation" x WHERE x."ledgerId"=l.id)
      AND NOT EXISTS(SELECT 1 FROM public."WorkforcePayDecision" d WHERE d."ledgerId"=l.id)
      AND (l."taskId" IS NULL OR EXISTS(SELECT 1 FROM public."WorkTask" t WHERE t.id=l."taskId" AND t.status='COMPLETED' AND t."clientActionAt" IS NOT NULL))),0) AS sum,
      count(*)::bigint AS entries,
      count(*) FILTER (WHERE l.status='PAID' OR EXISTS(SELECT 1 FROM public."PayTeamAllocation" x WHERE x."ledgerId"=l.id))::bigint AS paid
    FROM public."WorkforcePayLedger" l WHERE l."employeeId"=${employeeId}::uuid AND l."payoutDate"=${payoutDate}::date`;
   if(!base[0]||base[0].entries===BigInt(0))throw new Error("No unlocked approved payroll period is available");
   const other=await tx.$queryRaw<Array<{sum:unknown}>>`
    SELECT COALESCE(sum(amount),0) AS sum FROM public."WorkforcePayoutAdjustment"
    WHERE "employeeId"=${employeeId}::uuid AND "payoutDate"=${payoutDate}::date AND "settlementId" IS NULL`;
   if(cents(base[0].sum)+cents(other[0]?.sum??0)+delta<0)throw new Error("Final payable cannot be negative");
   const issue=await tx.$queryRaw<Array<{state:string}>>`
    SELECT state FROM public."WorkforcePayStatement" WHERE "employeeId"=${employeeId}::uuid AND "payoutDate"=${payoutDate}::date FOR UPDATE`;
   if(issue[0]?.state==="DISPUTED"||issue[0]?.state==="PAID")throw new Error("Resolve the employee issue or settled statement first");
   await tx.$executeRaw`INSERT INTO public."WorkforcePayoutAdjustment"("employeeId","payoutDate","label","reason","amount","createdById","originalCurrency","originalAmount","exchangeRate")
     VALUES(${employeeId}::uuid,${payoutDate}::date,${label},${reason},${amount(delta)}::numeric,${actor.id}::uuid,${currency},${Number(value).toFixed(2)}::numeric,${rate.toFixed(6)}::numeric)`;
   // A changed payable must be published again, restarting the 48-hour review.
   await tx.$executeRaw`DELETE FROM public."WorkforcePayStatement" WHERE "employeeId"=${employeeId}::uuid AND "payoutDate"=${payoutDate}::date AND state<>'PAID'`;
   await tx.portalNotification.create({data:{recipientId:employeeId,title:"Payroll adjustment pending review",body:`${label}: ${currency} ${value} (USD ${amount(delta)} accounting adjustment at ${rate.toFixed(6)} KES/USD when applicable). ${reason}. A revised final statement will be published before payout.`,href:"/earnings"}});
 },{timeout:20000});
 refresh();
}

// Publishes one employee's eligible periods. Each period receives a new, audit-logged snapshot.
export async function publishEmployeeStatements(form:FormData):Promise<void>{
 const actor=await authorizedActor();const employeeId=String(form.get("employeeId")??"");
 if(!idPattern.test(employeeId))throw new Error("Invalid employee");
 await prisma.$transaction(async tx=>{
   const employee=await tx.$queryRaw<Array<{id:string}>>`SELECT id FROM public."EmployeeProfile" WHERE id=${employeeId}::uuid FOR UPDATE`;
   if(!employee.length)throw new Error("Employee not found");
   const rows=await tx.$queryRaw<Array<{payoutDate:Date;accrued:unknown;adjustments:unknown}>>`
     WITH eligible AS (SELECT l."payoutDate",l."payableAmount" FROM public."WorkforcePayLedger" l
       WHERE l."employeeId"=${employeeId}::uuid AND l.status='PENDING'
       AND NOT EXISTS(SELECT 1 FROM public."PayTeamAllocation" x WHERE x."ledgerId"=l.id)
       AND NOT EXISTS(SELECT 1 FROM public."WorkforcePayDecision" d WHERE d."ledgerId"=l.id)
       AND (l."taskId" IS NULL OR EXISTS(SELECT 1 FROM public."WorkTask" t WHERE t.id=l."taskId" AND t.status='COMPLETED' AND t."clientActionAt" IS NOT NULL))
       AND NOT EXISTS(SELECT 1 FROM public."WorkforcePayLedger" prior WHERE prior.id<>l.id AND prior.status='PAID' AND l."taskId" IS NOT NULL AND prior."taskId"=l."taskId" AND prior."employeeId"=l."employeeId" AND prior."sourceType"=l."sourceType")
     ) SELECT e."payoutDate",SUM(e."payableAmount") AS accrued,
       COALESCE((SELECT sum(a.amount) FROM public."WorkforcePayoutAdjustment" a WHERE a."employeeId"=${employeeId}::uuid AND a."payoutDate"=e."payoutDate" AND a."settlementId" IS NULL),0) AS adjustments
     FROM eligible e GROUP BY e."payoutDate" ORDER BY e."payoutDate"`;
   if(!rows.length)throw new Error("No eligible unpaid periods");
   for(const r of rows){
     const day=r.payoutDate instanceof Date?r.payoutDate.toISOString().slice(0,10):String(r.payoutDate).slice(0,10);
     const base=cents(r.accrued), adj=cents(r.adjustments),net=base+adj;
     if(net<0)throw new Error(`Negative payable in period ${day}`);
     const prior=await tx.$queryRaw<Array<{state:string;accrued:unknown;adjustments:unknown;finalPayable:unknown}>>`
       SELECT state,accrued,adjustments,"finalPayable" FROM public."WorkforcePayStatement"
       WHERE "employeeId"=${employeeId}::uuid AND "payoutDate"=${day}::date FOR UPDATE`;
     if(prior[0]?.state==="DISPUTED"||prior[0]?.state==="PAID")continue;
     // Do not reset an unchanged existing review window.
     if(prior[0]&&cents(prior[0].accrued)===base&&cents(prior[0].adjustments)===adj&&cents(prior[0].finalPayable)===net)continue;
     await tx.$executeRaw`INSERT INTO public."WorkforcePayStatement"("employeeId","payoutDate",accrued,adjustments,"finalPayable",state,"publishedAt")
       VALUES(${employeeId}::uuid,${day}::date,${amount(base)}::numeric,${amount(adj)}::numeric,${amount(net)}::numeric,'REVIEW',now())
       ON CONFLICT("employeeId","payoutDate") DO UPDATE SET accrued=EXCLUDED.accrued,adjustments=EXCLUDED.adjustments,
       "finalPayable"=EXCLUDED."finalPayable",state='REVIEW',"publishedAt"=now(),"issueText"=NULL,"issueAt"=NULL,resolution=NULL,"resolvedAt"=NULL,"updatedAt"=now()`;
     await tx.$executeRaw`INSERT INTO public."WorkforcePayStatementEvent"("employeeId","payoutDate","eventKind","actorId",accrued,adjustments,"finalPayable",details)
       VALUES(${employeeId}::uuid,${day}::date,'PUBLISHED',${actor.id}::uuid,${amount(base)}::numeric,${amount(adj)}::numeric,${amount(net)}::numeric,'48-hour payroll statement review opened')`;
     await tx.portalNotification.create({data:{recipientId:employeeId,title:"Final payable statement ready",body:`Your ${day} statement shows accrued $${amount(base)}, adjustments ${adj>=0?"+":""}$${amount(adj)}, final payable $${amount(net)}. You have at least 48 hours to raise a clarification before payment.`,href:"/earnings"}});
   }
 },{timeout:30000});refresh();
}
export async function resolveEmployeePayIssue(form:FormData):Promise<void>{
 const actor=await authorizedActor();const employeeId=String(form.get("employeeId")??"");
 const payoutDate=String(form.get("payoutDate")??"");const resolution=String(form.get("resolution")??"").trim();
 if(!idPattern.test(employeeId)||!dayPattern.test(payoutDate)||resolution.length<10||resolution.length>2000)throw new Error("Provide a detailed resolution");
 await prisma.$transaction(async tx=>{
   const changed=await tx.$executeRaw`UPDATE public."WorkforcePayStatement" SET state='CLEARED',resolution=${resolution},"resolvedAt"=now(),"updatedAt"=now()
     WHERE "employeeId"=${employeeId}::uuid AND "payoutDate"=${payoutDate}::date AND state='DISPUTED'`;
   if(changed!==1)throw new Error("No open issue found");
   await tx.$executeRaw`INSERT INTO public."WorkforcePayStatementEvent"("employeeId","payoutDate","eventKind","actorId",details)
     VALUES(${employeeId}::uuid,${payoutDate}::date,'ISSUE_RESOLVED',${actor.id}::uuid,${resolution})`;
   await tx.portalNotification.create({data:{recipientId:employeeId,title:"Payroll clarification answered",body:`Your payroll concern for ${payoutDate} has been reviewed: ${resolution}`,href:"/earnings"}});
 });refresh();
}

/** Super Admin confirms external funds. A client-entered payment percentage never verifies funds. */
export async function verifyStatementFunds(form:FormData):Promise<void>{
 const actor=await authorizedActor();
 const employeeId=String(form.get("employeeId")??"");
 const payoutDate=String(form.get("payoutDate")??"");
 const reference=String(form.get("evidence")??"").trim();
 if(!idPattern.test(employeeId)||!dayPattern.test(payoutDate)||reference.length<5||reference.length>300)
   throw new Error("Enter an employee, payout period and external payment evidence / reference");
 await prisma.$transaction(async tx=>{
   const changed=await tx.$executeRaw`UPDATE public."WorkforcePayStatement" SET "fundsVerifiedAt"=now(),"fundsVerifiedById"=${actor.id}::uuid,"updatedAt"=now()
     WHERE "employeeId"=${employeeId}::uuid AND "payoutDate"=${payoutDate}::date AND state IN ('REVIEW','CLEARED')`;
   if(changed!==1)throw new Error("Publish and resolve this statement before verifying funds");
   await tx.$executeRaw`INSERT INTO public."WorkforcePayStatementEvent"("employeeId","payoutDate","eventKind","actorId",details)
     VALUES(${employeeId}::uuid,${payoutDate}::date,'FUNDS_VERIFIED',${actor.id}::uuid,${reference})`;
 });refresh();
}
