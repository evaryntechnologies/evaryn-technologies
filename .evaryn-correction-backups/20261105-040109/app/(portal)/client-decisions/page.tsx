import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { requireEmployee } from "@/lib/auth/require-employee";

export const dynamic = "force-dynamic";

type Pending = {id:string;taskId:string;reason:string;paidPercent:string;createdAt:Date;title:string;clientName:string};

export default async function ClientDecisions() {
  const user = await requireEmployee(["ADMIN", "SUPER_ADMIN"]);
  const employee = await prisma.employeeProfile.findUnique({ where: { authUserId: user.id }, select: { role:true,status:true } });
  if (!employee || employee.status !== "ACTIVE" || !["ADMIN","SUPER_ADMIN"].includes(employee.role)) throw new Error("Unauthorized");
  const pending = await prisma.$queryRaw<Pending[]>`
    SELECT d."id", d."taskId", d."reason", d."paidPercent"::text AS "paidPercent", d."createdAt", t."title", c."fullName" AS "clientName"
    FROM public."ClientDeliveryDecision" d
    JOIN public."WorkTask" t ON t."id" = d."taskId"
    JOIN public."ClientProfile" c ON c."id" = d."clientId"
    WHERE d."status"='PENDING' ORDER BY d."createdAt" DESC LIMIT 100`;
  return <main className="min-h-screen bg-[#EFF7FD] p-6 font-sans text-[#133761] dark:bg-[#0B1E3B] dark:text-white"><div className="mx-auto max-w-5xl"><header className="rounded-2xl bg-[#DFEFFB] p-7 dark:bg-[#142F51]"><p className="text-xs font-bold uppercase tracking-widest text-[#7956AF] dark:text-[#CEB8FA]">Evaryn · Client operations</p><h1 className="mt-2 text-3xl font-bold">Client delivery decisions</h1><p className="mt-3 text-sm opacity-75">Client-reported payments await administrative verification. Never treat a report as a confirmed transfer or update payroll automatically.</p></header><div className="mt-6 grid gap-4">{pending.map(item=><article key={item.id} className="rounded-xl border border-[#A6D4EB] bg-[#F7FCFF] p-5 dark:border-[#36567B] dark:bg-[#163253]"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-bold">{item.title}</h2><span className="rounded-full bg-[#E8DEF8] px-3 py-1 text-xs font-semibold text-[#7956AF] dark:bg-[#483365] dark:text-[#E9D6FF]">Payment verification required</span></div><p className="mt-2 text-sm">Client: {item.clientName} · Reported: {item.paidPercent}%</p><p className="mt-2 whitespace-pre-wrap text-sm opacity-75">{item.reason}</p><p className="mt-3 text-xs opacity-65">{item.createdAt.toLocaleString("en-GB")}</p><Link href="/portal/qa/client-actions" className="mt-4 inline-block text-sm font-bold text-[#7956AF] underline dark:text-[#D8BFF7]">Open staff payment review</Link></article>)}{pending.length===0&&<div className="rounded-xl border border-[#A6D4EB] bg-[#F7FCFF] p-8 text-center dark:border-[#36567B] dark:bg-[#163253]">No client-reported partial payments awaiting verification.</div>}</div></div></main>;
}
