import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ClipboardList, UsersRound, PenLine, ScanSearch, BadgeCheck, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "How We Work",
  description: "See Evaryn Technologies Limited's five-step process: Brief, Match, Create, Review, and QA & delivery.",
};

const steps = [
  { number: "01", title: "Brief", Icon: ClipboardList, description: "Tell us about your goals, requirements, timelines and expected deliverables.", points: ["Understand the project scope", "Clarify expectations and priorities"] },
  { number: "02", title: "Match", Icon: UsersRound, description: "We align your project with people whose skills fit the work and its requirements.", points: ["Choose the appropriate service team", "Confirm instructions and responsibilities"] },
  { number: "03", title: "Create", Icon: PenLine, description: "Our team carries out the work using the agreed brief, deliverables and standards.", points: ["Work to the project brief", "Maintain clear project communication"] },
  { number: "04", title: "Review", Icon: ScanSearch, description: "A separate review stage checks the work and identifies any improvements needed.", points: ["Evaluate accuracy and completeness", "Request revisions where necessary"] },
  { number: "05", title: "QA & delivery", Icon: BadgeCheck, description: "Final quality assurance takes place before the work is prepared for client delivery.", points: ["Perform final quality checks", "Prepare the approved deliverables"] },
];

export default function HowWeWorkPage() {
  return (
    <main className="bg-[#F3F7FC] text-[#071327] dark:bg-[#071327] dark:text-white">
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-[#071327] via-[#002B7F] to-[#0052CC] px-6 py-20 text-white md:py-28">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[url('/watermarks/evaryn-watermark.svg')] bg-right bg-no-repeat opacity-15" />
        <div className="relative mx-auto w-full max-w-[1400px]">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">Our delivery process</p>
          <h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">How we work</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">Five clear steps connect your brief to reviewed, quality-checked deliverables.</p>
          <a href="#process" className="mt-8 inline-flex items-center gap-2 rounded-xl border border-white/40 px-6 py-3 font-semibold text-white hover:bg-white/10">Explore the process <ArrowRight size={18} /></a>
        </div>
      </section>

      <section id="process" className="mx-auto w-full max-w-[1400px] scroll-mt-24 px-6 py-20 md:px-8">
        <div className="mb-12 max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-widest text-[#0052CC] dark:text-cyan-300">A structured approach</p>
          <h2 className="mt-4 text-3xl font-bold md:text-4xl">From idea to delivery</h2>
          <p className="mt-4 leading-7 text-slate-600 dark:text-slate-300">Every stage has a purpose. Clear responsibilities and checkpoints support reliable project work.</p>
        </div>
        <ol className="relative space-y-5 before:absolute before:bottom-10 before:left-[25px] before:top-10 before:hidden before:w-px before:bg-[#00AEEF]/40 md:before:block">
          {steps.map(({ number, title, Icon, description, points }) => (
            <li key={number} className="relative md:pl-20">
              <span aria-hidden="true" className="absolute left-1 top-8 z-10 hidden h-11 w-11 items-center justify-center rounded-full border-4 border-[#F3F7FC] bg-[#0052CC] text-xs font-bold text-white dark:border-[#071327] md:flex">{number}</span>
              <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-[#101F39] md:p-9">
                <div className="flex items-start gap-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#E7F6FF] text-[#0052CC] dark:bg-[#18385D] dark:text-cyan-300"><Icon size={24} /></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-widest text-[#0052CC] dark:text-cyan-300">Step {number}</p>
                    <h3 className="mt-2 text-2xl font-bold">{title}</h3>
                    <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">{description}</p>
                    <ul className="mt-5 grid gap-3 text-sm sm:grid-cols-2">{points.map((point) => <li key={point} className="flex items-start gap-2"><CheckCircle2 size={17} className="mt-0.5 shrink-0 text-[#00AEEF]" /><span>{point}</span></li>)}</ul>
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ol>
      </section>
      <section className="bg-white px-6 py-16 text-center dark:bg-[#101F39]">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold">Ready to discuss your project?</h2>
          <p className="mt-4 leading-7 text-slate-600 dark:text-slate-300">Share your requirements and let us understand the scope of work.</p>
          <Link href="/contact" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#0052CC] px-7 py-4 font-semibold text-white hover:bg-[#003F9E]">Request a quote <ArrowRight size={18} /></Link>
        </div>
      </section>
    </main>
  );
}
