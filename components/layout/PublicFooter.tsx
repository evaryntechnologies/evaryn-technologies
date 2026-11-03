import Link from "next/link";
import { MapPin, Mail, Phone } from "lucide-react";
import BrandLogo from "@/components/brand/BrandLogo";
import { services } from "@/lib/services";
import { site } from "@/lib/site";

const company = [
  { label: "How we work", href: "/how-we-work" },
  { label: "Why Evaryn", href: "/why-evaryn" },
  { label: "Investors", href: "/investors" },
  { label: "Careers", href: "/careers" },
];

export default function PublicFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__top" aria-hidden="true" />
      <div className="site-container">
        <div className="site-footer__grid">
          <div className="site-footer__brand">
            <BrandLogo tone="dark-surface" />
            <p>
              Quality-assured AI training data, content and video, delivered by trained specialists and checked
              twice before it reaches you.
            </p>
            <p style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <MapPin size={16} aria-hidden="true" /> {site.location}
            </p>
          </div>

          <nav aria-label="Services">
            <h2>Services</h2>
            {services.map((service) => (
              <Link key={service.slug} href={`/services/${service.slug}`}>
                {service.title}
              </Link>
            ))}
          </nav>

          <nav aria-label="Company">
            <h2>Company</h2>
            {company.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>

          <nav aria-label="Get in touch">
            <h2>Get in touch</h2>
            <Link href="/contact">Request a quote</Link>
            <Link href="/custom-request">Custom service request</Link>
            {site.contactEmail && (
              <a href={`mailto:${site.contactEmail}`} style={{ display: "inline-flex", gap: "0.5rem", alignItems: "center" }}>
                <Mail size={15} aria-hidden="true" /> {site.contactEmail}
              </a>
            )}
            {site.contactPhone && (
              <a href={`tel:${site.contactPhone.replace(/\s+/g, "")}`} style={{ display: "inline-flex", gap: "0.5rem", alignItems: "center" }}>
                <Phone size={15} aria-hidden="true" /> {site.contactPhone}
              </a>
            )}
            <Link href="/portal/login">Staff login</Link>
          </nav>
        </div>

        <div className="site-footer__legal">
          &copy; 2026 {site.name}. All rights reserved. {site.tagline}
        </div>
      </div>
    </footer>
  );
}
