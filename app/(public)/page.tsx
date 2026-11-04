import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight, ArrowUpRight, ClipboardCheck, Layers3, Handshake, ScanSearch,
  FileCheck2, Lock, Workflow, UsersRound, Target, BadgeCheck,
} from "lucide-react";
import { serviceGroups, services } from "@/lib/services";
import { publishedProjects, publishedReviews } from "@/lib/public-showcase";

export const metadata: Metadata = {
  title: "Evaryn Technologies | AI training data, content and video, checked twice",
  description:
    "LiDAR annotation, egocentric video collection, data annotation, specialist writing and video editing from Nairobi. Written guidelines, a calibrated pilot, peer review and a final QA gate on every batch.",
};

const industries = [
  "Autonomous vehicles & ADAS",
  "Robotics & automation",
  "AR/VR & wearables",
  "AI & ML platforms",
  "SaaS & developer tools",
  "Media & marketing",
];

const stages = [
  { t: "Brief and guidelines", d: "Taxonomy, edge cases and acceptance criteria are written down before work starts." },
  { t: "Calibrated pilot", d: "A small batch on your own material, so quality is judged before volume is committed." },
  { t: "Independent peer review", d: "A second specialist reviews every unit. The producer never signs off their own work." },
  { t: "Final QA gate", d: "Nothing is delivered until it clears a last check against your agreed criteria." },
];

const standard = [
  { Icon: ScanSearch, title: "Two checks, every time", text: "Peer review and a separate final QA gate are built into the workflow, not added when a deadline is tight." },
  { Icon: UsersRound, title: "Named, vetted people", text: "Work goes only to named team members we have vetted, so you always know who touched your data." },
  { Icon: FileCheck2, title: "Your spec, your format", text: "We deliver in the schema your pipeline expects, with batch quality reports and a shared edge-case log." },
  { Icon: Workflow, title: "Feedback that sticks", text: "Your corrections go straight back to the team that did the work, so the same error is not repeated next batch." },
];

const models = [
  { Icon: ClipboardCheck, name: "Pilot batch", text: "A scoped sample on your own data or brief. Judge our quality, communication and turnaround before you commit." },
  { Icon: Layers3, name: "Project-based", text: "A defined scope, volume and deadline with a fixed quote. Suited to one-off datasets, campaigns and documentation sets." },
  { Icon: Handshake, name: "Managed team", text: "A consistent team on your ongoing pipeline, so guidelines, style and quality stay uniform as volume grows." },
];

export default function Home() {
  return (
    <main className="ev2-page">
      <section className="ev2-hero">
        <div className="ev2-shell ev2-hero-grid">
          <div className="ev2-hero-copy">
            <span className="ev2-kicker">AI data · Content · Video</span>
            <h1>
              AI training data and content,<br />
              <em>checked twice before delivery.</em>
            </h1>
            <p className="ev2-lead">
              Evaryn runs LiDAR annotation, egocentric video collection, data annotation, specialist writing and video
              editing as managed delivery: written guidelines, a calibrated pilot, independent peer review and a final
              QA gate on every batch.
            </p>
            <div className="ev2-actions">
              <Link className="ev2-primary" href="/contact">Scope a pilot <ArrowUpRight size={18} /></Link>
              <Link className="ev2-secondary" href="/services">See what we deliver <ArrowRight size={18} /></Link>
            </div>
            <p className="ev2-hero-note"><Lock size={16} aria-hidden="true" /> Data handled to the terms you set at scoping · Nairobi, serving teams worldwide</p>
          </div>

          <aside className="ev2-hero-panel" aria-label="The Evaryn delivery standard">
            <span className="ev2-panel-label">The Evaryn delivery standard</span>
            <p className="ev2-panel-title">Four stages between your brief and your delivery.</p>
            <div className="ev2-panel-list">
              {stages.map((s, i) => (
                <div className="ev2-panel-step" key={s.t}>
                  <b>0{i + 1}</b>
                  <div><strong>{s.t}</strong><span>{s.d}</span></div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <div className="ev2-strip">
        <div className="ev2-shell ev2-strip-inner">
          <span className="ev2-strip-label">Built for teams in</span>
          <div className="ev2-chips">{industries.map((i) => <span className="ev2-chip" key={i}>{i}</span>)}</div>
        </div>
      </div>

      <section className="ev2-section ev2-shell" aria-labelledby="capabilities">
        <div className="ev2-section-heading">
          <div>
            <span className="ev2-kicker">Capabilities</span>
            <h2 id="capabilities">Specialist services, one quality standard.</h2>
          </div>
          <p>Every service runs through the same pipeline of guidelines, pilot, peer review and final QA, so quality does not depend on which team you land on.</p>
        </div>
        <div className="ev2-service-grid">
          {serviceGroups.map((g, i) => (
            <article className="ev2-card" key={g.group}>
              <span className="ev2-index">0{i + 1}</span>
              <h3>{g.title}</h3>
              <p>{g.blurb}</p>
              <div className="ev2-mini-links">
                {services.filter((s) => s.group === g.group).map((s) => (
                  <Link href={`/services/${s.slug}`} key={s.slug}>{s.title}<ArrowUpRight size={15} /></Link>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="ev2-section ev2-section-tinted" aria-labelledby="standard">
        <div className="ev2-shell">
          <div className="ev2-section-heading">
            <div>
              <span className="ev2-kicker">Why teams stay with Evaryn</span>
              <h2 id="standard">Reliability is designed in, not promised.</h2>
            </div>
            <p>The things that make outsourced work painful are rework, drift and silence. Our operating model is built against each of them.</p>
          </div>
          <div className="ev2-four-grid ev2-service-grid" style={{ marginTop: 0 }}>
            {standard.map(({ Icon, title, text }) => (
              <article className="ev2-benefit" key={title}>
                <span className="ev2-icon"><Icon size={24} aria-hidden="true" /></span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="ev2-section ev2-shell" aria-labelledby="terms">
        <div className="ev2-section-heading">
          <div>
            <span className="ev2-kicker">How we take on work</span>
            <h2 id="terms">Clear terms before a single task is assigned.</h2>
          </div>
          <p>Serious buyers want to know the conditions up front. Here they are.</p>
        </div>
        <div className="ev2-terms">
          <div className="ev2-term">
            <h3><Target size={20} aria-hidden="true" /> What we need from you</h3>
            <ul>
              <li>Your guidelines, taxonomy or style rules, or we help you write them</li>
              <li>A representative sample so the pilot reflects real work</li>
              <li>Volume, deadline and target export format</li>
              <li>Any data-handling requirements, stated at scoping</li>
            </ul>
          </div>
          <div className="ev2-term">
            <h3><BadgeCheck size={20} aria-hidden="true" /> What you can expect</h3>
            <ul>
              <li>A scoped proposal and a fixed quote before work begins</li>
              <li>Acceptance criteria agreed on the pilot, not after</li>
              <li>Batch-level quality reports and a shared edge-case log</li>
              <li>A revision loop that goes straight back to the producing team</li>
            </ul>
          </div>
          <div className="ev2-term">
            <h3><Lock size={20} aria-hidden="true" /> How we handle your data</h3>
            <ul>
              <li>Work assigned only to named, vetted team members</li>
              <li>Handling terms set out at scoping and followed throughout</li>
              <li>We tell you early if a requirement is outside what we can do safely</li>
              <li>Custom requests are scoped, and declined if they do not fit our teams</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="ev2-section ev2-section-tinted" aria-labelledby="engage">
        <div className="ev2-shell">
          <div className="ev2-section-heading">
            <div>
              <span className="ev2-kicker">Engagement models</span>
              <h2 id="engage">Start small, scale when the quality is proven.</h2>
            </div>
            <p>Most clients begin with a pilot. It is the fastest way to evaluate us on your own material.</p>
          </div>
          <div className="ev2-service-grid">
            {models.map(({ Icon, name, text }) => (
              <article className="ev2-card" key={name}>
                <span className="ev2-icon"><Icon size={24} aria-hidden="true" /></span>
                <h3>{name}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="ev2-section ev2-shell" aria-labelledby="proof">
        <div className="ev2-section-heading">
          <div>
            <span className="ev2-kicker">Proof</span>
            <h2 id="proof">Judge us on your own data.</h2>
          </div>
          <p>We publish case studies and client feedback only when they are accurate and approved. Until then, the pilot is the proof.</p>
        </div>
        <div className="ev2-two-col">
          <div className="ev2-card">
            <span className="ev2-kicker">Past projects</span>
            <h3>{publishedProjects.length ? "Explore selected project stories" : "A pilot instead of a pitch deck."}</h3>
            <p>
              {publishedProjects.length
                ? `${publishedProjects.length} published project stories, each with the brief, approach and outcome.`
                : "Send a representative sample. We scope a pilot, deliver it through the full review and QA process, and you decide with evidence."}
            </p>
            <Link className="ev2-textlink" href={publishedProjects.length ? "/projects" : "/contact"}>
              {publishedProjects.length ? "View past projects" : "Request a pilot"} <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="ev2-card">
            <span className="ev2-kicker">Feedback & reviews</span>
            <h3>{publishedReviews.length ? "Feedback from our clients" : "Verified feedback, never invented."}</h3>
            <p>
              {publishedReviews.length
                ? `${publishedReviews.length} reviews shared with permission.`
                : "Client feedback appears here once it has been verified and consented to. No placeholder endorsements, ever."}
            </p>
            <Link className="ev2-textlink" href="/reviews">Feedback & reviews <ArrowUpRight size={16} /></Link>
          </div>
        </div>
      </section>

      <section className="ev2-cta">
        <div className="ev2-shell ev2-cta-grid">
          <div>
            <span className="ev2-kicker">Next step</span>
            <h2>Tell us the work. We will scope the pilot.</h2>
            <p>Share your requirement and a sample if you have one. You will get a scope, a proposed pilot and a quote, with no obligation to proceed.</p>
          </div>
          <div className="ev2-actions">
            <Link className="ev2-primary" href="/contact">Request a quote <ArrowUpRight size={18} /></Link>
            <Link className="ev2-secondary" href="/contact#consultation">Book a consultation <ArrowRight size={18} /></Link>
          </div>
        </div>
      </section>
    </main>
  );
}
