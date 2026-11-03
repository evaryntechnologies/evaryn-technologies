import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function CtaBand({
  title,
  text,
  primary = { label: "Request a quote", href: "/contact" },
  secondary,
}: {
  title: string;
  text: string;
  primary?: { label: string; href: string };
  secondary?: { label: string; href: string };
}) {
  return (
    <div className="site-cta">
      <div className="site-cta__copy">
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
      <div className="site-actions">
        <Link href={primary.href} className="site-btn site-btn--cyan">
          {primary.label} <ArrowRight size={18} aria-hidden="true" />
        </Link>
        {secondary && (
          <Link href={secondary.href} className="site-btn site-btn--ghost-light">
            {secondary.label}
          </Link>
        )}
      </div>
    </div>
  );
}
