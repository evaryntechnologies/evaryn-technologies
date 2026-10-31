import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { services } from "@/lib/services";
import ServiceCard from "@/components/ui/ServiceCard";

export const metadata: Metadata = {
  title: "Our Services",
  description:
    "Explore writing, data annotation and video editing services from Evaryn Technologies Limited.",
};

export default function ServicesPage() {
  return (
    <main className="min-h-screen bg-[#F3F7FC] text-[#071327] dark:bg-[#071327] dark:text-white">
      <section className="bg-gradient-to-br from-[#071327] via-[#002B7F] to-[#0052CC] px-6 py-20 text-white md:py-28">
        <div className="mx-auto w-full max-w-[1400px]">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-cyan-300">
            What we offer
          </p>

          <h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
            Professional services.
            <span className="mt-2 block text-[#00C6FF]">
              Built around your needs.
            </span>
          </h1>

          <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-200">
            From technical documentation to advanced data
            annotation and video post-production, we bring
            together skilled professionals and clear workflows
            to support your projects.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1400px] px-6 py-20 md:px-8">
        <div className="mb-10">
          <p className="text-sm font-bold uppercase tracking-widest text-[#0052CC] dark:text-cyan-300">
            Explore our expertise
          </p>
          <h2 className="mt-4 text-3xl font-bold md:text-4xl">
            Our core services
          </h2>
          <p className="mt-4 max-w-2xl leading-7 text-slate-600 dark:text-slate-300">
            Select a service to learn more about what we
            deliver and how to request a quotation.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service) => (
            <ServiceCard
              key={service.slug}
              service={service}
            />
          ))}
        </div>
      </section>

      <section className="px-6 pb-20 md:px-8">
        <div className="mx-auto w-full max-w-[1400px] rounded-3xl bg-[#002B7F] px-7 py-12 text-white md:px-14 md:py-16">
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-cyan-300">
                Custom solutions
              </p>
              <h2 className="mt-4 text-3xl font-bold">
                Need something we do not list?
              </h2>
              <p className="mt-4 max-w-xl leading-7 text-slate-200">
                Tell us about your requirements and the
                type of support your project needs.
              </p>
            </div>

            <Link
              href="/custom-request"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#00AEEF] px-7 py-4 font-semibold text-[#071327] transition hover:bg-[#00C6FF]"
            >
              Request a custom service
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
