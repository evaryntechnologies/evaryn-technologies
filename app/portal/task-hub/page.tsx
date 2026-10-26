import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";
import { claimHubTask } from "./actions";

async function Hub() {
 await connection();
 const user=await requireEmployee();
 const employee=await prisma.employeeProfile.findUnique({where:{authUserId:user.id},select:{id:true,role:true,status:true,eligibleCategories:{select:{category:{select:{name:true,active:true}}}}}});
 if(!employee||employee.status!=="ACTIVE") return <main className="p-8">Employee unavailable.</main>;
 const manager=["ADMIN","SUPER_ADMIN"].includes(employee.role);
 const allowed=employee.eligibleCategories.filter(x=>x.category.active).map(x=>x.category.name);
 const tasks=await prisma.workTask.findMany({where:{status:"OPEN",assignedToId:null,...(manager?{}:{category:{in:allowed}})},select:{id:true,publicTaskId:true,title:true,description:true,category:true,priority:true,unitsOrdered:true,unitRate:true,totalOrderCost:true,billingUnit:true,createdAt:true},orderBy:{createdAt:"desc"},take:100});
 return <main className="min-h-screen bg-[#071327] px-4 py-8 text-white sm:px-8"><div className="w-full max-w-none">
 <Link href="/portal" className="text-cyan-300 underline">Back to dashboard</Link>
 <h1 className="mt-6 text-3xl font-bold">Task Hub</h1>
 <p className="mt-2 text-slate-300">Available orders {manager?"across all categories":"in your assigned categories"}. Drafts and claimed tasks are not shown.</p>
 {manager && <Link className="mt-3 inline-block text-cyan-300 underline" href="/portal/admin/task-management">Create or manage tasks</Link>}
 {!tasks.length?<p className="mt-8 rounded-xl bg-[#101F39] p-6">There are no open orders available in your categories.</p>:<div className="mt-7 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">{tasks.map(t=><article key={t.id} className="min-w-0 rounded-2xl border border-white/10 bg-[#101F39] p-6">
 <p className="text-xs font-semibold text-cyan-300">{t.category} · {t.publicTaskId??"Open order"}</p><h2 className="mt-3 text-lg font-bold">{t.title}</h2><p className="mt-3 line-clamp-4 whitespace-pre-wrap break-words text-sm text-slate-300">{t.description}</p>
 <p className="mt-3 text-sm">{t.unitsOrdered?.toString()??"—"} {t.billingUnit?.replaceAll("_"," ").toLowerCase()??"units"} · Rate ${t.unitRate?.toString()??"—"}</p><p className="mt-1 font-bold text-cyan-200">Total order value: ${t.totalOrderCost?.toString()??"—"}</p>
 {employee.role==="TASKER"&&<form action={claimHubTask} className="mt-5"><input type="hidden" name="taskId" value={t.id}/><button className="rounded-xl bg-[#0052CC] px-5 py-3 font-semibold hover:bg-[#003F9E]" type="submit">Claim this task</button></form>}
 </article>)}</div>}
 </div></main>;
}
export default function Page(){return <Suspense fallback={<main className="min-h-screen bg-[#071327] p-8 text-white">Loading Task Hub...</main>}><Hub/></Suspense>}
