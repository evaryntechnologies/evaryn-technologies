import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ServiceDetail from "@/components/ui/ServiceDetail";
import { getService } from "@/lib/services";

const service = getService("technical-writing");

export const metadata: Metadata = {
  title: service ? `${service.title} Services` : "Service",
  description: service ? `${service.tagline} ${service.shortDescription}` : undefined,
};

export default function Page() {
  if (!service) notFound();
  return <ServiceDetail service={service} />;
}
