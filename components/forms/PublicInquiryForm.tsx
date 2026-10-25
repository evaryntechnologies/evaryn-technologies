"use client";

import { useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { services } from "@/lib/services";
import { careers } from "@/lib/careers";

type Kind = "contact" | "custom" | "apply";
const fieldClass = "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[#071327] placeholder:text-slate-500 focus:border-[#0052CC] dark:border-slate-600 dark:bg-[#101F39] dark:text-white";
function Input({ label, name, type="text", required=false, placeholder }: { label:string; name:string; type?:string; required?:boolean; placeholder?:string }) {
  return <label className="block text-sm font-semibold">{label}{required && <span className="text-[#0052CC] dark:text-cyan-300"> *</span>}<input className={fieldClass} name={name} type={type} required={required} placeholder={placeholder}/></label>;
}
export default function PublicInquiryForm({ kind }: {kind:Kind}) {
  const params = useSearchParams();
  const serviceParam = params.get("service") ?? "";
  const roleParam = params.get("role") ?? "";
  const [message, setMessage] = useState("");
  const openRoles = careers.filter(job => job.isOpen);
  const serviceDefault = services.some(s=>s.title===serviceParam) ? serviceParam : "";
  const roleDefault = openRoles.some(r=>r.title===roleParam) ? roleParam : "";
  function submit(e:FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Deliberately no fake successful submission: persistence comes in the database phase.
    setMessage("This form is currently a preview. Your information has not been sent or saved. Submission will be enabled after we connect the secure database.");
  }
  return <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-[#101F39] sm:p-9">
    <p className="mb-7 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">Preview form â€” do not enter sensitive information. Submissions are not connected to a database yet.</p>
    <div className="grid gap-5 sm:grid-cols-2">
      <Input label="Full name" name="name" required />
      <Input label="Email address" name="email" type="email" required />
      {kind === "custom" && <Input label="Phone or company (optional)" name="phoneOrCompany" />}
      {kind === "apply" && <Input label="Phone number" name="phone" required />}
      {kind === "custom" && <Input label="Expected volume" name="volume" />}
      {kind === "custom" && <Input label="Needed by" name="neededBy" type="date" />}
      {kind === "apply" && <Input label="Portfolio link" name="portfolio" type="url" />}
      {kind === "custom" && <Input label="Example link (optional)" name="example" type="url" />}
    </div>
    {kind === "apply" ? <label className="mt-5 block text-sm font-semibold">Position *<select name="role" required defaultValue={roleDefault} className={fieldClass}><option value="">Select an open role</option>{openRoles.map(job=><option key={job.slug} value={job.title}>{job.title}</option>)}</select></label> : <label className="mt-5 block text-sm font-semibold">{kind === "custom" ? "Closest service area" : "Service needed"} *<select key={serviceDefault} name="service" defaultValue={serviceDefault} required className={fieldClass}><option value="">Select a service</option>{services.map(service=><option key={service.slug} value={service.title}>{service.title}</option>)}{kind === "custom" && <option value="Something else">Something else</option>}</select></label>}
    {kind === "apply" && <label className="mt-5 block text-sm font-semibold">Experience band *<select className={fieldClass} name="experience" required defaultValue=""><option value="">Select experience</option><option value="0-1">0â€“1 years</option><option value="2-3">2â€“3 years</option><option value="4+">4+ years</option></select></label>}
    {kind === "custom" && <Input label="What do you need?" name="requestTitle" required />}
    <label className="mt-5 block text-sm font-semibold">{kind === "apply" ? "Short note" : kind === "custom" ? "Project details" : "Tell us about your project"} *<textarea className={fieldClass} rows={6} name="details" required placeholder="Describe your requirements"/></label>
    {kind === "apply" && <label className="mt-5 block text-sm font-semibold">CV (optional)<input name="cv" type="file" accept=".pdf,.doc,.docx" className={fieldClass}/></label>}
    <button type="submit" disabled={kind === "apply" && openRoles.length === 0} className="mt-7 rounded-xl bg-[#0052CC] px-7 py-4 font-semibold text-white transition hover:bg-[#003F9E] disabled:cursor-not-allowed disabled:opacity-50">{kind === "apply" ? "Preview application" : "Preview request"}</button>
    {kind === "apply" && openRoles.length===0 && <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">Applications are currently closed.</p>}
    {message && <p role="status" className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">{message}</p>}
  </form>;
}

