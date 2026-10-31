import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";
import { approveWorkforcePay } from "../actions";
type Row={eventKey:string;employeeId:string;fullName:string;eligibleAt:Date;grossAmount:unknown;fineAmount:unknown;payoutDate:Date;sessionId:string|null};
async function Content(){
 await connection(); const user=await requireEmployee(["SUPER_ADMIN"]);
 if(user.role!=="SUPER_ADMIN")throw new Error("Super Admin only");
 const actor=await prisma.employeeProfile.findUnique({where:{authUserId:user.id},select:{role:true,status:true}});
 if(!actor||actor.status!=="ACTIVE"||actor.role!=="SUPER_ADMIN")throw new Error("Access denied");
 const [items,approved]=await Promise.all([
  prisma.$queryRaw<Row[]>`SELECT c."eventKey",c."employeeId",e."fullName",c."eligibleAt",c."grossAmount",c."fineAmount",c."payoutDate",c."sessionId" FROM public."WorkforcePayCandidates" c JOIN public."EmployeeProfile" e ON e.id=c."employeeId" WHERE c."sourceType"='ADMIN_TIME' AND (c."grossAmount" - c."fineAmount") > 0 ORDER BY c."eligibleAt" DESC LIMIT 200`,
  prisma.$queryRaw<Array<{id:string;fullName:string;grossAmount:unknown;payableAmount:unknown;status:string;payoutDate:Date}>>`SELECT l.id,e."fullName",l."grossAmount",l."payableAmount",l.status,l."payoutDate" FROM public."WorkforcePayLedger" l JOIN public."EmployeeProfile" e ON e.id=l."employeeId" WHERE l."sourceType"='ADMIN_TIME' ORDER BY l."createdAt" DESC LIMIT 200`
 ]);
 const usd=(v:unknown)=>Number(v??0).toFixed(2);
 return <main className="w-full min-h-screen bg-[#071327] p-5 text-white sm:p-8"><Link className="text-cyan-300" href="/portal/super-admin/payroll">← Payroll</Link><h1 className="mt-4 text-2xl font-bold">Approve tracked Admin hours</h1><p className="mt-2 text-sm text-slate-300">Only finished, server-recorded active time sessions are payable. Approval adds the earnings to the existing payroll ledger; it does not send money.</p><h2 className="mt-7 text-lg font-semibold">Awaiting approval</h2><div className="mt-3 space-y-3">{items.map(x=><article key={x.eventKey} className="rounded-xl bg-[#101F39] p-4"><strong>{x.fullName}</strong><p className="text-sm text-slate-300">Session {x.sessionId} · {new Date(x.eligibleAt).toLocaleDateString("en-KE")} · Pay period {new Date(x.payoutDate).toLocaleDateString("en-KE")}</p><p className="my-2">Accrued: ${usd(x.grossAmount)}</p><form action={approveWorkforcePay}><input type="hidden" name="eventKey" value={x.eventKey}/><button className="rounded-lg bg-[#0052CC] px-4 py-2 font-semibold">Approve tracked hours</button></form></article>)}{items.length===0&&<p className="text-slate-300">No completed Admin sessions with a payable balance above $0.00 are awaiting approval.</p>}</div><h2 className="mt-7 text-lg font-semibold">Already approved</h2><div className="mt-3 space-y-2">{approved.map(x=><div key={x.id} className="rounded-lg bg-[#101F39] p-3">{x.fullName} · ${usd(x.payableAmount)} · {x.status} · {new Date(x.payoutDate).toLocaleDateString("en-KE")}</div>)}{approved.length===0&&<p className="text-slate-300">None yet.</p>}</div></main>
}
export default function Page(){return <Suspense fallback={<p className="p-6">Loading Admin hours…</p>}><Content/></Suspense>}
