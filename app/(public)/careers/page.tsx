import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarCheck2, ClipboardCheck, Clock3, TrendingUp, Users } from "lucide-react";
import { careers, openCareers } from "@/lib/careers";

export const metadata: Metadata = {
  title: "Careers",
  description: "Explore career opportunities and recruitment at Evaryn Technologies Limited.",
};

const benefits = [
  { title: "Work on your terms", detail: "Project-based opportunities and defined deliverables.", Icon: Clock3 },
  { title: "Twice-monthly pay schedule", detail: "Scheduled payments on the 5th and 20th for eligible completed work.", Icon: CalendarCheck2 },
  { title: "Clear standards", detail: "Defined expectations and quality checks at each stage.", Icon: ClipboardCheck },
  { title: "Room to grow", detail: "Opportunities to develop towards Review and QA roles.", Icon: TrendingUp },
];

export default function CareersPage() {
  return (
    <main className="min-h-screen bg-[#F3F7FC] text-[#071327] dark:bg-[#071327] dark:text-white">
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-[#071327] via-[#002B7F] to-[#0052CC] px-6 py-20 text-white md:py-28">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[url('/watermarks/evaryn-watermark.svg')] bg-right bg-no-repeat opacity-10" />
        <div className="relative mx-auto w-full">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-200">Careers at Evaryn</p>
          <h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">Join the Evaryn team</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">Bring your skills to a team built around innovation, people and progress. Explore what working with Evaryn can look like.</p>
        </div>
      </section>

      <section className="mx-auto w-full px-6 py-16 md:px-8">
        <div className="mb-8 flex items-center gap-3"><Users className="text-[#0052CC] dark:text-cyan-300" /><h2 className="text-3xl font-bold">Why work with us?</h2></div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map(({ title, detail, Icon }) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-[#101F39]">
              <Icon className="text-[#0052CC] dark:text-cyan-300" size={26} aria-hidden="true" />
              <h3 className="mt-5 font-bold">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full px-6 pb-20 md:px-8">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#0052CC] dark:text-cyan-300">Opportunities</p>
        <h2 className="mt-3 text-3xl font-bold">Current openings</h2>
        {openCareers.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-700 dark:bg-[#101F39]" role="status">
            <h3 className="text-xl font-bold">We are not hiring right now.</h3>
            <p className="mt-3 text-slate-600 dark:text-slate-300">Please check this page for future opportunities. Applications are currently closed.</p>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {openCareers.map((job) => (
              <article key={job.slug} className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm dark:border-slate-700 dark:bg-[#101F39]">
                <h3 className="text-xl font-bold">{job.title}</h3><p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">{job.summary}</p>
                <h4 className="mt-6 font-semibold">What we look for</h4>
                <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-slate-600 dark:text-slate-300">{job.requirements.map((item) => <li key={item}>{item}</li>)}</ul>
                <Link href={`/apply?role=${encodeURIComponent(job.slug)}`} className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#0052CC] px-6 py-3 font-semibold text-white hover:bg-[#003F9E]">Apply <ArrowRight size={17} /></Link>
              </article>
            ))}
          </div>
        )}
        <details className="mt-10 rounded-2xl border border-slate-200 p-6 dark:border-slate-700">
          <summary className="cursor-pointer font-semibold">Learn about our professional categories</summary>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {careers.map((job) => <div key={job.slug}><h3 className="font-semibold">{job.title}</h3><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{job.summary}</p></div>)}
          </div>
        </details>
      </section>
    </main>
  );
}
