import Link from "next/link";
import { connection } from "next/server";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";
import { PaymentCard } from "./PaymentCard";

type Row={employeeId:string;fullName:string;accrued:unknown;adjustments:unknown;due:unknown;entries:bigint;periods:bigint;hasMethod:boolean};
const fmt=(x:unknown)=>Number(x).toFixed(2);
export default async function PayTeamPage(){
  await connection();
  const auth=await requireEmployee(["SUPER_ADMIN"]);
  if(auth.role!=="SUPER_ADMIN") throw new Error("Access denied");
  // Group each employee across ALL eligible payout dates, once. Adjustments are
  // aggregated by (employee, date) to avoid multiplying them by order ledger rows.
  const rows=await prisma.$queryRaw<Row[]>`
    WITH eligible AS (
      SELECT l."employeeId",l."payoutDate",l."payableAmount" FROM public."WorkforcePayLedger" l
      WHERE l.status='PENDING'
        AND NOT EXISTS(SELECT 1 FROM public."PayTeamAllocation" a WHERE a."ledgerId"=l.id)
        AND NOT EXISTS(SELECT 1 FROM public."WorkforcePayDecision" d WHERE d."ledgerId"=l.id)
        AND NOT EXISTS (SELECT 1 FROM public."WorkforcePayLedger" prior WHERE prior.id<>l.id AND prior.status='PAID'
          AND l."taskId" IS NOT NULL AND prior."taskId"=l."taskId" AND prior."employeeId"=l."employeeId" AND prior."sourceType"=l."sourceType")
        AND (l."taskId" IS NULL OR EXISTS(SELECT 1 FROM public."WorkTask" t WHERE t.id=l."taskId" AND t.status='COMPLETED' AND t."clientActionAt" IS NOT NULL))
    ), periods AS (
      SELECT "employeeId","payoutDate",sum("payableAmount") AS accrued,count(*)::bigint AS entries
      FROM eligible GROUP BY "employeeId","payoutDate"
    ), dated AS (
      SELECT p."employeeId",p.accrued,p.entries,
        coalesce((SELECT sum(a.amount) FROM public."WorkforcePayoutAdjustment" a
          WHERE a."employeeId"=p."employeeId" AND a."payoutDate"=p."payoutDate" AND a."settlementId" IS NULL),0) AS adjustments
      FROM periods p
    )
    SELECT e.id AS "employeeId",e."fullName",sum(d.accrued) AS accrued,sum(d.adjustments) AS adjustments,
      sum(d.accrued+d.adjustments) AS due,sum(d.entries)::bigint AS entries,count(*)::bigint AS periods,
      EXISTS(SELECT 1 FROM public."EmployeePaymentMethod" m WHERE m."employeeId"=e.id AND length(btrim(m.details))>0) AS "hasMethod"
    FROM dated d JOIN public."EmployeeProfile" e ON e.id=d."employeeId"
    GROUP BY e.id,e."fullName" ORDER BY e."fullName" LIMIT 500`;
  return <main className="min-h-screen bg-[#071D38] p-5 text-white sm:p-9"><div className="mx-auto max-w-7xl space-y-7">
    <header><Link className="text-sm text-cyan-300 hover:underline" href="/portal/super-admin/payroll">← Payroll overview</Link><p className="mt-6 text-xs font-semibold uppercase tracking-widest text-cyan-300">EVARYN · SUPER ADMIN · FINANCE</p><h1 className="mt-1 text-3xl font-bold">Pay Team</h1><p className="mt-2 text-slate-300">One entry per employee. Review accrued earnings, make final adjustments in On Hold, then record one verified transfer for the employee’s eligible payout periods.</p><Link href="/portal/super-admin/on-hold" className="mt-4 inline-flex rounded-xl border border-[#916CC4] bg-[#332454] px-4 py-2 text-sm font-semibold text-white hover:bg-[#493472]">Manage adjustments in On Hold</Link></header>
    <div className="grid gap-3 sm:grid-cols-3">{[["Employees",String(rows.length)],["Total accrued",`$${fmt(rows.reduce((n,r)=>n+Number(r.accrued),0))}`],["Net to remit",`$${fmt(rows.reduce((n,r)=>n+Math.max(Number(r.due),0),0))}`]].map(([label,value])=><div key={label} className="rounded-xl border border-[#29506F] bg-[#102D4D] p-4"><p className="text-sm text-slate-300">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></div>)}</div>
    <section className="grid gap-4 lg:grid-cols-2">{rows.map(r=><PaymentCard key={r.employeeId} employeeId={r.employeeId} fullName={r.fullName} accrued={fmt(r.accrued)} adjustments={fmt(r.adjustments)} amount={fmt(r.due)} entries={Number(r.entries)} periods={Number(r.periods)} hasMethod={r.hasMethod}/>)}{rows.length===0&&<p className="text-slate-300">No eligible unpaid payroll records.</p>}</section>
  </div></main>;
}
