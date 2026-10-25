import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ServiceDetail from "@/components/ui/ServiceDetail";
import { getService } from "@/lib/services";

export const metadata: Metadata = {
  title: "Data Annotation",
};

export default function Page() {
  const service = getService("data-annotation");

  if (!service) {
    notFound();
  }

  return <ServiceDetail service={service} />;
}
