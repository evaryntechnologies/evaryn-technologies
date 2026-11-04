import LinkedInMark from "@/components/ui/LinkedInMark";
import Link from "next/link";
import BrandLogo from "@/components/brand/BrandLogo";
import { site } from "@/lib/site";
import { services } from "@/lib/services";
import { Mail, MessageCircle, Phone, MapPin } from "lucide-react";

const links = [
  { name: "Services", items: services.map((s) => [s.title, `/services/${s.slug}`] as const) },
  {
    name: "Company",
    items: [
      ["About Evaryn", "/about"],
      ["How we work", "/about#how-we-work"],
      ["Past projects", "/projects"],
      ["Feedback & reviews", "/reviews"],
      ["Partners & investors", "/work-with-us"],
      ["Careers", "/careers"],
    ] as const,
  },
  {
    name: "Access",
    items: [
      ["Client sign up", "/clients/register"],
      ["Client login", "/clients/login"],
      ["Expert sign up", "/experts/register"],
      ["Expert login", "/experts/login"],
    ] as const,
  },
];

export default function PublicFooter() {
  return (
    <footer className="ev2-footer">
      <div className="ev2-shell ev2-footer-grid">
        <div className="ev2-footer-about">
          <Link href="/" aria-label="Evaryn home">
            <BrandLogo tone="dark-surface" />
          </Link>
          <p>Managed AI data, content and video delivery. Written guidelines, a calibrated pilot, and two quality gates on every batch.</p>
          <div className="ev2-social">
            <a href={`https://wa.me/${site.contactPhone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" aria-label="WhatsApp"><MessageCircle size={19} /></a>
            <a href={`mailto:${site.contactEmail}`} aria-label="Email"><Mail size={19} /></a>
            {site.linkedinUrl && <a href={site.linkedinUrl} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><LinkedInMark size={19} /></a>}
          </div>
        </div>
        {links.map((g) => (
          <nav key={g.name} aria-label={g.name}>
            <h2>{g.name}</h2>
            {g.items.map(([t, url]) => <Link href={url} key={t}>{t}</Link>)}
          </nav>
        ))}
        <div className="ev2-footer-contact">
          <h2>Get in touch</h2>
          <a href={`mailto:${site.contactEmail}`}><Mail size={16} /> {site.contactEmail}</a>
          <a href={`tel:${site.contactPhone.replace(/\s/g, "")}`}><Phone size={16} /> {site.contactPhone}</a>
          <a href={`https://wa.me/${site.contactPhone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"><MessageCircle size={16} /> WhatsApp our team</a>
          <span style={{ display: "flex", gap: ".5rem", alignItems: "center", fontSize: ".9rem" }}><MapPin size={16} /> {site.location}</span>
          <Link href="/contact#consultation">Book a consultation</Link>
        </div>
      </div>
      <div className="ev2-shell ev2-footer-bottom" style={{ display: "flex" }}>
        <span>© {new Date().getFullYear()} {site.name}. All rights reserved.</span>
        <span>{site.tagline}</span>
      </div>
    </footer>
  );
}
