import type { Metadata } from "next";
import { Suspense } from "react";
import { Clock3, Mail, MapPin, MessageSquareText, Phone, SearchCheck } from "lucide-react";
import ClientInquiryForm from "@/components/forms/ClientInquiryForm";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact and Request a Quote",
  description:
    "Tell us about your project. Share your requirements and a sample if you have one, and we will come back with a scoped quote and a proposed pilot.",
};

const next = [
  { Icon: MessageSquareText, title: "You tell us what you need", text: "Share your requirements, volume and timeline. A sample or example helps a lot." },
  { Icon: SearchCheck, title: "We scope it properly", text: "We review your request and come back with a clear scope, a proposed pilot and a quote." },
  { Icon: Clock3, title: "You decide, no pressure", text: "Review the proposal, ask questions and start with a pilot when you are ready." },
];

export default function ContactPage() {
  return (
    <main>
      <section className="site-hero">
        <div className="site-container">
          <div className="site-hero__copy">
            <p className="site-eyebrow">Contact</p>
            <h1 className="site-h1">
              Let&apos;s scope your project,
              <span className="site-accent">and prove the quality.</span>
            </h1>
            <p className="site-lead">
              Tell us what you are building. We will reply with a scoped quote and a proposed pilot so you can
              judge our work before you commit.
            </p>
          </div>
        </div>
      </section>

      <section className="site-section">
        <div className="site-container">
          <div className="site-split site-split--wide-right">
            <div className="site-stack" style={{ gap: "1.75rem" }}>
              <div>
                <p className="site-eyebrow">What happens next</p>
                <h2 className="site-h2" style={{ marginTop: "0.9rem" }}>Three simple steps</h2>
              </div>
              <ol className="site-grid" style={{ width: "100%" }}>
                {next.map(({ Icon, title, text }) => (
                  <li key={title} className="site-card" style={{ flexDirection: "row", alignItems: "flex-start" }}>
                    <span className="site-icon"><Icon size={22} aria-hidden="true" /></span>
                    <div>
                      <h3 className="site-h3">{title}</h3>
                      <p style={{ marginTop: "0.4rem" }}>{text}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="site-card" style={{ width: "100%" }}>
                <h3 className="site-h3">Prefer to reach us directly?</h3>
                <ul className="site-list site-list--muted">
                  <li><MapPin size={18} aria-hidden="true" /> {site.location}</li>
                  {site.contactEmail && (
                    <li><Mail size={18} aria-hidden="true" /> <a className="site-link" href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a></li>
                  )}
                  {site.contactPhone && (
                    <li><Phone size={18} aria-hidden="true" /> <a className="site-link" href={`tel:${site.contactPhone.replace(/\s+/g, "")}`}>{site.contactPhone}</a></li>
                  )}
                </ul>
                <p>For the fastest response, use the form. It tells us exactly what we need to scope your project.</p>
              </div>
            </div>

            <div className="site-form-wrap">
              <Suspense fallback={<div className="site-card">Loading the inquiry form...</div>}>
                <ClientInquiryForm kind="contact" />
              </Suspense>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
