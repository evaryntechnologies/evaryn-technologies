import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Cpu,
  History,
  Lightbulb,
  LockKeyhole,
  RefreshCcw,
  ShieldCheck,
  Star,
  TrendingUp,
  UsersRound,
} from "lucide-react";
import SectionHead from "@/components/public/SectionHead";
import CtaBand from "@/components/public/CtaBand";

export const metadata: Metadata = {
  title: "Why Evaryn",
  description:
    "Specialists matched to your work, peer review and QA on every deliverable, direct revisions and tracked deadlines, run on our own workforce platform.",
};

const commitments = [
  { Icon: ShieldCheck, title: "You never receive unchecked work", text: "Every deliverable passes a peer review and then a final QA gate. Problems are caught and fixed inside our process, not discovered by you." },
  { Icon: UsersRound, title: "The right people for the job", text: "Work is matched to team members approved for your category, so a LiDAR project is labeled by LiDAR specialists and a technical document is written by technical writers." },
  { Icon: RefreshCcw, title: "Fixes without friction", text: "When you request a revision, it goes directly to the specialist who did the work, with your notes attached. You do not chase anyone." },
  { Icon: Clock3, title: "Predictable delivery", text: "Deadlines are set at every stage and tracked, with automatic reminders, so delays surface early instead of at the last minute." },
  { Icon: BadgeCheck, title: "Original, verified work", text: "We check originality, including for inappropriate AI-generated text, so what you publish or train on is genuinely yours to use." },
  { Icon: Star, title: "Teams that earn their next job", text: "Client feedback and review results are recorded as ratings and influence future assignments. Quality is rewarded, so it compounds." },
];

const platform = [
  { Icon: ClipboardList, text: "A task marketplace that offers work only to people approved for that category" },
  { Icon: ShieldCheck, text: "Multi-stage workflow: production, peer review, then final QA" },
  { Icon: Clock3, text: "Stage deadlines with automated reminders" },
  { Icon: Star, text: "Ratings and structured feedback on every completed order" },
  { Icon: History, text: "An audit trail of who did what, and when" },
  { Icon: LockKeyhole, text: "Role-based access, so people see only the work assigned to them" },
];

const values = [
  { Icon: Lightbulb, title: "Innovation", text: "We keep improving how data, content and video are produced and checked, and we build our own tools to do it." },
  { Icon: UsersRound, title: "People", text: "Skilled, well-managed and fairly paid people produce better work. We invest in them, and clients feel the difference." },
  { Icon: TrendingUp, title: "Progress", text: "Every project should leave you further along: faster, cleaner and with fewer surprises than the last one." },
];

export default function WhyEvarynPage() {
  return (
    <main>
      <section className="site-hero">
        <div className="site-container">
          <div className="site-hero__copy">
            <p className="site-eyebrow">Why Evaryn</p>
            <h1 className="site-h1">
              A delivery partner built around
              <span className="site-accent">your quality bar.</span>
            </h1>
            <p className="site-lead">
              Many vendors promise quality. We built the process that produces it: matched specialists,
              independent review, a final QA gate and direct revision loops, all run on our own workforce
              platform.
            </p>
            <div className="site-actions">
              <Link href="/contact" className="site-btn site-btn--cyan">
                Request a quote <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link href="/how-we-work" className="site-btn site-btn--ghost-light">
                See how we work
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="site-section">
        <div className="site-container">
          <SectionHead eyebrow="Our commitments" title="What you can rely on, on every project" />
          <div className="site-grid site-grid--3">
            {commitments.map(({ Icon, title, text }) => (
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
              <p className="site-eyebrow">Our platform</p>
              <h2 className="site-h2">Run on a platform, not on spreadsheets</h2>
              <p className="site-p">
                Behind every project is Evaryn&apos;s own workforce platform. It is how we match the right people to
                the right work, enforce review and QA, and keep every order accountable from brief to delivery.
              </p>
              <p className="site-p">
                It is also why we can scale without quality slipping: the process lives in the system, not in
                anyone&apos;s head.
              </p>
            </div>
            <div className="site-card">
              <span className="site-icon"><Cpu size={24} aria-hidden="true" /></span>
              <ul className="site-list">
                {platform.map(({ text }) => (
                  <li key={text}>
                    <CheckCircle2 size={18} aria-hidden="true" />
                    {text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="site-section">
        <div className="site-container">
          <SectionHead eyebrow="What drives us" title="Innovation. People. Progress." />
          <div className="site-grid site-grid--3">
            {values.map(({ Icon, title, text }) => (
              <div key={title} className="site-card">
                <span className="site-icon"><Icon size={24} aria-hidden="true" /></span>
                <h3 className="site-h3">{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="site-section--tight" style={{ paddingBottom: "clamp(3rem,6vw,5rem)" }}>
        <div className="site-container">
          <CtaBand
            title="See the difference on your own work."
            text="Send a sample of your data or brief and we will scope a pilot, so you can judge our quality before you commit."
            secondary={{ label: "Explore services", href: "/services" }}
          />
        </div>
      </section>
    </main>
  );
}
