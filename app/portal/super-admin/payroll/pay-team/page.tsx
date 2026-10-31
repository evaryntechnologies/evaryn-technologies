import Link from "next/link";
import { connection } from "next/server";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";
import { PaymentCard } from "./PaymentCard";

type Row={employeeId:string;fullName:string;payoutDate:Date|string;due:unknown;entries:bigint;hasMethod:boolean};
const fmt=(x:unknown)=>Number(x).toFixed(2);
const isoDay=(d:Date|string)=>d instanceof Date?d.toISOString().slice(0,10):String(d).slice(0,10);
export default async function PayTeamPage(){
  await connection();
  const auth=await requireEmployee(["SUPER_ADMIN"]);
  if(auth.role!=="SUPER_ADMIN") throw new Error("Access denied");
  const rows=await prisma.$queryRaw<Row[]>`
    SELECT l."employeeId", e."fullName",l."payoutDate",SUM(l."payableAmount") AS due,COUNT(*)::bigint AS entries,
      EXISTS(SELECT 1 FROM public."EmployeePaymentMethod" m WHERE m."employeeId"=l."employeeId" AND length(btrim(m.details))>0) AS "hasMethod"
    FROM public."WorkforcePayLedger" l
    JOIN public."EmployeeProfile" e ON e.id=l."employeeId"
    WHERE l.status='PENDING' AND l."payableAmount">0
      AND NOT EXISTS(SELECT 1 FROM public."PayTeamAllocation" a WHERE a."ledgerId"=l.id)
      AND NOT EXISTS(SELECT 1 FROM public."WorkforcePayDecision" d WHERE d."ledgerId"=l.id)
      AND NOT EXISTS(SELECT 1 FROM public."WorkforcePayLedger" prior WHERE prior.id<>l.id AND prior.status='PAID'
        AND l."taskId" IS NOT NULL AND prior."taskId"=l."taskId"
        AND prior."employeeId"=l."employeeId" AND prior."sourceType"=l."sourceType")
      AND (l."taskId" IS NULL OR EXISTS(SELECT 1 FROM public."WorkTask" t WHERE t.id=l."taskId" AND t.status='COMPLETED' AND t."clientActionAt" IS NOT NULL))
    GROUP BY l."employeeId",e."fullName",l."payoutDate"
    ORDER BY l."payoutDate",e."fullName" LIMIT 300`;
  return <main className="min-h-screen bg-[#071327] p-5 text-white sm:p-9"><div className="mx-auto max-w-7xl space-y-7">
    <header><Link className="text-sm text-cyan-300 hover:underline" href="/portal/super-admin/payroll">← Earnings approvals</Link><p className="mt-6 text-xs font-semibold uppercase tracking-widest text-cyan-300">Super Admin · Finance</p><h1 className="mt-1 text-3xl font-bold">Pay Team</h1><p className="mt-2 text-slate-300">Approved, unpaid earnings by employee and payout period. Early payments can be recorded once funds have been sent; this page does not send money.</p></header>
    <div className="grid gap-3 sm:grid-cols-3">{[["Employees / periods",String(rows.length)],["Pending approved",`$${fmt(rows.reduce((n,r)=>n+Number(r.due),0))}`],["Ready to record",String(rows.filter(r=>r.hasMethod).length)]].map(([label,value])=><div key={label} className="rounded-xl border border-white/10 bg-[#101F39] p-4"><p className="text-sm text-slate-300">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></div>)}</div>
    <section className="grid gap-4 lg:grid-cols-2">{rows.map(r=><PaymentCard key={`${r.employeeId}-${r.payoutDate}`} employeeId={r.employeeId} fullName={r.fullName} payoutDate={isoDay(r.payoutDate)} amount={fmt(r.due)} entries={Number(r.entries)} hasMethod={r.hasMethod}/>)}{rows.length===0&&<p className="text-slate-300">No approved payments awaiting settlement.</p>}</section>
  </div></main>;
}
