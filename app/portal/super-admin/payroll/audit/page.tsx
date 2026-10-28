import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";

type RecordRow = {id:string;title:string;status:string;clientActionAt:Date|null;totalOrderCost:unknown;assignedToId:string|null;paidEntries:bigint;reviewRounds:bigint;qaRounds:bigint;activeFines:unknown};
async function Content(){
 await connection();
 const user=await requireEmployee(["SUPER_ADMIN"]);
 const actor=await prisma.employeeProfile.findUnique({where:{authUserId:user.id},select:{role:true,status:true}});
 if(actor?.role!=="SUPER_ADMIN"||actor.status!=="ACTIVE") throw new Error("Super Admin only");
 const rows=await prisma.$queryRaw<RecordRow[]>`
  SELECT t.id,t.title,t.status,t."clientActionAt",t."totalOrderCost",t."assignedToId",
  (SELECT count(*) FROM public."PayrollEntry" p WHERE p."taskId"=t.id) AS "paidEntries",
  (SELECT count(*) FROM public."TaskReview" r JOIN public."TaskSubmission" s ON s.id=r."submissionId" WHERE s."taskId"=t.id AND r.stage='REVIEWER') AS "reviewRounds",
  (SELECT count(*) FROM public."TaskReview" r JOIN public."TaskSubmission" s ON s.id=r."submissionId" WHERE s."taskId"=t.id AND r.stage='QA') AS "qaRounds",
  (SELECT COALESCE(sum(f.amount),0) FROM public."TaskPenalty" f WHERE f."taskId"=t.id AND f.status='ACTIVE') AS "activeFines"
  FROM public."WorkTask" t WHERE t.status IN ('COMPLETED','CANCELED','CANCELLED','DELIVERED','PENDING_CLIENT_ACTION')
  ORDER BY t."updatedAt" DESC LIMIT 300`;
 const ready=rows.filter(t=>t.status==='COMPLETED'&&!!t.clientActionAt&&!!t.assignedToId&&Number(t.totalOrderCost??0)>0);
 const missing=ready.filter(t=>Number(t.paidEntries)===0);
 return <main className="min-h-screen bg-[#071327] px-5 py-9 text-white sm:px-9">
 <Link href="/portal/super-admin/payroll" className="text-cyan-300 underline">Back to Payroll</Link>
 <h1 className="mt-5 text-3xl font-bold">Payroll readiness audit</h1>
 <p className="mt-2 text-sm text-slate-300">Read-only. This report does not approve or release money. Review and QA work must be allocated separately before final settlement.</p>
 <div className="mt-6 grid gap-3 sm:grid-cols-3">{[["Eligible completed orders",ready.length],["Awaiting first approval",missing.length],["Other closed/delivered records",rows.length-ready.length]].map(([label,n])=><section key={String(label)} className="rounded-xl bg-[#101F39] p-4"><p className="text-sm text-slate-300">{label}</p><p className="mt-2 text-2xl font-bold">{n}</p></section>)}</div>
 <div className="mt-7 grid gap-3 lg:grid-cols-2">{rows.map(t=><article key={t.id} className="rounded-xl border border-white/10 bg-[#101F39] p-5">
 <h2 className="font-semibold">{t.title}</h2><p className="mt-2 text-sm text-cyan-300">{t.status}</p>
 <p className="mt-2 text-sm text-slate-300">Client action: {t.clientActionAt?.toLocaleDateString("en-KE")??"Not recorded"} · Order value: {Number(t.totalOrderCost??0).toFixed(2)}</p>
 <p className="mt-2 text-sm text-slate-300">Reviewer events: {Number(t.reviewRounds)} · QA events: {Number(t.qaRounds)} · Active fines: {Number(t.activeFines??0).toFixed(2)}</p>
 <p className="mt-2 text-sm">Payroll entries: {Number(t.paidEntries)} · {t.status==='COMPLETED'&&!!t.clientActionAt?'Client-paid stage':'Not eligible for payment'}</p>
 </article>)}{!rows.length&&<p>No matching orders.</p>}</div>
 </main>;
}
export default function Page(){return <Suspense fallback={<main className="p-8">Loading payroll audit…</main>}><Content/></Suspense>}
