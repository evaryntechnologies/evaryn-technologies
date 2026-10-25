import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Clock3, PenTool, Users } from "lucide-react";

export const metadata: Metadata = { title: "Why Evaryn" };
const reasons = [
  { title: "Two-stage quality check", desc: "Review and QA checkpoints are built into our delivery workflow.", Icon: ShieldCheck },
  { title: "On-time delivery", desc: "Clear completion windows and active coordination keep work moving.", Icon: Clock3 },
  { title: "Original human-crafted work", desc: "We prioritize original work and apply checks for inappropriate AI-generated text.", Icon: PenTool },
  { title: "Accountable rated teams", desc: "Structured feedback and performance ratings support accountability.", Icon: Users },
];
const values = [
  { title: "Innovation", desc: "We improve how work is organized and delivered." },
  { title: "People", desc: "We invest in the skilled professionals behind every service." },
  { title: "Progress", desc: "We focus on dependable results and continuous improvement." },
];
export default function WhyEvarynPage() {
  return <main className="bg-[#F3F7FC] text-[#071327] dark:bg-[#071327] dark:text-white">
    <section className="bg-gradient-to-br from-[#071327] via-[#002B7F] to-[#0052CC] px-6 py-20 text-white"><div className="mx-auto max-w-6xl"><p className="text-sm font-bold uppercase tracking-widest text-cyan-300">Our difference</p><h1 className="mt-5 text-4xl font-bold md:text-6xl">Why Evaryn</h1><p className="mt-5 max-w-2xl text-lg text-slate-200">Innovation. People. Progress.</p></div></section>
    <section className="mx-auto max-w-6xl px-6 py-16"><h2 className="text-3xl font-bold">Built for quality and accountability</h2><div className="mt-8 grid gap-5 md:grid-cols-2">{reasons.map(({title,desc,Icon}) => <article key={title} className="rounded-2xl border border-slate-200 bg-white p-7 dark:border-slate-700 dark:bg-[#101F39]"><Icon size={29} className="text-[#0052CC] dark:text-cyan-300"/><h3 className="mt-5 text-xl font-bold">{title}</h3><p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">{desc}</p></article>)}</div><h2 className="mt-16 text-3xl font-bold">Our values</h2><div className="mt-8 grid gap-5 md:grid-cols-3">{values.map(value => <article key={value.title} className="rounded-2xl bg-[#002B7F] p-7 text-white"><h3 className="text-2xl font-bold">{value.title}</h3><p className="mt-3 leading-7 text-slate-200">{value.desc}</p></article>)}</div><Link href="/services" className="mt-10 inline-flex items-center gap-2 font-semibold text-[#0052CC] dark:text-cyan-300">Explore our services <ArrowRight size={18}/></Link></section>
  </main>;
}
