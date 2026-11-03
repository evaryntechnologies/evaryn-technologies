import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ClipboardCheck, Clock3, MessagesSquare, RefreshCcw, ShieldCheck } from "lucide-react";
import SectionHead from "@/components/public/SectionHead";
import CtaBand from "@/components/public/CtaBand";

export const metadata: Metadata = {
  title: "How We Work",
  description:
    "From brief to delivery in five clear stages: scoping, specialist matching, production, peer review and final QA.",
};

const steps = [
  { n: "01", title: "Brief and scope", you: "Share your goals, volume, deadline and any examples or guidelines.", we: "Confirm scope and acceptance criteria, propose a pilot where it helps, and send you a quote." },
  { n: "02", title: "Specialist match", you: "Nothing, we handle the staffing.", we: "Assign your project to team members approved for your category and set a deadline for each stage." },
  { n: "03", title: "Production", you: "Answer the occasional clarifying question.", we: "Produce the work to your guidelines while tracking deadlines and sending reminders so nothing drifts." },
  { n: "04", title: "Peer review", you: "Nothing yet. This happens before you see anything.", we: "A second specialist checks accuracy, consistency and completeness, and sends anything that falls short back for revision." },
  { n: "05", title: "QA and delivery", you: "Review the delivery and tell us what you think.", we: "A final quality gate signs off the work. If you want changes, your revision request goes straight back to the specialist, and your rating informs future assignments." },
];

const expect = [
  { Icon: MessagesSquare, title: "Clear communication", text: "You know who is responsible for your project and what stage it is in." },
  { Icon: Clock3, title: "Predictable timelines", text: "Deadlines are agreed up front and tracked at each stage." },
  { Icon: RefreshCcw, title: "Direct revisions", text: "Feedback goes straight to the person who can fix it, with your notes attached." },
  { Icon: ShieldCheck, title: "Careful data handling", text: "Work is assigned only to named, vetted team members, and we follow the requirements you set." },
];

export default function HowWeWorkPage() {
  return (
    <main>
      <section className="site-hero">
        <div className="site-container">
          <div className="site-hero__copy">
            <p className="site-eyebrow">How we work</p>
            <h1 className="site-h1">
              A clear process from first brief
              <span className="site-accent">to final delivery.</span>
            </h1>
            <p className="site-lead">
              Five stages, two independent quality checks and a direct line for revisions. You always know where
              your work stands and who is responsible for it.
            </p>
            <div className="site-actions">
              <Link href="/contact" className="site-btn site-btn--cyan">
                Start a project <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="site-section">
        <div className="site-container">
          <SectionHead eyebrow="The process" title="Five stages, each with a clear owner" />
          <div className="site-grid">
            {steps.map((step) => (
              <div key={step.n} className="site-card site-card--hover" style={{ display: "grid", gap: "1.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <span className="site-tag" style={{ fontSize: "0.9rem" }}>{step.n}</span>
                  <h3 className="site-h3" style={{ fontSize: "1.3rem" }}>{step.title}</h3>
                </div>
                <div className="site-grid site-grid--2" style={{ gap: "1.25rem" }}>
                  <div>
                    <p className="site-eyebrow" style={{ fontSize: "0.7rem" }}>You</p>
                    <p style={{ marginTop: "0.5rem" }}>{step.you}</p>
                  </div>
                  <div>
                    <p className="site-eyebrow" style={{ fontSize: "0.7rem" }}>We</p>
                    <p style={{ marginTop: "0.5rem" }}>{step.we}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="site-section site-band">
        <div className="site-container">
          <SectionHead eyebrow="What to expect" title="Working with us" />
          <div className="site-grid site-grid--4">
            {expect.map(({ Icon, title, text }) => (
              <div key={title} className="site-card">
                <span className="site-icon"><Icon size={24} aria-hidden="true" /></span>
                <h3 className="site-h3">{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="site-section">
        <div className="site-container">
          <div className="site-split">
            <div className="site-stack">
              <p className="site-eyebrow">Start with a pilot</p>
              <h2 className="site-h2">See our quality on your own work first</h2>
              <p className="site-p">
                For new clients we suggest a small pilot batch. It costs you little, gives you a real read on our
                quality and communication, and lets us calibrate to your guidelines before volume ramps up.
              </p>
            </div>
            <div className="site-card">
              <ul className="site-list">
                {[
                  "Send a representative sample or a short brief",
                  "We scope the pilot and agree acceptance criteria",
                  "You review the output, give feedback and decide next steps",
                ].map((t) => (
                  <li key={t}>
                    <ClipboardCheck size={18} aria-hidden="true" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="site-section--tight" style={{ paddingBottom: "clamp(3rem,6vw,5rem)" }}>
        <div className="site-container">
          <CtaBand
            title="Ready to discuss your project?"
            text="Share your requirements and let us scope the work, the pilot and the timeline."
            primary={{ label: "Request a quote", href: "/contact" }}
          />
        </div>
      </section>
    </main>
  );
}
