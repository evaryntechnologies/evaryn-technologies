import {connection} from "next/server";
import Link from "next/link";
import {Suspense} from "react";
import {requireEmployee} from "@/lib/auth/require-employee";
import {prisma} from "@/lib/db/prisma";
import {cleanTab,statusTab,workTabNames} from "@/lib/tasks/work-tabs";
type Props={searchParams:Promise<{tab?:string}>};
async function Content({searchParams}:Props){
 await connection(); const user=await requireEmployee(["TASKER","REVIEWER","QA","ADMIN"]);
 const profile=await prisma.employeeProfile.findUnique({where:{authUserId:user.id},select:{id:true,role:true,status:true}});
 if(!profile||profile.status!=="ACTIVE")return <p className="p-8">Your employee profile is unavailable.</p>;
 const tab=cleanTab((await searchParams).tab);
 // Include work the employee actually submitted even if the order has since changed hands.
 const tasks=await prisma.workTask.findMany({where:{OR:[{assignedToId:profile.id},{submissions:{some:{employeeId:profile.id}}}]},select:{id:true,publicTaskId:true,title:true,category:true,description:true,status:true,deadline:true,assignedToId:true,submissions:{where:{employeeId:profile.id},select:{id:true},take:1}},orderBy:{updatedAt:"desc"},take:500});
 const counts={all:tasks.length,progress:0,revision:0,completed:0,cancelled:0};
 for(const task of tasks)counts[statusTab(task.status)]++;
 const chosen=tasks.filter(t=>tab==="all"||statusTab(t.status)===tab);
 return <main className="min-h-screen bg-[#071327] px-5 py-8 text-white sm:px-10"><div className="w-full space-y-5">
 <header><h1 className="text-3xl font-bold">{workTabNames[tab]}</h1><p className="mt-2 text-slate-300">Your current and previously submitted Tasker orders. Task Hub is where unclaimed orders appear.</p></header>
 <div className="flex flex-wrap gap-2">{(["all","progress","revision","completed","cancelled"] as const).map(k=><Link key={k} href={k==="all"?"/portal/tasker/my-tasks":`/portal/tasker/my-tasks?tab=${k}`} className={`rounded-lg px-3 py-2 text-sm ${tab===k?"bg-[#0052CC] text-white":"bg-[#101F39] text-cyan-200"}`}>{workTabNames[k]} ({counts[k]})</Link>)}</div>
 {chosen.length===0?<div className="rounded-xl border border-white/10 bg-[#101F39] p-6 text-slate-300">No orders in this category yet.</div>:<div className="grid gap-3">{chosen.map(task=><article key={task.id} className="rounded-xl border border-white/10 bg-[#101F39] p-5"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-bold">{task.publicTaskId??task.id} · {task.title}</h2><span className="rounded-lg bg-[#0052CC]/30 px-3 py-1 text-xs">{task.status.replaceAll("_"," ")}</span></div><p className="mt-2 text-sm text-cyan-200">Tasker Task · {task.category??"Uncategorized"}</p><p className="mt-2 line-clamp-2 text-sm text-slate-300">{task.description}</p><p className="mt-2 text-xs text-slate-400">{task.deadline?`Due ${task.deadline.toLocaleString("en-KE",{timeZone:"Africa/Nairobi"})}`:"No deadline"}{task.assignedToId!==profile.id?" · Previously worked on this order":""}</p><Link className="mt-3 inline-block text-sm font-semibold text-cyan-300 underline" href={`/portal/tasker/tasks/${task.id}`}>Open order</Link></article>)}</div>}
 </div></main>;
}
export default function Page(p:Props){return <Suspense fallback={<p className="p-6">Loading orders…</p>}><Content {...p}/></Suspense>}
