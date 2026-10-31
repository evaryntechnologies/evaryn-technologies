import { BackLink } from "@/app/portal/ui";
import { connection } from "next/server";
import { Suspense } from "react";
import Link from "next/link";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";

import { canChangePaymentNow, paymentChangeWindowMessage } from "./payment-utils";
import PaymentRequestForm from "./PaymentRequestForm";

type Current={method:string;accountName:string;updatedAt:Date};
type Pending={id:string;method:string;requestedAt:Date};
async function Content(){
 await connection();
 const user=await requireEmployee();
 const profile=await prisma.employeeProfile.findUnique({where:{authUserId:user.id},select:{id:true}});
 const current=profile?await prisma.$queryRaw<Current[]>`SELECT "method","accountName","updatedAt" FROM public."EmployeePaymentMethod" WHERE "employeeId"=${profile.id}::uuid`:[];
 const pending=profile?await prisma.$queryRaw<Pending[]>`SELECT "id","method","requestedAt" FROM public."PaymentChangeRequest" WHERE "employeeId"=${profile.id}::uuid AND "status"='PENDING' LIMIT 1`:[];
 const allowed=!current.length || canChangePaymentNow();
 return <main className="min-h-screen bg-[#071327] p-5 text-white sm:p-10"><BackLink href="/portal" label="Dashboard" /><h1 className="mt-5 text-3xl font-bold">Payment Method</h1><p className="mt-2 text-slate-300">Register your first payment method or request a change. Every request requires approval from an Admin or Super Admin; payments are managed separately.</p>
 {current[0]&&<p className="mt-5 rounded-xl bg-[#101F39] p-4">Current: {current[0].method} — {current[0].accountName} (approved {current[0].updatedAt.toLocaleDateString("en-KE")})</p>}
 {pending[0]&&<p className="mt-5 rounded-xl border border-amber-400/30 p-4">A {pending[0].method} {current.length ? "change" : "registration"} request submitted on {pending[0].requestedAt.toLocaleDateString("en-KE")} is awaiting approval.</p>}
 {!allowed&&<p className="mt-5 rounded-xl border border-amber-400/30 p-4">{paymentChangeWindowMessage()}</p>}
 {allowed&&!pending.length&&<PaymentRequestForm hasCurrent={!!current.length} />}
 </main>;
}
export default function Page(){return <Suspense fallback={<p>Loading payment methods…</p>}><Content/></Suspense>}
