import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Clock3, PenTool, UsersRound, Lightbulb, HeartHandshake, TrendingUp, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Why Evaryn",
  description: "Discover Evaryn's commitments to quality, timeliness, original work and accountable teams, guided by Innovation, People and Progress.",
};

const commitments = [
  { title: "Two-stage quality check", Icon: ShieldCheck, description: "Work moves through review and final quality assurance before delivery." },
  { title: "On-time delivery", Icon: Clock3, description: "Clear completion windows and active coordination help keep work on schedule." },
  { title: "Original, human-crafted work", Icon: PenTool, description: "We emphasize original work and include checks for inappropriate AI-generated text." },
  { title: "Accountable, rated teams", Icon: UsersRound, description: "Structured feedback and performance ratings help reinforce responsibility." },
];
const values = [
  { title: "Innovation", Icon: Lightbulb, description: "We seek practical, thoughtful ways to solve client challenges and improve workflows." },
  { title: "People", Icon: HeartHandshake, description: "We value skilled professionals, collaboration and clear communication." },
  { title: "Progress", Icon: TrendingUp, description: "We learn, refine our standards and work toward better outcomes over time." },
];

export default function WhyEvarynPage() {
  return (
    <main className="bg-[#F3F7FC] text-[#071327] dark:bg-[#071327] dark:text-white">
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-[#071327] via-[#002B7F] to-[#0052CC] px-6 py-20 text-white md:py-28">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[url('/watermarks/evaryn-watermark.svg')] bg-right bg-no-repeat opacity-15" />
        <div className="relative mx-auto max-w-7xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">The Evaryn difference</p>
          <h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">Why Evaryn?</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">Innovation. People. Progress. More than a tagline, these ideas shape how we approach work and quality.</p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-6 py-20 md:px-8">
        <p className="text-sm font-bold uppercase tracking-widest text-[#0052CC] dark:text-cyan-300">Our commitments</p>
        <h2 className="mt-4 text-3xl font-bold md:text-4xl">Quality at every stage</h2>
        <p className="mt-4 max-w-2xl leading-7 text-slate-600 dark:text-slate-300">These principles guide the way we organize, review and deliver project work.</p>
        <div className="mt-11 grid gap-6 md:grid-cols-2">
          {commitments.map(({ title, description, Icon }) => (
            <article key={title} className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm dark:border-slate-700 dark:bg-[#101F39] md:p-9">
              <div className="flex h-13 w-13 items-center justify-center rounded-xl bg-[#E7F6FF] text-[#0052CC] dark:bg-[#18385D] dark:text-cyan-300"><Icon size={26} /></div>
              <h3 className="mt-6 text-xl font-bold">{title}</h3>
              <p className="mt-4 leading-7 text-slate-600 dark:text-slate-300">{description}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="bg-white px-6 py-20 dark:bg-[#0C1B33] md:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-bold uppercase tracking-widest text-[#0052CC] dark:text-cyan-300">What drives us</p>
          <h2 className="mt-4 text-3xl font-bold md:text-4xl">Our three core values</h2>
          <div className="mt-11 grid gap-6 md:grid-cols-3">
            {values.map(({ title, description, Icon }) => (
              <article key={title} className="rounded-2xl border border-slate-200 bg-[#F3F7FC] p-7 dark:border-slate-700 dark:bg-[#101F39]">
                <Icon size={28} className="text-[#0052CC] dark:text-cyan-300" />
                <h3 className="mt-6 text-2xl font-bold">{title}</h3>
                <p className="mt-4 leading-7 text-slate-600 dark:text-slate-300">{description}</p>
                <div className="mt-7 flex items-center gap-2 text-sm font-semibold text-[#0052CC] dark:text-cyan-300"><CheckCircle2 size={17} /> Evaryn commitment</div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="px-6 py-20 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 rounded-3xl bg-gradient-to-r from-[#071327] to-[#002B7F] p-9 text-white md:flex-row md:items-center md:p-14">
          <div><h2 className="text-3xl font-bold">Let's work together</h2><p className="mt-4 max-w-xl leading-7 text-slate-200">Tell us what you need, and we can discuss a suitable way forward.</p></div>
          <Link href="/contact" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#00AEEF] px-7 py-4 font-semibold text-[#071327] hover:bg-[#00C6FF]">Get in touch <ArrowRight size={18} /></Link>
        </div>
      </section>
    </main>
  );
}
