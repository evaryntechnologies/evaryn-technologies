"use client";

import { useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";
import { services } from "@/lib/services";

type Kind = "contact" | "custom";
const inputStyle = "mt-2 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[#071327] placeholder:text-slate-500 focus:border-[#0052CC] focus:outline-none focus:ring-2 focus:ring-[#00AEEF]/20 dark:border-slate-600 dark:bg-[#101F39] dark:text-white dark:placeholder:text-slate-400";

export default function ClientInquiryForm({ kind }: { kind: Kind }) {
  const params = useSearchParams();
  const requestedService = params.get("service") ?? "";
  const matchingService = services.find((service) => service.title === requestedService);
  const defaultService = matchingService?.title ?? "";
  const [feedback, setFeedback] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Backend intentionally not yet connected. Do not read or send private data here.
    setFeedback(true);
  }

  return (
    <form onSubmit={handleSubmit} onChange={() => setFeedback(false)} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-[#0C1B33] sm:p-9">
      <div className="mb-7 flex items-start gap-3 rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-sm leading-6 text-[#003F7F] dark:border-cyan-900 dark:bg-[#102D4D] dark:text-cyan-100">
        <ShieldCheck className="mt-0.5 shrink-0" size={21} aria-hidden="true" />
        <p>This is a website preview. Forms are not being sent or saved yet. Please do not enter sensitive information.</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm font-semibold">Full name <span className="text-red-600">*</span>
          <input name="name" autoComplete="name" required maxLength={120} className={inputStyle} placeholder="Your full name" />
        </label>
        <label className="block text-sm font-semibold">Email address <span className="text-red-600">*</span>
          <input name="email" type="email" autoComplete="email" required maxLength={254} className={inputStyle} placeholder="you@example.com" />
        </label>
        {kind === "custom" && (
          <label className="block text-sm font-semibold sm:col-span-2">Phone or company (optional)
            <input name="phoneOrCompany" maxLength={160} className={inputStyle} placeholder="Phone number or company name" />
          </label>
        )}
        <label className="block text-sm font-semibold sm:col-span-2">
          {kind === "custom" ? "Closest service area" : "Service needed"} <span className="text-red-600">*</span>
          <select name="service" key={defaultService} defaultValue={defaultService} required className={inputStyle}>
            <option value="">Select a service</option>
            {services.map((service) => <option key={service.slug} value={service.title}>{service.title}</option>)}
            {kind === "custom" && <option value="Something else">Something else</option>}
          </select>
        </label>
        {kind === "custom" && (
          <>
            <label className="block text-sm font-semibold sm:col-span-2">What do you need? <span className="text-red-600">*</span>
              <input name="requestTitle" required maxLength={180} className={inputStyle} placeholder="A short project summary" />
            </label>
            <label className="block text-sm font-semibold">Expected volume <span className="text-red-600">*</span>
              <input name="volume" required maxLength={120} className={inputStyle} placeholder="e.g. 50 pages or 20 hours" />
            </label>
            <label className="block text-sm font-semibold">Needed by <span className="text-red-600">*</span>
              <input name="neededBy" type="date" required className={inputStyle} />
            </label>
            <label className="block text-sm font-semibold sm:col-span-2">Example link (optional)
              <input name="exampleLink" type="url" maxLength={1000} className={inputStyle} placeholder="https://example.com" />
            </label>
          </>
        )}
        <label className="block text-sm font-semibold sm:col-span-2">
          {kind === "custom" ? "Project details" : "Project details"} <span className="text-red-600">*</span>
          <textarea name="details" required minLength={15} maxLength={5000} rows={6} className={inputStyle} placeholder="Describe what you need, your goals and any important requirements." />
        </label>
      </div>
      {feedback && (
        <div role="status" className="mt-6 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100">
          <AlertCircle className="mt-0.5 shrink-0" size={19} aria-hidden="true" />
          <p>Your form is valid, but it has <strong>not been submitted</strong>. Submission will be enabled after we connect secure storage.</p>
        </div>
      )}
      <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
        <p className="text-xs text-slate-500 dark:text-slate-400">Fields marked * are required.</p>
        <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-[#0052CC] px-7 py-3.5 font-semibold text-white transition hover:bg-[#003F9E] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400">
          <CheckCircle2 size={18} aria-hidden="true" /> Check my details
        </button>
      </div>
    </form>
  );
}
