import type { MetadataRoute } from "next";
import { services } from "@/lib/services";

const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://evaryn-technologies.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/services", "/how-we-work", "/why-evaryn", "/investors", "/careers", "/contact", "/custom-request"];
  return [
    ...pages.map((path) => ({ url: `${base}${path}`, priority: path === "" ? 1 : 0.8 })),
    ...services.map((service) => ({ url: `${base}/services/${service.slug}`, priority: 0.9 })),
  ];
}
