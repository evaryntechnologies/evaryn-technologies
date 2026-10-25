"use client";

import { useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { careers, openCareers } from "@/lib/careers";

const inputClass = "mt-2 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[#071327] placeholder:text-slate-400 focus:border-[#0052CC] focus:outline-none dark:border-slate-600 dark:bg-[#101F39] dark:text-white";

export default function ApplicationPreview() {
  const searchParams = useSearchParams();
  const selectedSlug = searchParams.get("role") ?? "";
  const [role, setRole] = useState(() => openCareers.some((job) => job.slug === selectedSlug) ? selectedSlug : "");
  const [cvName, setCvName] = useState("");
  const [notice, setNotice] = useState("");
  const canApply = openCareers.length > 0;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("Preview only: this application has not been sent or saved. Applications will be enabled after secure recruitment storage is connected.");
  }

  if (!canApply) return (
    <div role="status" className="rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-700 dark:bg-[#101F39]">
      <h2 className="text-xl font-bold">Applications are currently closed</h2>
      <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">There are no open roles at this time. The application form will become available once recruitment opens.</p>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-[#101F39] sm:grid-cols-2 md:p-9">
      <div><label htmlFor="app-name" className="font-medium">Full name *</label><input id="app-name" name="name" required maxLength={150} autoComplete="name" className={inputClass} /></div>
      <div><label htmlFor="app-email" className="font-medium">Email address *</label><input id="app-email" name="email" type="email" required autoComplete="email" className={inputClass} /></div>
      <div><label htmlFor="app-phone" className="font-medium">Phone number *</label><input id="app-phone" name="phone" type="tel" required autoComplete="tel" className={inputClass} /></div>
      <div><label htmlFor="app-role" className="font-medium">Role *</label><select id="app-role" name="role" value={role} onChange={(e) => setRole(e.target.value)} required className={inputClass}><option value="">Select a role</option>{openCareers.map((job) => <option key={job.slug} value={job.slug}>{job.title}</option>)}</select></div>
      <div><label htmlFor="app-experience" className="font-medium">Experience *</label><select id="app-experience" name="experience" required defaultValue="" className={inputClass}><option value="">Select experience</option><option value="0-1">Less than 1 year</option><option value="1-3">1â€“3 years</option><option value="3-5">3â€“5 years</option><option value="5+">More than 5 years</option></select></div>
      <div><label htmlFor="app-portfolio" className="font-medium">Portfolio link</label><input id="app-portfolio" name="portfolio" type="url" placeholder="https://" className={inputClass} /></div>
      <div className="sm:col-span-2"><label htmlFor="app-note" className="font-medium">Short note *</label><textarea id="app-note" name="note" required rows={5} maxLength={3000} className={inputClass} placeholder="Briefly introduce yourself and your relevant skills." /></div>
      <div className="sm:col-span-2"><label htmlFor="app-cv" className="font-medium">CV (optional)</label><input id="app-cv" name="cv" type="file" accept=".pdf,.doc,.docx" onChange={(e) => { const f = e.target.files?.[0]; if (f && f.size > 5 * 1024 * 1024) { e.target.value = ""; setCvName("File exceeds 5 MB; select a smaller file."); } else { setCvName(f?.name ?? ""); } }} className={inputClass} /><p className="mt-2 text-xs text-slate-500 dark:text-slate-400">PDF, DOC or DOCX, up to 5 MB. File selection does not upload the CV.</p>{cvName && <p className="mt-1 text-sm" role="status">{cvName}</p>}</div>
      <div className="sm:col-span-2"><p className="mb-4 text-sm text-amber-700 dark:text-amber-300">Preview mode: submitting this form will not save or send your information.</p><button type="submit" className="rounded-xl bg-[#0052CC] px-7 py-4 font-semibold text-white hover:bg-[#003F9E]">Preview application validation</button>{notice && <p role="status" className="mt-4 rounded-xl bg-cyan-50 p-4 text-sm text-[#071327] dark:bg-[#17365B] dark:text-white">{notice}</p>}</div>
    </form>
  );
}
