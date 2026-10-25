import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ServiceDetail from "@/components/ui/ServiceDetail";
import { getService } from "@/lib/services";

export const metadata: Metadata = {
  title: "Technical Writing",
};

export default function Page() {
  const service = getService("technical-writing");

  if (!service) {
    notFound();
  }

  return <ServiceDetail service={service} />;
}
