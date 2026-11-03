import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { services, type Service } from "@/lib/services";
import ServiceIcon from "@/components/ui/ServiceIcon";
import ServiceCard from "@/components/ui/ServiceCard";
import SectionHead from "@/components/public/SectionHead";
import CtaBand from "@/components/public/CtaBand";

const steps = [
  { t: "Brief and scope", d: "We confirm your goals, volume, deadline and acceptance criteria, and agree a pilot batch where it makes sense." },
  { t: "Specialist match", d: "Your project goes to team members approved for this category of work." },
  { t: "Production", d: "Work is completed to your guidelines, with deadlines tracked and reminders built in." },
  { t: "Peer review", d: "A second specialist checks accuracy and completeness and sends anything that falls short back for revision." },
  { t: "QA and delivery", d: "A final quality gate signs off the deliverables before they reach you. Your feedback loops straight back to the team." },
];

export default function ServiceDetail({ service }: { service: Service }) {
  const quote = `/contact?service=${encodeURIComponent(service.title)}`;
  const related = services.filter((s) => s.slug !== service.slug).slice(0, 3);

  return (
    <main>
      <section className="site-hero">
        <div className="site-container">
          <div className="site-hero__grid site-hero__grid--split">
            <div className="site-hero__copy">
              <Link href="/services" className="site-link" style={{ color: "#7bd8ff" }}>
                <ArrowLeft size={16} aria-hidden="true" /> All services
              </Link>
              <p className="site-eyebrow">{service.group}</p>
              <h1 className="site-h1">{service.title}</h1>
              <p className="site-lead">
                {service.tagline} {service.shortDescription}
              </p>
              <div className="site-actions">
                <Link href={quote} className="site-btn site-btn--cyan">
                  Request a quote <ArrowRight size={18} aria-hidden="true" />
                </Link>
                <Link href={`${quote}&intent=pilot`} className="site-btn site-btn--ghost-light">
                  Ask about a pilot batch
                </Link>
              </div>
            </div>

            <aside className="site-glass" aria-label="What you receive">
              <span className="site-icon" style={{ background: "rgba(255,255,255,0.16)", color: "#fff" }}>
                <ServiceIcon name={service.icon} size={26} />
              </span>
              <h2 style={{ marginTop: "1rem" }}>What you receive</h2>
              <ul className="site-list" style={{ marginTop: "1rem" }}>
                {service.deliverables.map((item) => (
                  <li key={item} style={{ color: "#fff" }}>
                    <CheckCircle2 size={18} aria-hidden="true" style={{ color: "#7bd8ff" }} />
                    {item}
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </div>
      </section>

      <section className="site-section">
        <div className="site-container">
          <div className="site-split site-split--wide-left">
            <div className="site-stack">
              <p className="site-eyebrow">Overview</p>
              <h2 className="site-h2">Why it matters, and how we handle it</h2>
              {service.overview.map((paragraph) => (
                <p key={paragraph} className="site-p">{paragraph}</p>
              ))}
            </div>
            <div className="site-card">
              <h3 className="site-h3">Where clients use it</h3>
              <ul className="site-list">
                {service.useCases.map((item) => (
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

      <section className="site-section site-band">
        <div className="site-container">
          <SectionHead eyebrow="Capabilities" title="Exactly what we can do for you" />
          <div className="site-grid site-grid--3">
            {service.capabilities.map((group) => (
              <div key={group.title} className="site-card site-card--hover">
                <h3 className="site-h3">{group.title}</h3>
                <ul className="site-list site-list--muted">
                  {group.items.map((item) => (
                    <li key={item}>
                      <CheckCircle2 size={18} aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="site-section">
        <div className="site-container">
          <SectionHead eyebrow="How we deliver" title="A managed process, not a hand-off" lead="Every project follows the same five stages, so you always know where your work stands and who is responsible for it." />
          <ol className="site-steps">
            {steps.map((step) => (
              <li key={step.t} className="site-step">
                <h3 className="site-h3">{step.t}</h3>
                <p>{step.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="site-section site-band">
        <div className="site-container">
          <div className="site-split">
            <div className="site-stack">
              <p className="site-eyebrow">Built-in quality</p>
              <h2 className="site-h2">Checked twice before it reaches you</h2>
              <p className="site-p">
                Quality is part of the workflow. Nothing is delivered until it has passed both a peer review and a
                final QA check.
              </p>
            </div>
            <div className="site-card">
              <ul className="site-list">
                {service.quality.map((item) => (
                  <li key={item}>
                    <ShieldCheck size={18} aria-hidden="true" />
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
          <SectionHead eyebrow="Questions" title="Good to know before you start" />
          <div className="site-faq">
            {service.faqs.map((faq) => (
              <details key={faq.q}>
                <summary>{faq.q}</summary>
                <p>{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="site-section site-band">
        <div className="site-container">
          <SectionHead eyebrow="Explore more" title="Other services" />
          <div className="site-grid site-grid--3">
            {related.map((service) => (
              <ServiceCard key={service.slug} service={service} />
            ))}
          </div>
        </div>
      </section>

      <section className="site-section">
        <div className="site-container">
          <CtaBand
            title={`Ready to talk about ${service.title.toLowerCase()}?`}
            text="Send us your requirements or a sample of your data or brief. We will come back with a scoped quote and a proposed pilot."
            primary={{ label: "Request a quote", href: quote }}
            secondary={{ label: "See how we work", href: "/how-we-work" }}
          />
        </div>
      </section>
    </main>
  );
}
