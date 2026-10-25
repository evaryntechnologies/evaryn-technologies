import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ServiceDetail from "@/components/ui/ServiceDetail";
import { getService } from "@/lib/services";

export const metadata: Metadata = {
  title: "Non Technical Writing",
};

export default function Page() {
  const service = getService("non-technical-writing");

  if (!service) {
    notFound();
  }

  return <ServiceDetail service={service} />;
}
