import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Layers3,
  RefreshCcw,
  ShieldCheck,
  TrendingUp,
  UsersRound,
} from "lucide-react";
import { getService, serviceGroups, services } from "@/lib/services";
import { clientNames, proofPoints, testimonials } from "@/lib/site";
import ServiceIcon from "@/components/ui/ServiceIcon";
import SectionHead from "@/components/public/SectionHead";
import CtaBand from "@/components/public/CtaBand";

export const metadata: Metadata = {
  title: { absolute: "AI Training Data, Content Writing & Video Editing | Evaryn Technologies" },
  description:
    "Evaryn delivers LiDAR annotation, egocentric video collection, data annotation, content writing and video editing from Nairobi, with peer review and QA on every deliverable.",
};

const heroPicks = ["lidar-annotation", "egocentric-video-collection", "non-technical-writing", "video-editing"]
  .map((slug) => getService(slug))
  .filter((s): s is NonNullable<typeof s> => Boolean(s));

const reasons = [
  { Icon: ShieldCheck, title: "Two independent quality gates", text: "Every deliverable is peer-reviewed and then passed through a final QA check. Nothing reaches you unchecked." },
  { Icon: UsersRound, title: "Specialists matched to the work", text: "Projects go only to team members approved for that category, not to a general pool." },
  { Icon: RefreshCcw, title: "Revisions handled directly", text: "Your feedback goes straight back to the person who did the work, so fixes are fast and the lesson sticks." },
  { Icon: Clock3, title: "Deadlines tracked, not hoped for", text: "Every order carries a deadline at each stage, with reminders built in so delays surface early." },
  { Icon: BadgeCheck, title: "Original, verified work", text: "We check for originality, including inappropriate AI-generated text, before anything is delivered." },
  { Icon: TrendingUp, title: "Accountable teams", text: "Structured feedback and performance ratings decide who gets the next piece of work, so quality compounds." },
];

const steps = [
  { t: "Brief", d: "You tell us the goal, volume and deadline." },
  { t: "Match", d: "We assign specialists approved for your category." },
  { t: "Create", d: "The team produces the work to your guidelines." },
  { t: "Review", d: "A second specialist checks and returns anything weak." },
  { t: "QA and delivery", d: "A final quality gate signs off before you receive it." },
];

export default function Home() {
  return (
    <main>
      {/* ------------------------------- HERO ------------------------------- */}
      <section className="site-hero">
        <div className="site-container">
          <div className="site-hero__grid site-hero__grid--split">
            <div className="site-hero__copy">
              <p className="site-eyebrow">AI training data &middot; Content &middot; Video</p>
              <h1 className="site-h1">
                Quality-checked data, content and video,
                <span className="site-accent">delivered without the rework.</span>
              </h1>
              <p className="site-lead">
                Evaryn pairs trained specialists with a built-in two-stage review, so every LiDAR label,
                egocentric clip, article and edit reaches you consistent, checked and ready to use.
              </p>
              <div className="site-actions">
                <Link href="/contact" className="site-btn site-btn--cyan">
                  Request a quote <ArrowRight size={18} aria-hidden="true" />
                </Link>
                <Link href="/services" className="site-btn site-btn--ghost-light">
                  Explore our services
                </Link>
              </div>
              <ul className="site-checks">
                {["Peer review and QA on every deliverable", "Based in Nairobi, serving clients worldwide", "Start with a small pilot batch"].map((t) => (
                  <li key={t}>
                    <CheckCircle2 size={17} aria-hidden="true" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            <aside className="site-glass" aria-label="What we deliver">
              <h2>What we deliver</h2>
              <div className="site-glass__list">
                {heroPicks.map((service) => (
                  <Link key={service.slug} href={`/services/${service.slug}`} className="site-glass__item">
                    <ServiceIcon name={service.icon} size={22} />
                    <div>
                      <strong>{service.title}</strong>
                      <span>{service.tagline}</span>
                    </div>
                    <ArrowRight size={18} aria-hidden="true" />
                  </Link>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ----------------------------- ASSURANCE ----------------------------- */}
      <section className="site-section--tight">
        <div className="site-container">
          <div className="site-stats">
            {proofPoints.length > 0
              ? proofPoints.map((p) => (
                  <div key={p.label} className="site-stat">
                    <strong>{p.value}</strong>
                    <span>{p.label}</span>
                  </div>
                ))
              : [
                  { v: "2", l: "independent quality checks on every deliverable" },
                  { v: "5", l: "clear stages from brief to delivery" },
                  { v: "Pilot-first", l: "judge our quality on a small batch before you scale" },
                  { v: "1 team", l: "assigned to your project, with direct revisions" },
                ].map((s) => (
                  <div key={s.l} className="site-stat">
                    <strong>{s.v}</strong>
                    <span>{s.l}</span>
                  </div>
                ))}
          </div>
          {clientNames.length > 0 && (
            <p className="site-logos" style={{ marginTop: "1.5rem" }}>
              <span>Trusted by</span>
              {clientNames.map((name) => (
                <span key={name}>{name}</span>
              ))}
            </p>
          )}
        </div>
      </section>

      {/* ------------------------------ SERVICES ------------------------------ */}
      <section className="site-section">
        <div className="site-container">
          <SectionHead
            eyebrow="What we do"
            title="Three service lines, one quality standard"
            lead="Whatever you are building, the process behind it is the same: trained specialists, independent review, final QA."
          />
          <div className="site-grid site-grid--3">
            {serviceGroups.map((group) => {
              const list = services.filter((s) => s.group === group.group);
              const first = list[0];
              return (
                <div key={group.group} className="site-card site-card--hover">
                  <span className="site-icon">
                    <ServiceIcon name={first.icon} size={26} />
                  </span>
                  <h3 className="site-h3">{group.title}</h3>
                  <p>{group.blurb}</p>
                  <ul className="site-list">
                    {list.map((s) => (
                      <li key={s.slug}>
                        <CheckCircle2 size={18} aria-hidden="true" />
                        <Link href={`/services/${s.slug}`} className="site-link">
                          {s.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* --------------------------- AI DATA SPOTLIGHT --------------------------- */}
      <section className="site-section site-band">
        <div className="site-container">
          <div className="site-split site-split--wide-left">
            <div className="site-stack">
              <p className="site-eyebrow">AI training data</p>
              <h2 className="site-h2">The data layer for robotics, autonomous systems and smart devices</h2>
              <p className="site-p">
                Perception and embodied-AI models need labeled 3D scenes and real first-person footage. Both are
                hard to get right: inconsistent labels, missing consent and unscreened clips cost you months of
                retraining. We run the whole pipeline with quality built in.
              </p>
              <ul className="site-list">
                {[
                  "LiDAR annotation: 3D cuboids, segmentation, tracking and sensor-fusion labeling",
                  "Egocentric video collection: scripted first-person capture with consent and privacy screening",
                  "Data annotation: image, video, text and RLHF preference labeling",
                ].map((t) => (
                  <li key={t}>
                    <CheckCircle2 size={18} aria-hidden="true" />
                    {t}
                  </li>
                ))}
              </ul>
              <div className="site-actions">
                <Link href="/services/lidar-annotation" className="site-btn site-btn--primary">
                  LiDAR annotation <ArrowRight size={17} aria-hidden="true" />
                </Link>
                <Link href="/services/egocentric-video-collection" className="site-btn site-btn--ghost">
                  Egocentric video collection
                </Link>
              </div>
            </div>
            <div className="site-grid">
              {["lidar-annotation", "egocentric-video-collection"].map((slug) => {
                const s = getService(slug)!;
                return (
                  <Link key={slug} href={`/services/${slug}`} className="site-card">
                    <span className="site-icon">
                      <ServiceIcon name={s.icon} />
                    </span>
                    <h3 className="site-h3">{s.title}</h3>
                    <p>{s.shortDescription}</p>
                    <span className="site-card__more">
                      Learn more <ArrowRight size={17} aria-hidden="true" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------ WHY EVARYN ------------------------------ */}
      <section className="site-section">
        <div className="site-container">
          <SectionHead
            eyebrow="Why Evaryn"
            title="Built so quality does not depend on luck"
            lead="Most delivery problems come from process, not people. Ours is designed to catch problems before you ever see them."
          />
          <div className="site-grid site-grid--3">
            {reasons.map(({ Icon, title, text }) => (
              <div key={title} className="site-card site-card--hover">
                <span className="site-icon">
                  <Icon size={24} aria-hidden="true" />
                </span>
                <h3 className="site-h3">{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
          <div className="site-actions" style={{ marginTop: "2rem" }}>
            <Link href="/why-evaryn" className="site-link">
              More on why teams choose Evaryn <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------------------------- PROCESS ---------------------------------- */}
      <section className="site-section site-band">
        <div className="site-container">
          <SectionHead eyebrow="How it works" title="From brief to delivery in five clear steps" />
          <ol className="site-steps">
            {steps.map((step) => (
              <li key={step.t} className="site-step">
                <h3 className="site-h3">{step.t}</h3>
                <p>{step.d}</p>
              </li>
            ))}
          </ol>
          <div className="site-actions" style={{ marginTop: "2rem" }}>
            <Link href="/how-we-work" className="site-link">
              See the full process <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------------------------- PROOF ---------------------------------- */}
      {testimonials.length > 0 && (
        <section className="site-section">
          <div className="site-container">
            <SectionHead eyebrow="Client feedback" title="What clients say" />
            <div className="site-grid site-grid--3">
              {testimonials.map((t) => (
                <figure key={t.name} className="site-quote">
                  <blockquote>{t.quote}</blockquote>
                  <figcaption>
                    <strong>{t.name}</strong>, {t.role}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* --------------------------------- PILOT + INVESTORS --------------------------------- */}
      <section className="site-section">
        <div className="site-container">
          <div className="site-grid site-grid--2">
            <div className="site-card">
              <span className="site-icon">
                <ClipboardCheck size={24} aria-hidden="true" />
              </span>
              <h3 className="site-h3">Start small. Judge us on your own data.</h3>
              <p>
                Send a representative sample of your data or brief. We will scope a pilot batch so you can see
                our quality, our communication and our turnaround before you commit volume.
              </p>
              <Link href="/contact" className="site-card__more">
                Ask about a pilot <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </div>
            <div className="site-card">
              <span className="site-icon">
                <Layers3 size={24} aria-hidden="true" />
              </span>
              <h3 className="site-h3">Building the managed workforce behind AI data.</h3>
              <p>
                Evaryn runs on its own workforce platform: task marketplace, multi-stage review, performance-based
                pay and a full audit trail. We are building it to scale, and we welcome conversations with
                investors and strategic partners.
              </p>
              <Link href="/investors" className="site-card__more">
                For investors <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="site-section--tight" style={{ paddingBottom: "clamp(3rem,6vw,5rem)" }}>
        <div className="site-container">
          <CtaBand
            title="Tell us what you are building."
            text="Share your requirements and a sample if you have one. You will get a clear scope, a proposed pilot and a quote, with no obligation."
            secondary={{ label: "Request a custom service", href: "/custom-request" }}
          />
        </div>
      </section>
    </main>
  );
}
