import { connection } from "next/server";
import { Suspense } from "react";
import Link from "next/link";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";
import { requestPaymentChange } from "./actions";
import { canChangePaymentNow, paymentChangeWindowMessage } from "./payment-utils";
import PaymentChangeFields from "./PaymentChangeFields";

type Current={method:string;accountName:string;updatedAt:Date};
type Pending={id:string;method:string;requestedAt:Date};
async function Content(){
 await connection();
 const user=await requireEmployee();
 const profile=await prisma.employeeProfile.findUnique({where:{authUserId:user.id},select:{id:true}});
 const current=profile?await prisma.$queryRaw<Current[]>`SELECT "method","accountName","updatedAt" FROM public."EmployeePaymentMethod" WHERE "employeeId"=${profile.id}::uuid`:[];
 const pending=profile?await prisma.$queryRaw<Pending[]>`SELECT "id","method","requestedAt" FROM public."PaymentChangeRequest" WHERE "employeeId"=${profile.id}::uuid AND "status"='PENDING' LIMIT 1`:[];
 const allowed=canChangePaymentNow();
 return <main className="min-h-screen bg-[#071327] p-5 text-white sm:p-10"><Link href="/portal" className="text-cyan-300">← My Dashboard</Link><h1 className="mt-5 text-3xl font-bold">Payment Method</h1><p className="mt-2 text-slate-300">Choose mobile money or bank transfer. Requests require administrator approval; this page does not send payments.</p>
 {current[0]&&<p className="mt-5 rounded-xl bg-[#101F39] p-4">Current: {current[0].method} — {current[0].accountName} (approved {current[0].updatedAt.toLocaleDateString("en-KE")})</p>}
 {pending[0]&&<p className="mt-5 rounded-xl border border-amber-400/30 p-4">A {pending[0].method} change request submitted on {pending[0].requestedAt.toLocaleDateString("en-KE")} is awaiting approval.</p>}
 {!allowed&&<p className="mt-5 rounded-xl border border-amber-400/30 p-4">{paymentChangeWindowMessage()}</p>}
 {allowed&&!pending.length&&<form action={requestPaymentChange} className="mt-6 max-w-2xl rounded-xl border border-white/10 bg-[#101F39] p-5"><PaymentChangeFields/><button className="mt-5 rounded-lg bg-[#0052CC] px-5 py-3 font-semibold">Request payment method change</button></form>}
 </main>;
}
export default function Page(){return <Suspense fallback={<p>Loading payment methods…</p>}><Content/></Suspense>}
