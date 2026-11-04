import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, ScanSearch, UsersRound, Workflow, ShieldCheck, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "About Evaryn | Managed AI data, content and video delivery",
  description: "Evaryn Technologies is a Nairobi-based delivery company. We run AI data, content and video work through written guidelines, pilots, peer review and a final QA gate.",
};

const steps = [
  { title: "Discover", text: "We agree the requirement, volume, deadline and, most importantly, what a good result looks like, in writing." },
  { title: "Pilot", text: "A small batch on your own material calibrates quality and sets the acceptance criteria before you commit volume." },
  { title: "Deliver", text: "Named, vetted specialists produce the work against your guidelines, with progress you can see." },
  { title: "Assure", text: "Independent peer review, then a separate final QA gate. Only work that clears both is delivered." },
];

const principles = [
  { Icon: ScanSearch, title: "Quality is a process", text: "We do not rely on individual heroics. Two independent checks sit in the workflow on every batch." },
  { Icon: UsersRound, title: "People we can name", text: "Your work goes to vetted team members who are accountable for it, not an anonymous crowd." },
  { Icon: Workflow, title: "Rules before volume", text: "Guidelines, edge cases and acceptance criteria are documented first, so scale does not mean drift." },
  { Icon: ShieldCheck, title: "Straight answers", text: "If a requirement is outside what we can do well or safely, we say so early rather than after the deadline." },
];

export default function About() {
  return (
    <main className="ev2-page">
      <section className="ev2-inner-hero">
        <div className="ev2-shell">
          <span className="ev2-kicker">About Evaryn</span>
          <h1>Reliable delivery,<br /><em>built into the process.</em></h1>
          <p>Evaryn Technologies Limited runs AI data, content and video work for teams that cannot afford rework: specialist people, written standards and two quality gates on every batch.</p>
        </div>
      </section>

      <section className="ev2-section ev2-shell">
        <div className="ev2-split">
          <div>
            <span className="ev2-kicker">Who we are</span>
            <h2>A delivery company, organised around accountability.</h2>
          </div>
          <div className="ev2-about-intro-body">
            <p>We are based in Nairobi and work with organisations worldwide on LiDAR annotation, egocentric video collection, data annotation, specialist writing and video editing.</p>
            <p>Outsourced work usually fails in predictable ways: unclear guidelines, drift as volume grows, and no one to answer for errors. Evaryn exists to remove those failure points, with a managed workflow, named people and a quality process that does not bend under deadline pressure.</p>
            <p>Engagements run from a one-off pilot to a standing managed team, depending on what the work needs.</p>
            <p style={{ display: "flex", gap: ".5rem", alignItems: "center", fontWeight: 600, color: "var(--ev-ink)" }}><MapPin size={18} aria-hidden="true" /> Nairobi, Kenya · Serving clients worldwide</p>
          </div>
        </div>
      </section>

      <section className="ev2-section ev2-section-tinted" id="how-we-work">
        <div className="ev2-shell">
          <span className="ev2-kicker">How we work</span>
          <h2>One process. Clear ownership at every stage.</h2>
          <div className="ev2-steps" style={{ marginTop: "2.5rem" }}>
            {steps.map((s) => (
              <article className="ev2-step" key={s.title}><h3>{s.title}</h3><p>{s.text}</p></article>
            ))}
          </div>
        </div>
      </section>

      <section className="ev2-section ev2-shell" id="why-evaryn">
        <span className="ev2-kicker">What guides us</span>
        <h2>Four commitments behind every engagement.</h2>
        <div className="ev2-service-grid ev2-four-grid">
          {principles.map(({ Icon, title, text }) => (
            <article className="ev2-benefit" key={title}>
              <span className="ev2-icon"><Icon size={24} aria-hidden="true" /></span>
              <h3>{title}</h3><p>{text}</p>
            </article>
          ))}
        </div>
        <Link className="ev2-textlink" href="/contact">Talk to our team <ArrowUpRight size={16} /></Link>
      </section>
    </main>
  );
}
