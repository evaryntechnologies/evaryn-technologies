import { BackLink } from "@/app/portal/ui";
import {Suspense} from "react";
import {connection} from "next/server";
import Link from "next/link";
import {notFound} from "next/navigation";
import {prisma} from "@/lib/db/prisma";
import {requireEmployee} from "@/lib/auth/require-employee";
import {raiseTaskIssue} from "./actions";
async function Content({params}:{params:Promise<{taskId:string}>}){
 await connection();const {taskId}=await params;const user=await requireEmployee();
 const profile=await prisma.employeeProfile.findUnique({where:{authUserId:user.id},select:{id:true,role:true}});
 if(!profile)notFound();
 const task=await prisma.workTask.findFirst({where:{id:taskId,...(!["QA","ADMIN","SUPER_ADMIN"].includes(profile.role)?{assignedToId:profile.id}:{})},select:{id:true,title:true,assignedToId:true}});
 if(!task)notFound();
 const issues=await prisma.taskDispute.findMany({where:{taskId,...(!["QA","ADMIN","SUPER_ADMIN"].includes(profile.role)?{raisedById:profile.id}:{})},orderBy:{createdAt:"desc"},take:30});
 return <main className="min-h-screen bg-[#071327] px-5 py-8 text-white"><div className="w-full"><BackLink href="/portal" label="Dashboard" /><h1 className="mt-6 text-2xl font-bold">Raise Issue — {task.title}</h1><p className="mt-2 text-slate-300">Disputes are reviewed by QA and management without automatically cancelling the order or sending it back for revision.</p>{task.assignedToId===profile.id&&<form action={raiseTaskIssue} className="mt-7 space-y-3 rounded-xl bg-[#101F39] p-5"><input type="hidden" name="taskId" value={taskId}/><label className="block">Describe your review concern<textarea name="reason" required minLength={15} maxLength={5000} rows={5} className="mt-2 block w-full rounded-lg bg-[#071327] p-3 text-white"/></label><button className="rounded-lg bg-[#0052CC] px-5 py-3">Raise Issue</button></form>}<h2 className="mt-8 text-xl font-semibold">Issue history</h2>{issues.map(i=><article key={i.id} className="mt-3 rounded-xl border border-white/10 p-5"><p className="text-cyan-300">{i.status} · {i.createdAt.toLocaleDateString("en-KE")}</p><p className="mt-2 whitespace-pre-wrap">{i.reason}</p>{i.resolution&&<p className="mt-3 text-emerald-200">Resolution: {i.resolution}</p>}</article>)}{!issues.length&&<p className="mt-3 text-slate-300">No issues raised.</p>}</div></main>;
}
export default function Page({params}:{params:Promise<{taskId:string}>}){return <Suspense fallback={<p>Loading issues...</p>}><Content params={params}/></Suspense>}
