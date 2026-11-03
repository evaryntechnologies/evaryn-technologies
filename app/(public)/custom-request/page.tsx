import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckCircle2 } from "lucide-react";
import ClientInquiryForm from "@/components/forms/ClientInquiryForm";

export const metadata: Metadata = {
  title: "Request a Custom Service",
  description:
    "Need something outside our standard services? Describe your requirement and we will scope it with you.",
};

const include = [
  "What you need done, and what a good result looks like",
  "The volume or size of the work",
  "Your deadline or delivery schedule",
  "Any examples, guidelines or reference links",
  "Anything sensitive we should know about handling",
];

export default function CustomRequestPage() {
  return (
    <main>
      <section className="site-hero">
        <div className="site-container">
          <div className="site-hero__copy">
            <p className="site-eyebrow">Custom service</p>
            <h1 className="site-h1">
              Need something we do not list?
              <span className="site-accent">Tell us. We will scope it.</span>
            </h1>
            <p className="site-lead">
              Some of our best projects started as a request that did not fit a menu. If it suits our teams and our
              quality process, we will shape a service around it.
            </p>
          </div>
        </div>
      </section>

      <section className="site-section">
        <div className="site-container">
          <div className="site-split site-split--wide-right">
            <div className="site-stack" style={{ gap: "1.5rem" }}>
              <p className="site-eyebrow">Helpful to include</p>
              <h2 className="site-h2">The more we know, the faster we can quote</h2>
              <ul className="site-list">
                {include.map((t) => (
                  <li key={t}>
                    <CheckCircle2 size={18} aria-hidden="true" />
                    {t}
                  </li>
                ))}
              </ul>
              <p className="site-p">
                We review every request and reply with a scope and a proposed way to start, usually a small pilot.
              </p>
            </div>
            <div className="site-form-wrap">
              <Suspense fallback={<div className="site-card">Loading the request form...</div>}>
                <ClientInquiryForm kind="custom" />
              </Suspense>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
