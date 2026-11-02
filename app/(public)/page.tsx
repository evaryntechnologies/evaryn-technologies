import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Database, FilePenLine, Handshake, Laptop, Video, Layers3, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Evaryn Technologies | Managed Content, AI Data & Digital Services",
  description: "Evaryn Technologies supports organizations, AI teams and delivery partners with content production, video editing, LiDAR annotation, egocentric video collection, and website development and maintenance.",
};

const offers = [
  { title: "Content & editorial", detail: "News articles, blogs, journals, technical documentation and brand content tailored to your audience.", Icon: FilePenLine, note: "Writing and editorial production" },
  { title: "AI training data", detail: "LiDAR and image annotation, spatial labeling, language tasks and human-in-the-loop quality review.", Icon: Database, note: "Structured data workflows" },
  { title: "Egocentric video collection", detail: "Project-defined first-person footage collection and review for research and AI datasets.", Icon: Layers3, note: "Custom collection programs" },
  { title: "Video editing", detail: "Editing, sound, captions, motion graphics and post-production for digital and commercial projects.", Icon: Video, note: "Story-first production" },
  { title: "Websites & maintenance", detail: "Responsive websites, ongoing content updates, upkeep and digital experience improvements.", Icon: Laptop, note: "Build, maintain, improve" },
  { title: "Outsourced project teams", detail: "A collaborative delivery model for agencies, studios, data firms and service providers seeking additional capacity.", Icon: Handshake, note: "Partner-ready delivery" },
];

export default function Home() {
  return (
    <main className="ev-marketing bg-[var(--ev-page)] text-[var(--ev-ink)]">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#002657] via-[#0048A8] to-[#0089D1] px-5 pb-14 pt-10 text-white sm:px-8 sm:pb-16 sm:pt-14 lg:pb-20 lg:pt-16">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[url('/watermarks/evaryn-watermark.svg')] bg-right bg-no-repeat opacity-[0.09]" />
        <div className="relative mx-auto grid max-w-[1240px] items-start gap-9 lg:grid-cols-[1.15fr_.85fr] lg:gap-12">
          <div className="max-w-[740px]">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">Evaryn Technologies · Innovation. People. Progress.</p>
            <h1 className="mt-4 text-[clamp(2.45rem,5vw,4.65rem)] font-bold leading-[1.08] tracking-[-.045em]">The delivery partner behind your <span className="text-[#67DEFF]">next big project.</span></h1>
            <p className="mt-5 max-w-[620px] text-base leading-[1.65] text-blue-50 sm:text-lg">From human-centered AI data operations and original content to video production and web development, we help ambitious teams turn demanding briefs into carefully managed deliverables.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/contact" className="inline-flex items-center gap-2 rounded-xl bg-[#52D7FF] px-6 py-3.5 font-bold text-[#002657] transition hover:bg-white">Discuss a project <ArrowRight size={17}/></Link>
              <Link href="/collaborate" className="inline-flex items-center gap-2 rounded-xl border border-cyan-200/60 px-6 py-3.5 font-semibold text-white transition hover:bg-white/10">Outsource or partner with us</Link>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-blue-50">
              {["Flexible project scopes", "Review-led workflows", "Collaboration-focused"].map((text) => <span key={text} className="inline-flex items-center gap-2"><CheckCircle2 size={16} className="text-cyan-200"/>{text}</span>)}
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-white/20 bg-[#002657]/45 p-6 shadow-xl backdrop-blur-sm sm:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-cyan-200">What we enable</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight">One partner. Multiple capabilities.</h2>
            <p className="mt-3 text-sm leading-6 text-blue-50">Bring the brief. We can discuss a delivery model suited to the skills, quality requirements and timeline your project needs.</p>
            <div className="mt-5 grid gap-2.5">
              {["AI data labeling & collection", "Editorial & content operations", "Video & digital production", "Team augmentation & outsourcing"].map((item) => <div key={item} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold"><CheckCircle2 size={16} className="shrink-0 text-[#67DEFF]" />{item}</div>)}
            </div>
            <Link href="/how-we-work" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-cyan-200 hover:text-white">See how delivery works <ArrowRight size={16}/></Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 py-14 sm:px-8 lg:py-16">
        <div className="max-w-[760px]">
          <p className="text-xs font-bold uppercase tracking-[.15em] text-[var(--ev-accent-text)]">Capabilities</p>
          <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">Specialized services. Connected delivery.</h2>
          <p className="mt-3 text-base leading-7 text-[var(--ev-muted)]">Choose a defined service or bring us a custom scope. We work across creative, technical and AI-related workflows.</p>
        </div>
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {offers.map(({title,detail,Icon,note}) => <Link key={title} href="/services" className="group rounded-2xl border border-[var(--ev-border)] bg-[var(--ev-surface)] p-6 transition hover:-translate-y-0.5 hover:shadow-lg"><Icon size={25} className="text-[var(--ev-accent-text)]"/><p className="mt-4 text-xs font-bold uppercase tracking-[.1em] text-[var(--ev-accent-text)]">{note}</p><h3 className="mt-2 text-xl font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-[var(--ev-muted)]">{detail}</p><span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--ev-accent-text)]">Explore capabilities <ArrowRight size={15}/></span></Link>)}
        </div>
      </section>

      <section className="bg-[var(--ev-surface-2)] px-5 py-14 sm:px-8 lg:py-16">
        <div className="mx-auto grid max-w-[1240px] items-center gap-8 lg:grid-cols-2">
          <div><p className="text-xs font-bold uppercase tracking-[.15em] text-[var(--ev-accent-text)]">Built for delivery partners</p><h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">Your client relationship. Additional delivery capacity.</h2><p className="mt-4 leading-7 text-[var(--ev-muted)]">We welcome partnerships with agencies, AI data firms, editorial businesses and other service providers. If you have a project that needs a capable external team, let's explore how we can support execution under an agreed scope and workflow.</p><Link href="/collaborate" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--ev-primary)] px-5 py-3 font-semibold text-[var(--ev-on-primary)]">Explore partnerships <ArrowRight size={17}/></Link></div>
          <div className="grid gap-3"><div className="rounded-xl border border-[var(--ev-border)] bg-[var(--ev-surface)] p-5"><Handshake className="text-[var(--ev-accent-text)]"/><h3 className="mt-2 font-bold">Agency and vendor partnerships</h3><p className="mt-1 text-sm leading-6 text-[var(--ev-muted)]">Collaborate on client-facing projects while clarifying responsibilities and communication.</p></div><div className="rounded-xl border border-[var(--ev-border)] bg-[var(--ev-surface)] p-5"><ShieldCheck className="text-[var(--ev-accent-text)]"/><h3 className="mt-2 font-bold">Defined quality checkpoints</h3><p className="mt-1 text-sm leading-6 text-[var(--ev-muted)]">Align briefs, acceptance criteria, review stages and delivery expectations up front.</p></div></div>
        </div>
      </section>
      <section className="mx-auto flex max-w-[1240px] flex-col gap-5 px-5 py-14 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:py-16"><div><p className="text-xs font-bold uppercase tracking-[.15em] text-[var(--ev-accent-text)]">Start the conversation</p><h2 className="mt-2 text-3xl font-bold tracking-tight">What are you building next?</h2><p className="mt-2 max-w-2xl leading-7 text-[var(--ev-muted)]">Tell us about the work, desired outcome, timeline and quality expectations. We'll discuss a practical path forward.</p></div><Link href="/contact" className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl bg-[var(--ev-primary)] px-6 py-3.5 font-bold text-[var(--ev-on-primary)]">Request a project discussion <ArrowRight size={17}/></Link></section>
    </main>
  );
}
