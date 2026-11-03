import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Service } from "@/lib/services";
import ServiceIcon from "@/components/ui/ServiceIcon";

export default function ServiceCard({ service }: { service: Service }) {
  return (
    <Link href={`/services/${service.slug}`} className="site-card">
      <span className="site-icon">
        <ServiceIcon name={service.icon} />
      </span>
      <span className="site-tag">{service.group}</span>
      <h3 className="site-h3">{service.title}</h3>
      <p>{service.shortDescription}</p>
      <span className="site-card__more">
        Explore service <ArrowRight size={17} aria-hidden="true" />
      </span>
    </Link>
  );
}
