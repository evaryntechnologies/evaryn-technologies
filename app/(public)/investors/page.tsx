import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  Cpu,
  Database,
  Globe,
  Handshake,
  TrendingUp,
  Mail,
  Rocket,
  ShieldCheck,
  Users,
} from "lucide-react";
import { proofPoints, site } from "@/lib/site";
import SectionHead from "@/components/public/SectionHead";
import CtaBand from "@/components/public/CtaBand";

export const metadata: Metadata = {
  title: "Investors and Partners",
  description:
    "Evaryn is building the managed workforce behind AI data: a skilled East African workforce, run on its own quality-first platform, serving clients worldwide.",
};

const opportunity = [
  { Icon: Database, title: "AI runs on human-quality data", text: "Perception, robotics and language models depend on large volumes of accurately labeled and carefully collected data. As more teams build with AI, the need for that data keeps growing." },
  { Icon: ShieldCheck, title: "Quality is the bottleneck", text: "Buyers lose time and budget to inconsistent labels, unreliable vendors and rework. A provider that makes quality systematic, not accidental, wins repeat and expanding work." },
  { Icon: Users, title: "Talent is there. Management is scarce.", text: "East Africa has a large, skilled, English-speaking and mobile-first workforce. The scarce ingredient is the management layer that turns that talent into dependable output at scale." },
];

const built = [
  "A task marketplace that offers work only to people approved for each category",
  "A multi-stage workflow: production, peer review, final QA, client delivery",
  "Client outcomes recorded, including revisions, ratings and partial payments",
  "Performance ratings and quality penalties that shape future assignments",
  "Approval-based payroll with scheduled payouts and full audit logging",
  "Role-based portals for specialists, reviewers, QA, admins and leadership",
];

const model = [
  { Icon: Boxes, title: "Pilot to scale", text: "Clients start with a scoped pilot, then expand into project and ongoing volume once quality is proven." },
  { Icon: Handshake, title: "Managed-team engagements", text: "Dedicated teams for ongoing pipelines create recurring, predictable revenue and deeper client relationships." },
  { Icon: TrendingUp, title: "Operating leverage", text: "Workflow automation, a shared task marketplace and specialization lift utilization and price per unit as volume grows." },
];

const roadmap = [
  { Icon: Cpu, title: "Deepen AI data services", text: "Scale LiDAR annotation and egocentric video collection, where quality and process matter most and clients value reliability." },
  { Icon: Globe, title: "Win enterprise and strategic accounts", text: "Build long-term relationships with AI labs, robotics and autonomy companies, and agencies with sustained content and video needs." },
  { Icon: Rocket, title: "Extend the platform", text: "Invest in QA tooling, analytics and client-facing visibility so quality scales faster than headcount." },
];

export default function InvestorsPage() {
  const briefing = `/contact?service=${encodeURIComponent("Investor enquiry")}`;
  const email = site.investorEmail || site.contactEmail;

  return (
    <main>
      <section className="site-hero">
        <div className="site-container">
          <div className="site-hero__copy">
            <p className="site-eyebrow">Investors and partners</p>
            <h1 className="site-h1">
              Building the managed workforce
              <span className="site-accent">behind the AI data economy.</span>
            </h1>
            <p className="site-lead">
              Evaryn combines a skilled East African workforce with its own quality-first workforce platform to
              deliver AI training data, content and video to clients worldwide.
            </p>
            <div className="site-actions">
              <Link href={briefing} className="site-btn site-btn--cyan">
                Request the investor briefing <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link href="/why-evaryn" className="site-btn site-btn--ghost-light">
                See the platform
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="site-section">
        <div className="site-container">
          <SectionHead eyebrow="The opportunity" title="A growing need, a real bottleneck, an underused talent base" />
          <div className="site-grid site-grid--3">
            {opportunity.map(({ Icon, title, text }) => (
              <div key={title} className="site-card site-card--hover">
                <span className="site-icon"><Icon size={24} aria-hidden="true" /></span>
                <h3 className="site-h3">{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="site-section site-band">
        <div className="site-container">
          <div className="site-split site-split--wide-right">
            <div className="site-stack">
              <p className="site-eyebrow">What we have built</p>
              <h2 className="site-h2">Operating software, not a slide deck</h2>
              <p className="site-p">
                Evaryn runs its delivery on a workforce platform it built itself. Quality is enforced by the
                system, which is why the model can scale without relying on any one manager or hero employee.
              </p>
              <p className="site-p">
                That platform is the foundation of our moat: it captures who did what, how well and how fast, and
                feeds that straight back into who receives the next piece of work.
              </p>
            </div>
            <div className="site-card">
              <ul className="site-list">
                {built.map((item) => (
                  <li key={item}>
                    <CheckCircle2 size={18} aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="site-section">
        <div className="site-container">
          <SectionHead eyebrow="Business model" title="Land with a pilot, expand with proof" />
          <div className="site-grid site-grid--3">
            {model.map(({ Icon, title, text }) => (
              <div key={title} className="site-card site-card--hover">
                <span className="site-icon"><Icon size={24} aria-hidden="true" /></span>
                <h3 className="site-h3">{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="site-section site-band">
        <div className="site-container">
          <SectionHead eyebrow="Where we are going" title="The plan the capital would accelerate" />
          <div className="site-grid site-grid--3">
            {roadmap.map(({ Icon, title, text }) => (
              <div key={title} className="site-card site-card--hover">
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
          <SectionHead eyebrow="Traction" title="Evidence, shared in the briefing" lead="We share traction, pipeline and financial detail directly with serious investors and partners." />
          {proofPoints.length > 0 ? (
            <div className="site-stats">
              {proofPoints.map((p) => (
                <div key={p.label} className="site-stat">
                  <strong>{p.value}</strong>
                  <span>{p.label}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="site-card">
              <p>
                Request the investor briefing for current traction, client pipeline and financial detail. We will
                respond personally.
              </p>
            </div>
          )}
          {email && (
            <p style={{ marginTop: "1.25rem" }}>
              <a className="site-link" href={`mailto:${email}`}>
                <Mail size={17} aria-hidden="true" /> {email}
              </a>
            </p>
          )}
        </div>
      </section>

      <section className="site-section--tight" style={{ paddingBottom: "clamp(3rem,6vw,5rem)" }}>
        <div className="site-container">
          <CtaBand
            title="Let us show you how we run."
            text="Request the investor briefing, or tell us about a strategic partnership you have in mind."
            primary={{ label: "Request the briefing", href: briefing }}
            secondary={{ label: "Explore services", href: "/services" }}
          />
          <p className="site-p" style={{ marginTop: "1.5rem", fontSize: "0.85rem" }}>
            This page is for general information about Evaryn Technologies Limited and is not an offer or solicitation
            to buy or sell securities. Forward-looking statements reflect current plans and may change.
          </p>
        </div>
      </section>
    </main>
  );
}
