import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { prisma } from "@/lib/db/prisma";
import { taskAccess } from "@/lib/tasks/access";
import {sendTaskMessage,requestTaskReassignment} from "./actions";
async function Content({params}:{params:Promise<{taskId:string}>}) {
 await connection();
 const {taskId:id} = await params;
 await connection(); const {person,task,manager}=await taskAccess(id);
 const [messages,requests]=await Promise.all([
 prisma.taskMessage.findMany({where:{taskId:id},include:{sender:{select:{fullName:true,role:true}}},orderBy:{createdAt:"asc"},take:200}),
 prisma.taskReassignmentRequest.findMany({where:{taskId:id,...(manager?{}:{employeeId:person.id})},orderBy:{createdAt:"desc"},take:20})]);
 const canRequest=!manager && task.assignedToId===person.id && ["ASSIGNED","REWORK_REQUIRED"].includes(task.status);
 return <main className="min-h-screen bg-[#071327] px-4 py-8 text-white sm:px-8"><div className="w-full"><Link className="text-cyan-300 underline" href="/portal">Dashboard</Link><h1 className="mt-6 text-3xl font-bold">Task discussion</h1><p className="mt-2 text-slate-300">Clarify work without changing the task status or requesting a revision.</p>
 <section className="mt-6 space-y-3 rounded-xl bg-[#101F39] p-5">{messages.length===0?<p>No messages yet.</p>:messages.map(m=><article key={m.id} className="rounded-lg border border-white/10 p-4"><p className="text-xs text-cyan-200">{person.role==="TASKER" && m.sender.role!=="TASKER"?"Evaryn team":m.sender.fullName} · {m.createdAt.toLocaleString("en-KE",{timeZone:"Africa/Nairobi"})}</p><p className="mt-2 whitespace-pre-wrap break-words">{m.body}</p></article>)}<form action={sendTaskMessage} className="mt-6 space-y-3"><input type="hidden" name="taskId" value={id}/><textarea required minLength={2} maxLength={5000} rows={3} name="body" placeholder="Write a clarification or message…" className="w-full rounded-lg border border-white/20 bg-[#071327] p-3"/><button className="rounded-lg bg-[#0052CC] px-5 py-3 font-semibold">Send message</button></form></section>
 {canRequest&&<section className="mt-7 rounded-xl bg-[#101F39] p-5"><h2 className="text-xl font-bold">Request reassignment of this task</h2><form action={requestTaskReassignment} className="mt-4 space-y-3"><input type="hidden" name="taskId" value={id}/><textarea name="reason" minLength={10} maxLength={3000} required rows={3} className="w-full rounded-lg bg-[#071327] p-3" placeholder="Explain why this task should be reassigned"/><button className="rounded-lg bg-[#0052CC] px-5 py-3 font-semibold">Submit request</button></form></section>}
 {!!requests.length&&<section className="mt-7 rounded-xl bg-[#101F39] p-5"><h2 className="text-lg font-bold">Reassignment requests</h2>{requests.map(r=><p key={r.id} className="mt-3 text-sm">{r.status} — {r.reason} {r.adminNote?`(${r.adminNote})`:""}</p>)}</section>}
 </div></main>;
}
export default async function Page({params}:{params:Promise<{taskId:string}>}){return <Suspense fallback={<p>Loading discussion…</p>}><Content params={params}/></Suspense>}
