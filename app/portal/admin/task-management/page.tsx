import { BackLink } from "@/app/portal/ui";
import { connection } from "next/server";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";
import { assignTask } from "./actions";
import { publishDraft } from "./publish-actions";
import TaskCostFields from "./TaskCostFields";

const field="mt-2 w-full rounded-xl border border-slate-600 bg-[#071327] px-4 py-3 font-bold text-white";

async function Content({searchParams}:{searchParams:Promise<{message?:string;ok?:string}>}) {
  await connection();
  const user=await requireEmployee(["ADMIN","SUPER_ADMIN","QA"]);
  const profile=await prisma.employeeProfile.findUnique({where:{authUserId:user.id},select:{role:true,status:true}});
  if(!profile || profile.status!=="ACTIVE" || !["ADMIN","SUPER_ADMIN","QA"].includes(profile.role)) return <p>Access denied.</p>;
  const [workers,tasks,params,categories]=await Promise.all([
    prisma.employeeProfile.findMany({where:{status:"ACTIVE",role:"TASKER"},select:{id:true,fullName:true,email:true,eligibleCategories:{select:{categoryId:true}}},orderBy:{fullName:"asc"},take:200}),
    prisma.workTask.findMany({select:{id:true,publicTaskId:true,orderId:true,category:true,title:true,status:true,deadline:true,reviewDeadline:true,qaDeadline:true,assignedTo:{select:{fullName:true}}},orderBy:{createdAt:"desc"},take:30}),
    searchParams,
    prisma.taskCategory.findMany({where:{active:true},select:{id:true,name:true,rate:true,billingUnit:true},orderBy:{name:"asc"}}),
  ]);
  return <main className="min-h-screen bg-[#071327] px-5 py-10 text-white sm:px-10"><div className="w-full max-w-none">
    <BackLink href={profile.role==="QA"?"/portal/qa":"/portal/admin"} label="Dashboard" />
    <h1 className="mt-6 text-3xl font-bold">Task Management</h1>
    {profile.role==="SUPER_ADMIN" && <Link href="/portal/super-admin/categories" className="mt-3 inline-block text-cyan-300 underline">Manage Task Categories</Link>}<p className="mt-2 text-slate-300">Save drafts, publish orders to Task Hub, or assign work directly.</p><Link href="/portal/task-hub" className="mt-3 inline-block text-cyan-300 underline">Open Task Hub</Link> <Link href="/portal/admin/task-summary?tab=closed" className="mt-3 ml-5 inline-block text-cyan-300 underline">Closed tasks / Reinstate</Link>
    {params.message && <p role="status" className="mt-5 rounded-xl border border-white/20 p-4">{params.ok==="1"?"Success: ":"Error: "}{params.message}</p>}
    <section className="mt-7 rounded-2xl border border-white/10 bg-[#101F39] p-6"><h2 className="text-xl font-bold">Create Task</h2>
    <form className="mt-5 grid gap-5 sm:grid-cols-2" action={async(data:FormData)=>{"use server";const result=await assignTask(data);redirect("/portal/admin/task-management?ok="+(result.success?"1":"0")+"&message="+encodeURIComponent(result.message));}}>
      <label>Order ID (external, kept private)<input name="orderId" className={field} placeholder="Enter the original order reference" /></label>
      <TaskCostFields categories={categories.map(c=>({id:c.id,name:c.name,rate:String(c.rate),billingUnit:c.billingUnit}))} workers={workers.map(w=>({id:w.id,fullName:w.fullName,email:w.email,categoryIds:w.eligibleCategories.map(c=>c.categoryId)}))}/>
      <label>Priority<select name="priority" className={field} defaultValue="NORMAL"><option value="LOW">Low</option><option value="NORMAL">Normal</option><option value="HIGH">High</option><option value="URGENT">Urgent</option></select></label>
      <label className="sm:col-span-2">Task title<input required name="title" minLength={3} maxLength={160} className={field}/></label>
      <label className="sm:col-span-2">Instructions<textarea required name="description" minLength={10} maxLength={10000} rows={5} className={field}/></label>
      <label>Submission deadline — hours from now<input required type="number" name="submissionHours" min="0.01" max="8760" step="any" className={field}/></label>
      <label>Review deadline — hours from now<input required type="number" name="reviewHours" min="0.01" max="8760" step="any" className={field}/></label>
      <label>QA deadline — hours from now<input required type="number" name="qaHours" min="0.01" max="8760" step="any" className={field}/></label>
      <label>Reference attachment (max 10 MB)<input name="attachment" type="file" accept=".pdf,.txt,.docx,.xlsx,.png,.jpg,.jpeg" className={field}/></label>
      <div className="sm:col-span-2"><button type="submit" disabled={!categories.length} className="rounded-xl bg-[#0052CC] px-6 py-3 font-bold text-white disabled:opacity-50">Save Task / Publish / Assign</button></div>
    </form></section>
    <section className="mt-8 rounded-2xl border border-white/10 bg-[#101F39] p-6"><h2 className="text-xl font-bold">Recent tasks</h2><div className="mt-5 space-y-3">{tasks.map(t=><article key={t.id} className="rounded-xl border border-white/10 p-4"><div className="font-bold">{t.publicTaskId??t.id} — {t.title}</div><div className="mt-1 text-sm text-slate-300">{t.category??"Uncategorized"} · {t.assignedTo?.fullName??"Unassigned"} · {t.status}</div>{t.status==="DRAFT" && <form action={publishDraft} className="mt-2"><input type="hidden" name="taskId" value={t.id}/><button type="submit" className="rounded-lg bg-[#0052CC] px-4 py-2 text-sm font-semibold">Publish draft to Task Hub</button></form>}<Link href={`/portal/admin/task-management/edit/${t.id}`} className="mt-2 inline-block text-sm text-cyan-300 underline">Edit order details / add files</Link><p className="mt-1 text-xs text-slate-300">External Order ID: {t.orderId||"Not set"}</p><div className="mt-2 flex flex-wrap gap-4 text-xs text-cyan-200">{[{name:"Submission",date:t.deadline},{name:"Review",date:t.reviewDeadline},{name:"QA",date:t.qaDeadline}].map(({name,date})=><span key={String(name)}>{name}: {date instanceof Date?date.toLocaleString("en-KE",{timeZone:"Africa/Nairobi"}):"Not set"}</span>)}</div></article>)}</div></section>
  </div></main>;
}
export default function Page({searchParams}:{searchParams:Promise<{message?:string;ok?:string}>}) {return <Suspense fallback={<main className="min-h-screen bg-[#071327] p-8 text-white">Loading task management...</main>}><Content searchParams={searchParams}/></Suspense>}
