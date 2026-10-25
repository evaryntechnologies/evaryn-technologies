import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, ClipboardList, ShieldCheck } from "lucide-react";
import ClientInquiryForm from "@/components/forms/ClientInquiryForm";

export const metadata: Metadata = { title: "Custom Service Request", description: "Tell Evaryn Technologies Limited about a custom project requirement." };

export default function CustomRequestPage() {
  return (
    <main className="min-h-screen bg-[#F3F7FC] text-[#071327] dark:bg-[#071327] dark:text-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#071327] via-[#002B7F] to-[#0052CC] px-6 py-20 text-white">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[url('/watermarks/evaryn-watermark.svg')] bg-right bg-no-repeat opacity-10" />
        <div className="relative mx-auto max-w-7xl">
          <Link href="/services" className="inline-flex items-center gap-2 text-sm font-medium text-cyan-200 hover:text-white"><ArrowLeft size={16} /> Back to Services</Link>
          <p className="mt-9 text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">Custom solutions</p>
          <h1 className="mt-5 text-4xl font-bold md:text-6xl">Need something we don't list?</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">Describe your project and the support you need, even if it does not fall under one of our four core services.</p>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:py-20">
        <div>
          <ClipboardList size={38} className="text-[#0052CC] dark:text-cyan-300" />
          <h2 className="mt-5 text-3xl font-bold">Tell us your requirements</h2>
          <p className="mt-5 leading-8 text-slate-600 dark:text-slate-300">Include the expected volume, desired completion date and any helpful examples. These details will help our team understand the request when submissions are enabled.</p>
          <div className="mt-8 flex gap-3 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-[#101F39]">
            <ShieldCheck className="shrink-0 text-[#0052CC] dark:text-cyan-300" />
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">This preview does not upload files, send emails or store form contents.</p>
          </div>
        </div>
        <Suspense fallback={<div className="rounded-3xl border border-slate-200 bg-white p-8 dark:border-slate-700 dark:bg-[#0C1B33]">Loading request formâ€¦</div>}>
          <ClientInquiryForm kind="custom" />
        </Suspense>
      </section>
    </main>
  );
}

