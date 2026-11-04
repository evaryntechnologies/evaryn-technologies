import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, CheckCircle2, ClipboardCheck, Handshake, Layers3 } from "lucide-react";
import { serviceGroups, services } from "@/lib/services";
import ServiceCard from "@/components/ui/ServiceCard";
import SectionHead from "@/components/public/SectionHead";
import CtaBand from "@/components/public/CtaBand";
import { ExtraExpertiseGrid } from "@/components/public/DynamicExpertise";

export const metadata: Metadata = {
  title: "Services: LiDAR Annotation, Egocentric Video, Content Writing, Video Editing",
  description:
    "AI training data (LiDAR annotation, egocentric video collection, data annotation), content writing and video editing, each peer-reviewed and QA-checked before delivery.",
};

const engagement = [
  { Icon: ClipboardCheck, title: "Pilot batch", text: "A small, scoped sample on your own data or brief. You judge our quality, communication and turnaround before committing volume." },
  { Icon: Layers3, title: "Project-based", text: "A defined scope, volume and deadline with a fixed quote. Ideal for one-off datasets, campaigns and documentation sets." },
  { Icon: Handshake, title: "Managed team", text: "A consistent team assigned to your ongoing pipeline, so guidelines, style and quality stay uniform as volume grows." },
];

const industries = [
  "Autonomous vehicles and ADAS",
  "Robotics and automation",
  "AR/VR and wearables",
  "AI and ML platforms",
  "SaaS and developer tools",
  "Media and marketing",
  "Education and research",
  "Retail and e-commerce",
];

const faqs = [
  { q: "How do we get a quote?", a: "Send us your requirements and, if you can, a sample of your data or brief through the contact form. We reply with a scope, a proposed pilot and a quote." },
  { q: "Can we start with a small test?", a: "Yes, and we recommend it. A pilot batch lets you verify quality on your own material before you scale." },
  { q: "What if our requirement is not listed?", a: "Use the custom service request. If it fits our teams and quality process, we will scope it with you." },
  { q: "How do you protect our data?", a: "Work is assigned only to named, vetted team members and we follow the data-handling requirements you set out at scoping." },
];

export default function ServicesPage() {
  return (
    <main>
      <section className="site-hero">
        <div className="site-container">
          <div className="site-hero__grid site-hero__grid--split">
            <div className="site-hero__copy">
              <p className="site-eyebrow">Our services</p>
              <h1 className="site-h1">
                Everything your AI, content and video pipeline needs,
                <span className="site-accent">from one quality-assured partner.</span>
              </h1>
              <p className="site-lead">
                LiDAR annotation, egocentric video collection, data annotation, content writing and video editing,
                each produced by trained specialists and checked twice before delivery.
              </p>
              <div className="site-actions">
                <Link href="/contact" className="site-btn site-btn--cyan">
                  Request a quote <ArrowRight size={18} aria-hidden="true" />
                </Link>
                <Link href="/custom-request" className="site-btn site-btn--ghost-light">
                  Request a custom service
                </Link>
              </div>
            </div>
            <aside className="site-glass" aria-label="How to get started">
              <h2>Not sure where to start?</h2>
              <ul className="site-list" style={{ marginTop: "1.1rem" }}>
                {[
                  "Send us your brief or a data sample",
                  "Get a scoped quote and a proposed pilot",
                  "Review the pilot, then scale with confidence",
                ].map((t) => (
                  <li key={t} style={{ color: "#fff" }}>
                    <CheckCircle2 size={18} aria-hidden="true" style={{ color: "#7bd8ff" }} />
                    {t}
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </div>
      </section>

      {serviceGroups.map((group, index) => (
        <section key={group.group} className={`site-section ${index % 2 === 1 ? "site-band" : ""}`}>
          <div className="site-container">
            <SectionHead eyebrow="Service line" title={group.title} lead={group.blurb} />
            <div className="site-grid site-grid--3">
              {services
                .filter((service) => service.group === group.group)
                .map((service) => (
                  <ServiceCard key={service.slug} service={service} />
                ))}
            </div>
          </div>
        </section>
      ))}

      <section className="site-section">
        <div className="site-container">
          <SectionHead eyebrow="How we engage" title="Work with us the way that suits your stage" />
          <div className="site-grid site-grid--3">
            {engagement.map(({ Icon, title, text }) => (
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
          <SectionHead eyebrow="Who we work with" title="Teams building with data, content and video" />
          <ul className="site-actions" aria-label="Industries">
            {industries.map((name) => (
              <li key={name} className="site-tag" style={{ fontSize: "0.9rem", padding: "0.55rem 1.1rem" }}>{name}</li>
            ))}
          </ul>
        </div>
      </section>

      <Suspense fallback={null}>
        <ExtraExpertiseGrid />
      </Suspense>

      <section className="site-section">
        <div className="site-container">
          <SectionHead eyebrow="Questions" title="Good to know before you start" />
          <div className="site-faq">
            {faqs.map((faq) => (
              <details key={faq.q}>
                <summary>{faq.q}</summary>
                <p>{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="site-section--tight" style={{ paddingBottom: "clamp(3rem,6vw,5rem)" }}>
        <div className="site-container">
          <CtaBand
            title="Need something we do not list?"
            text="Tell us about your requirement and the support your project needs. If it fits our teams and quality process, we will scope it with you."
            primary={{ label: "Request a custom service", href: "/custom-request" }}
            secondary={{ label: "Talk to us", href: "/contact" }}
          />
        </div>
      </section>
    </main>
  );
}
