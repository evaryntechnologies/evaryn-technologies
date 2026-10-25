import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Workflow,
  Users,
} from "lucide-react";
import type { Service } from "@/lib/services";

export default function ServiceDetail({
  service,
}: {
  service: Service;
}) {
  return (
    <main className="min-h-screen bg-[#F3F7FC] text-[#071327] dark:bg-[#071327] dark:text-white">
      <section className="bg-gradient-to-br from-[#071327] via-[#002B7F] to-[#0052CC] px-6 py-20 text-white md:py-28">
        <div className="mx-auto max-w-7xl">
          <Link
            href="/services"
            className="inline-flex items-center gap-2 text-sm font-medium text-cyan-200 hover:text-white"
          >
            <ArrowLeft size={16} />
            All Services
          </Link>

          <p className="mt-10 text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">
            Evaryn Technologies Limited
          </p>

          <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">
            {service.title}
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
            {service.shortDescription}
          </p>

          <Link
            href={`/contact?service=${encodeURIComponent(service.title)}`}
            className="mt-9 inline-flex items-center gap-2 rounded-xl bg-[#00AEEF] px-7 py-4 font-semibold text-[#071327] transition hover:bg-[#00C6FF]"
          >
            Request a quote
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-12 px-6 py-20 md:grid-cols-2 md:px-8">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-[#0052CC] dark:text-cyan-300">
            About this service
          </p>

          <h2 className="mt-4 text-3xl font-bold">
            Clear solutions, carefully delivered.
          </h2>

          <p className="mt-6 text-base leading-8 text-slate-600 dark:text-slate-300">
            {service.description}
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              { label: "Skilled teams", Icon: Users },
              { label: "Clear workflow", Icon: Workflow },
              { label: "Quality checks", Icon: ShieldCheck },
            ].map(({ label, Icon }) => (
              <div
                key={label}
                className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-[#101F39]"
              >
                <Icon
                  size={22}
                  className="text-[#0052CC] dark:text-cyan-300"
                />
                <p className="mt-3 text-sm font-semibold">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm dark:border-slate-700 dark:bg-[#101F39] md:p-10">
          <h2 className="text-2xl font-bold">
            What we deliver
          </h2>

          <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
            Our services include the following areas
            of professional support.
          </p>

          <ul className="mt-8 space-y-5">
            {service.deliverables.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <CheckCircle2
                  size={21}
                  className="mt-0.5 shrink-0 text-[#00AEEF]"
                />
                <span className="leading-7">{item}</span>
              </li>
            ))}
          </ul>

          <Link
            href={`/contact?service=${encodeURIComponent(service.title)}`}
            className="mt-10 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0052CC] px-6 py-4 text-center font-semibold text-white transition hover:bg-[#003F9E]"
          >
            Request a quote for {service.title}
            <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white px-6 py-16 text-center dark:border-slate-800 dark:bg-[#101F39]">
        <h2 className="text-3xl font-bold">
          Have a project in mind?
        </h2>
        <p className="mx-auto mt-4 max-w-xl leading-7 text-slate-600 dark:text-slate-300">
          Share your requirements with our team and
          let us understand what you need.
        </p>
        <Link
          href={`/contact?service=${encodeURIComponent(service.title)}`}
          className="mt-7 inline-flex items-center gap-2 font-semibold text-[#0052CC] dark:text-cyan-300"
        >
          Get in touch
          <ArrowRight size={18} />
        </Link>
      </section>
    </main>
  );
}
