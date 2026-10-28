import {connection} from "next/server";
import {Suspense} from "react";
import Link from "next/link";
import {requireEmployee} from "@/lib/auth/require-employee";
import {prisma} from "@/lib/db/prisma";
import {cleanTab,statusTab,workTabNames} from "@/lib/tasks/work-tabs";
type Props={searchParams:Promise<{tab?:string}>};
type Session={id:string;startedAt:Date;endedAt:Date|null;activeSeconds:number;rateHourly:unknown};
async function Content({searchParams}:Props){
 await connection();const user=await requireEmployee(["REVIEWER","QA","ADMIN","SUPER_ADMIN"]);
 const person=await prisma.employeeProfile.findUnique({where:{authUserId:user.id},select:{id:true,role:true,status:true}});
 if(!person||person.status!=="ACTIVE")return <p className="p-8">Employee profile unavailable.</p>;
 const tab=cleanTab((await searchParams).tab);
 const [tasks,reviews,sessions]=await Promise.all([
  prisma.workTask.findMany({where:{OR:[{assignedToId:person.id},{claimedReviewerId:person.id},{submissions:{some:{OR:[{employeeId:person.id},{reviews:{some:{reviewerId:person.id}}}]}}}]},select:{id:true,title:true,publicTaskId:true,category:true,status:true,assignedToId:true,claimedReviewerId:true,submissions:{select:{employeeId:true,reviews:{select:{reviewerId:true,stage:true}}}}},orderBy:{updatedAt:"desc"},take:500}),
  prisma.taskReview.findMany({where:{reviewerId:person.id},select:{id:true,stage:true,createdAt:true,submission:{select:{taskId:true}}},orderBy:{createdAt:"desc"},take:500}),
  user.role==="ADMIN"?prisma.$queryRaw<Session[]>`SELECT id,"startedAt","endedAt","activeSeconds","rateHourly" FROM public."AdminTimeSession" WHERE "employeeId"=${person.id}::uuid ORDER BY "startedAt" DESC LIMIT 200`.catch(()=>[] as Session[]):Promise.resolve([] as Session[])
 ]);
 const work=new Map<string,{id:string;title:string;category:string;status:string;type:string}>();
 for(const t of tasks){const id=t.publicTaskId??t.id;
  if(t.assignedToId===person.id||t.submissions.some(s=>s.employeeId===person.id))work.set(t.id+":TASKER",{id:t.id,title:`${id} · ${t.title}`,category:t.category??"Uncategorized",status:t.status,type:"Tasker Task"});
  if(t.claimedReviewerId===person.id||t.submissions.some(s=>s.reviews.some(r=>r.reviewerId===person.id&&r.stage==="REVIEWER")))work.set(t.id+":REVIEWER",{id:t.id,title:`${id} · ${t.title}`,category:t.category??"Uncategorized",status:t.status,type:"Reviewer Task"});
  if(t.submissions.some(s=>s.reviews.some(r=>r.reviewerId===person.id&&r.stage==="QA")))work.set(t.id+":QA",{id:t.id,title:`${id} · ${t.title}`,category:t.category??"Uncategorized",status:t.status,type:"QA Task"});
 }
 // Preserve history of review contributions even if a claim was subsequently reassigned.
 for(const r of reviews){const t=tasks.find(x=>x.id===r.submission.taskId);if(t){const k=t.id+":"+r.stage;if(!work.has(k))work.set(k,{id:t.id,title:`${t.publicTaskId??t.id} · ${t.title}`,category:t.category??"Uncategorized",status:t.status,type:r.stage==="QA"?"QA Task":"Reviewer Task"});}}
 const all=[...work.values()];const chosen=all.filter(x=>tab==="all"||statusTab(x.status)===tab);
 return <main className="min-h-screen bg-[#071327] p-5 text-white sm:p-10"><div className="w-full space-y-5"><h1 className="text-3xl font-bold">{workTabNames[tab]}</h1><p className="text-sm text-slate-300">Work is labeled by the level at which you performed it, including earlier Tasker, Reviewer and QA contributions.</p><nav className="flex flex-wrap gap-2">{(["all","progress","revision","completed","cancelled"] as const).map(t=><Link key={t} href={t==="all"?"/portal/my-work":`/portal/my-work?tab=${t}`} className={`rounded-lg px-3 py-2 text-sm ${tab===t?"bg-[#0052CC]":"bg-[#101F39] text-cyan-200"}`}>{workTabNames[t]} ({t==="all"?all.length:all.filter(x=>statusTab(x.status)===t).length})</Link>)}</nav>
 {chosen.length?<div className="grid gap-3">{chosen.map((w,i)=><article key={`${w.id}-${w.type}-${i}`} className="rounded-xl border border-white/10 bg-[#101F39] p-4"><p className="text-xs font-semibold text-cyan-300">{w.type} · {w.category}</p><h2 className="mt-1 font-semibold">{w.title}</h2><p className="mt-1 text-xs text-slate-300">{w.status.replaceAll("_"," ")}</p><Link href={`/portal/tasks/${w.id}/discussion`} className="mt-2 inline-block text-sm text-cyan-200 underline">Open order discussion</Link></article>)}</div>:<p className="rounded-xl bg-[#101F39] p-5 text-slate-300">No matching work.</p>}
 {user.role==="ADMIN"&&<section className="space-y-3"><h2 className="text-xl font-bold">Admin Task Type · Tracked Time</h2><p className="text-sm text-slate-300">Recorded hours and accrued amount; approval and payment status remain in the existing payroll system.</p>{sessions.map(s=><article key={s.id} className="grid gap-2 rounded-xl bg-[#101F39] p-4 text-sm sm:grid-cols-5"><div>Date: {s.startedAt.toLocaleDateString("en-KE",{timeZone:"Africa/Nairobi"})}</div><div>Start: {s.startedAt.toLocaleTimeString("en-KE",{timeZone:"Africa/Nairobi"})}</div><div>End: {s.endedAt?.toLocaleTimeString("en-KE",{timeZone:"Africa/Nairobi"})??"Active"}</div><div>Tracked: {(s.activeSeconds/3600).toFixed(2)} hours</div><div>Accrued: {((s.activeSeconds/3600)*Number(s.rateHourly)).toFixed(2)}</div></article>)}{!sessions.length&&<p className="text-slate-300">No tracked Admin sessions recorded.</p>}</section>}
 </div></main>;
}
export default function Page(p:Props){return <Suspense fallback={<p className="p-6">Loading your work…</p>}><Content {...p}/></Suspense>}
