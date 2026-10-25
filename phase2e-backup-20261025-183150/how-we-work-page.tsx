import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = { title: "How We Work" };
const steps = [
  { name: "Brief", detail: "Tell us about your goals, requirements, timelines and expected deliverables." },
  { name: "Match", detail: "We align your project with skilled professionals in the appropriate service area." },
  { name: "Create", detail: "Our team completes the work using clear instructions and defined standards." },
  { name: "Review", detail: "A reviewer checks the work and requests improvements when necessary." },
  { name: "QA & delivery", detail: "Final quality assurance is completed before delivery to the client." },
];
export default function HowWeWorkPage() {
  return <main className="bg-[#F3F7FC] text-[#071327] dark:bg-[#071327] dark:text-white">
    <section className="bg-gradient-to-br from-[#071327] via-[#002B7F] to-[#0052CC] px-6 py-20 text-white">
      <div className="mx-auto max-w-6xl"><p className="text-sm font-bold uppercase tracking-widest text-cyan-300">Our process</p><h1 className="mt-5 text-4xl font-bold md:text-6xl">How we work</h1><p className="mt-5 max-w-2xl text-lg text-slate-200">A structured workflow from project brief to quality-checked delivery.</p></div>
    </section>
    <section className="mx-auto max-w-6xl px-6 py-16"><div className="grid gap-5 md:grid-cols-2">{steps.map((step, i) => <article key={step.name} className="rounded-2xl border border-slate-200 bg-white p-7 dark:border-slate-700 dark:bg-[#101F39]"><span className="text-sm font-bold text-[#0052CC] dark:text-cyan-300">STEP {String(i+1).padStart(2,"0")}</span><h2 className="mt-3 text-2xl font-bold">{step.name}</h2><p className="mt-4 leading-7 text-slate-600 dark:text-slate-300">{step.detail}</p></article>)}</div><Link href="/contact" className="mt-10 inline-flex items-center gap-2 rounded-xl bg-[#0052CC] px-6 py-4 font-semibold text-white">Request a quote <ArrowRight size={18}/></Link></section>
  </main>;
}
