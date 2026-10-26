import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";
import { reinstateOrder, closeReinstatedOrder } from "./actions";

const inputClass = "rounded-lg border border-slate-500 bg-[#071327] px-3 py-2 text-white";
async function Content({searchParams}:{searchParams:Promise<{message?:string;ok?:string}>}) {
  await connection();
  const user=await requireEmployee(["ADMIN","SUPER_ADMIN"]);
  const profile=await prisma.employeeProfile.findUnique({where:{authUserId:user.id},select:{status:true,role:true}});
  if(!profile || profile.status!=="ACTIVE" || !["ADMIN","SUPER_ADMIN"].includes(profile.role)) return <p>Access denied.</p>;
  const [closed,reinstated,workers,params]=await Promise.all([
    prisma.workTask.findMany({where:{status:{in:["COMPLETED","CANCELED"]}},select:{id:true,publicTaskId:true,title:true,category:true,status:true,reinstatementCount:true},orderBy:{updatedAt:"desc"},take:100}),
    prisma.workTask.findMany({where:{reinstatedAt:{not:null},status:{notIn:["COMPLETED","CANCELED"]}},select:{id:true,publicTaskId:true,title:true,status:true,category:true,assignedTo:{select:{fullName:true}}},orderBy:{updatedAt:"desc"},take:100}),
    prisma.employeeProfile.findMany({where:{status:"ACTIVE",role:"TASKER"},select:{id:true,fullName:true,eligibleCategories:{select:{category:{select:{name:true,active:true}}}}},orderBy:{fullName:"asc"},take:500}),
    searchParams,
  ]);
  const action = async (form:FormData) => {"use server"; const result=await reinstateOrder(form);redirect("/portal/admin/order-reinstatement?ok="+(result.success?"1":"0")+"&message="+encodeURIComponent(result.message));};
  const close = async (form:FormData) => {"use server"; const result=await closeReinstatedOrder(form);redirect("/portal/admin/order-reinstatement?ok="+(result.success?"1":"0")+"&message="+encodeURIComponent(result.message));};
  return <main className="min-h-screen bg-[#071327] px-4 py-8 text-white sm:px-8"><div className="w-full max-w-none">
    <Link href={profile.role==="SUPER_ADMIN"?"/portal/super-admin":"/portal/admin"} className="text-cyan-300 underline">Back to dashboard</Link>
    <h1 className="mt-5 text-3xl font-bold">Order Reinstatement</h1>
    <p className="mt-2 text-slate-300">Admins and Super Admins can reopen completed or canceled orders, send them to Task Hub, or reassign to an eligible Tasker. Existing submissions and reviews remain in history.</p>
    {params.message && <p role="status" className="mt-5 rounded-xl border border-white/20 p-3">{params.ok==="1"?"Success: ":"Error: "}{params.message}</p>}
    <section className="mt-8"><h2 className="mb-4 text-xl font-semibold">Completed and canceled orders</h2><div className="grid gap-4 lg:grid-cols-2">{closed.map(t=><article key={t.id} className="rounded-xl border border-white/10 bg-[#101F39] p-5"><h3 className="font-bold">{t.publicTaskId??t.id} — {t.title}</h3><p className="my-2 text-sm text-slate-300">{t.category??"No category"} · {t.status} · Reinstated {t.reinstatementCount} time(s)</p><form action={action} className="flex flex-wrap items-center gap-3"><input type="hidden" name="taskId" value={t.id}/><select className={inputClass} name="mode" defaultValue="OPEN"><option value="OPEN">Publish to Task Hub</option><option value="ASSIGN">Assign directly</option></select><select className={inputClass} name="workerId" defaultValue=""><option value="">Select eligible Tasker (for assignment)</option>{workers.filter(w=>w.eligibleCategories.some(c=>c.category.active&&c.category.name===t.category)).map(w=><option key={w.id} value={w.id}>{w.fullName}</option>)}</select><button className="rounded-lg bg-[#0052CC] px-4 py-2 font-semibold">Reinstate order</button></form></article>)}{closed.length===0&&<p className="text-slate-300">No completed or canceled orders.</p>}</div></section>
    <section className="mt-10"><h2 className="mb-4 text-xl font-semibold">Active reinstated orders</h2><div className="grid gap-4 lg:grid-cols-2">{reinstated.map(t=><article key={t.id} className="rounded-xl border border-white/10 bg-[#101F39] p-5"><h3 className="font-bold">{t.publicTaskId??t.id} — {t.title}</h3><p className="my-2 text-sm text-slate-300">{t.category} · {t.status} · {t.assignedTo?.fullName??"Unassigned"}</p><form action={close} className="flex flex-wrap gap-3"><input type="hidden" name="taskId" value={t.id}/><button name="outcome" value="COMPLETED" className="rounded-lg bg-[#0052CC] px-4 py-2">Mark completed</button><button name="outcome" value="CANCELED" className="rounded-lg border border-white/30 px-4 py-2">Cancel order</button></form></article>)}{reinstated.length===0&&<p className="text-slate-300">No active reinstated orders.</p>}</div></section>
  </div></main>;
}
export default function Page({searchParams}:{searchParams:Promise<{message?:string;ok?:string}>}) {return <Suspense fallback={<main className="p-8">Loading orders...</main>}><Content searchParams={searchParams}/></Suspense>}
