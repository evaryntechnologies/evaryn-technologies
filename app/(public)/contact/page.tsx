import type { Metadata } from "next";
import { Suspense } from "react";
import { Mail, MapPin, MessageCircle } from "lucide-react";
import ClientInquiryForm from "@/components/forms/ClientInquiryForm";

export const metadata: Metadata = { title: "Contact Us", description: "Contact Evaryn Technologies Limited about our professional services." };

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#F3F7FC] text-[#071327] dark:bg-[#071327] dark:text-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#071327] via-[#002B7F] to-[#0052CC] px-6 py-20 text-white">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[url('/watermarks/evaryn-watermark.svg')] bg-right bg-no-repeat opacity-10" />
        <div className="relative mx-auto w-full">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">Connect with Evaryn</p>
          <h1 className="mt-5 text-4xl font-bold md:text-6xl">Let's talk about your project.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">Tell us what you need, and we will be ready to discuss how our team can help once inquiries are enabled.</p>
        </div>
      </section>
      <section className="mx-auto grid w-full gap-10 px-6 py-16 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:py-20">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-[#0052CC] dark:text-cyan-300">Contact details</p>
          <h2 className="mt-4 text-3xl font-bold">Start a conversation</h2>
          <p className="mt-5 leading-8 text-slate-600 dark:text-slate-300">Describe your service needs clearly. This page is being prepared for live client inquiries.</p>
          <div className="mt-8 space-y-5">
            <div className="flex items-start gap-4"><MapPin className="mt-1 shrink-0 text-[#0052CC] dark:text-cyan-300" /><div><p className="font-semibold">Nairobi, Kenya</p><p className="text-sm text-slate-600 dark:text-slate-300">Serving clients online worldwide</p></div></div>
            <div className="flex items-start gap-4"><Mail className="mt-1 shrink-0 text-[#0052CC] dark:text-cyan-300" /><div><p className="font-semibold">Service inquiries</p><p className="text-sm text-slate-600 dark:text-slate-300">Use the form when submissions become available</p></div></div>
            <div className="flex items-start gap-4"><MessageCircle className="mt-1 shrink-0 text-[#0052CC] dark:text-cyan-300" /><div><p className="font-semibold">Custom requirements?</p><a href="/custom-request" className="text-sm font-medium text-[#0052CC] underline dark:text-cyan-300">View the custom request form</a></div></div>
          </div>
        </div>
        <Suspense fallback={<div className="rounded-3xl border border-slate-200 bg-white p-8 dark:border-slate-700 dark:bg-[#0C1B33]">Loading inquiry formâ€¦</div>}>
          <ClientInquiryForm kind="contact" />
        </Suspense>
      </section>
    </main>
  );
}

