import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";
import { updateOrderDetails } from "../actions";
const field="mt-2 w-full rounded-lg border border-slate-600 bg-[#071327] px-3 py-3 text-white";
async function Content({params,searchParams}:{params:Promise<{taskId:string}>,searchParams:Promise<{message?:string;ok?:string}>}){
 await connection();
 const auth=await requireEmployee(["ADMIN","SUPER_ADMIN"]);
 const manager=await prisma.employeeProfile.findUnique({where:{authUserId:auth.id},select:{role:true,status:true}});
 if(!manager || manager.status!=="ACTIVE" || !["ADMIN","SUPER_ADMIN"].includes(manager.role)) return <p>Access denied.</p>;
 const [{taskId},query]=await Promise.all([params,searchParams]);
 const task=await prisma.workTask.findUnique({where:{id:taskId},include:{extraAttachments:{orderBy:{createdAt:"desc"}},_count:{select:{submissions:true}}}});
 if(!task) return <p className="p-6">Order not found.</p>;
 const editable=["DRAFT","OPEN","ASSIGNED","CLAIMED","IN_PROGRESS"].includes(task.status)&&task._count.submissions===0;
 const save=async (form:FormData)=>{"use server";const result=await updateOrderDetails(form);redirect(`/portal/admin/task-management/edit/${taskId}?ok=${result.success?"1":"0"}&message=${encodeURIComponent(result.message)}`);};
 return <main className="min-h-screen bg-[#071327] px-4 py-8 text-white sm:px-8"><div className="w-full">
  <Link href="/portal/admin/task-management" className="text-cyan-300 underline">Back to Task Management</Link>
  <h1 className="mt-5 text-3xl font-bold">Edit Order Details</h1>
  <p className="mt-2 text-slate-300">{task.publicTaskId??task.id} · {task.status} · {task.category??"Uncategorized"}</p>
  {query.message&&<p role="status" className="mt-4 rounded-xl border border-white/20 p-4">{query.ok==="1"?"Saved: ":"Not saved: "}{query.message}</p>}
  {!editable?<p className="mt-6 rounded-xl border border-amber-500/30 p-4 text-amber-200">This order already has a submission or is no longer editable. Its details and files are retained for history.</p>:<form action={save} className="mt-7 grid gap-5 rounded-2xl border border-white/10 bg-[#101F39] p-6 md:grid-cols-2">
   <input type="hidden" name="taskId" value={task.id}/>
   <label className="md:col-span-2">Task title<input required name="title" minLength={3} maxLength={160} className={field} defaultValue={task.title}/></label>
   <label className="md:col-span-2">Order details<textarea required name="description" minLength={10} maxLength={10000} rows={5} className={field} defaultValue={task.description}/></label>
   <label className="md:col-span-2">Additional instructions<textarea name="instructions" maxLength={10000} rows={4} className={field} defaultValue={task.instructions??""}/></label>
   <label>Priority<select name="priority" defaultValue={task.priority} className={field}>{["LOW","NORMAL","HIGH","URGENT"].map(v=><option key={v} value={v}>{v}</option>)}</select></label>
   <label>Additional file (max 10 MB)<input className={field} type="file" name="attachment" accept=".pdf,.txt,.docx,.xlsx,.png,.jpg,.jpeg"/></label>
   <label>Submission duration (hours)<input className={field} name="submissionHours" type="number" min="0.01" max="8760" step="any" defaultValue={task.submissionHours??""}/></label>
   <label>Review duration (hours)<input className={field} name="reviewHours" type="number" min="0.01" max="8760" step="any" defaultValue={task.reviewHours??""}/></label>
   <label>QA duration (hours)<input className={field} name="qaHours" type="number" min="0.01" max="8760" step="any" defaultValue={task.qaHours??""}/></label>
   <div className="md:col-span-2"><button type="submit" className="rounded-xl bg-[#0052CC] px-6 py-3 font-semibold">Save Order Updates</button></div>
  </form>}
  <section className="mt-8 rounded-xl border border-white/10 p-5"><h2 className="text-xl font-semibold">Order files</h2>
   {task.attachmentKey&&<p className="mt-3"><a href={`/portal/attachments/${task.id}`} className="text-cyan-300 underline">Original reference attachment: {task.attachmentName??"Download"}</a></p>}
   {task.extraAttachments.map(file=><p className="mt-3" key={file.id}><a href={`/portal/attachments/${task.id}/extra/${file.id}`} className="text-cyan-300 underline">{file.fileName}</a> <span className="text-xs text-slate-400">({file.createdAt.toLocaleDateString("en-KE")})</span></p>)}
   {!task.attachmentKey&&task.extraAttachments.length===0&&<p className="mt-3 text-slate-300">No files attached.</p>}
  </section>
 </div></main>;
}
export default function Page({params,searchParams}:{params:Promise<{taskId:string}>,searchParams:Promise<{message?:string;ok?:string}>}){return <Suspense fallback={<main className="p-8">Loading order details...</main>}><Content params={params} searchParams={searchParams}/></Suspense>}
