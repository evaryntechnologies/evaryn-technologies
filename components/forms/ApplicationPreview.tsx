"use client";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { submitApplication } from "@/app/(public)/apply/actions";
import { careers } from "@/lib/careers";
const field="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[#071327] dark:bg-[#101F39] dark:text-white";
export default function ApplicationPreview({openSlugs}:{openSlugs:string[]}) {
 const [state,action,pending]=useActionState(submitApplication,{success:false,message:""});
 const params=useSearchParams();
 const active=careers.filter(job=>openSlugs.includes(job.slug));
 if(state.success) return <p role="status" className="rounded-xl bg-emerald-50 p-6 text-emerald-950">{state.message}</p>;
 if(!active.length) return <p className="rounded-xl bg-white p-6 text-[#071327]">Applications are currently closed.</p>;
 return <form action={action} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 text-[#071327] sm:grid-cols-2 dark:border-slate-700 dark:bg-[#101F39] dark:text-white">
   <input name="companyWebsite" autoComplete="off" tabIndex={-1} aria-hidden="true" className="absolute -left-[9999px]" />
   <label>Full name *<input name="name" required minLength={2} maxLength={150} className={field}/></label>
   <label>Email *<input type="email" name="email" required maxLength={254} className={field}/></label>
   <label>Phone *<input name="phone" required minLength={6} maxLength={50} className={field}/></label>
   <label>Role *<select name="role" required defaultValue={active.some(a=>a.slug===params.get("role"))?params.get("role")??"":""} className={field}><option value="">Select a role</option>{active.map(job=><option key={job.slug} value={job.slug}>{job.title}</option>)}</select></label>
   <label>Experience *<select name="experience" required defaultValue="" className={field}><option value="">Select</option><option value="0-1">Under 1 year</option><option value="1-3">1–3 years</option><option value="3-5">3–5 years</option><option value="5+">5+ years</option></select></label>
   <label>Portfolio URL<input name="portfolio" type="url" className={field}/></label>
   <label className="sm:col-span-2">Relevant experience *<textarea name="note" required minLength={20} maxLength={3000} rows={5} className={field}/></label>
   <p className="sm:col-span-2 text-xs">CV upload is not enabled yet; include a portfolio URL where possible. Do not enter identification numbers or banking information.</p>
   {state.message&&<p role="alert" className="sm:col-span-2 text-amber-600">{state.message}</p>}
   <button disabled={pending} className="rounded-xl bg-[#0052CC] px-6 py-3 font-semibold text-white disabled:opacity-60">{pending?"Submitting…":"Submit application"}</button>
 </form>;
}
