import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Compass,
  FileText,
  Globe2,
  Handshake,
  MapPin,
  MessageSquare,
  Sparkles,
  Users,
} from "lucide-react";
import { services } from "@/lib/services";
import ServiceCard from "@/components/ui/ServiceCard";

export const metadata: Metadata = {
  title: "Home | Evaryn Technologies Limited",
  description:
    "Evaryn Technologies Limited provides technical writing, content writing, data annotation and video editing services from Nairobi, Kenya.",
};

const navigationCards = [
  {
    title: "Our Services",
    description: "Discover what our skilled teams can deliver.",
    href: "/services",
    Icon: FileText,
  },
  {
    title: "How We Work",
    description: "Explore our structured project delivery process.",
    href: "/how-we-work",
    Icon: Compass,
  },
  {
    title: "Why Evaryn",
    description: "Learn about our values and quality standards.",
    href: "/why-evaryn",
    Icon: Sparkles,
  },
  {
    title: "Custom Services",
    description: "Tell us about your specific project requirements.",
    href: "/custom-request",
    Icon: Handshake,
  },
  {
    title: "Careers",
    description: "Explore opportunities to work with our team.",
    href: "/careers",
    Icon: BriefcaseBusiness,
  },
  {
    title: "Contact Us",
    description: "Start a conversation about your next project.",
    href: "/contact",
    Icon: MessageSquare,
  },
];

export default function Home() {
  return (
    <main className="overflow-x-clip bg-[#F3F7FC] text-[#071327] dark:bg-[#071327] dark:text-white">
      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-[#071327] via-[#002B7F] to-[#0052CC] px-6 py-20 text-white md:py-28">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[url('/watermarks/evaryn-watermark.svg')] bg-right bg-no-repeat opacity-15"
        />

        <div className="relative mx-auto grid w-full items-center gap-14 lg:grid-cols-2">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-white/10 px-4 py-2 text-xs font-semibold tracking-wide text-cyan-100">
              <Sparkles size={15} />
              INNOVATION. PEOPLE. PROGRESS.
            </div>

            <h1 className="mt-8 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Technology-driven solutions.
              <span className="mt-3 block text-[#00C6FF]">
                People-powered excellence.
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-8 text-slate-200 md:text-lg">
              We combine skilled professionals, structured
              workflows and a commitment to quality to deliver
              writing, data annotation and video editing
              services for clients around the world.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl bg-[#00AEEF] px-6 py-4 font-semibold text-[#071327] transition hover:bg-[#00C6FF]"
              >
                Request a quote
                <ArrowRight size={18} />
              </Link>

              <Link
                href="/services"
                className="rounded-xl border border-white/40 px-6 py-4 font-semibold text-white transition hover:bg-white/10"
              >
                Explore our services
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-md md:p-8">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-cyan-200">
                  Our Expertise
                </p>
                <h2 className="mt-2 text-xl font-bold">
                  What we deliver
                </h2>
              </div>
              <Globe2 className="text-[#00C6FF]" size={28} />
            </div>

            <div className="space-y-3">
              {services.map((service) => (
                <Link
                  key={service.slug}
                  href={`/services/${service.slug}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/10 p-4 transition hover:bg-white/20"
                >
                  <span className="text-sm font-semibold">
                    {service.title}
                  </span>
                  <ArrowRight size={17} className="shrink-0 text-cyan-200" />
                </Link>
              ))}
            </div>

            <p className="mt-6 text-sm leading-6 text-slate-200">
              Delivered through clear communication,
              accountable teams and quality-focused processes.
            </p>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="mx-auto w-full px-6 py-20 md:px-8">
        <div className="mb-10 max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#0052CC] dark:text-cyan-300">
            Our Expertise
          </p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
            Professional services for modern businesses
          </h2>
          <p className="mt-5 leading-8 text-slate-600 dark:text-slate-300">
            From specialist documentation to data-intensive
            projects, we provide dependable services designed
            around your requirements.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service) => (
            <ServiceCard key={service.slug} service={service} />
          ))}
        </div>
      </section>

      {/* CAREERS */}
      <section className="px-6 pb-20 md:px-8">
        <div className="mx-auto flex w-full flex-col items-start justify-between gap-8 rounded-3xl border border-cyan-200 bg-[#E7F6FF] p-8 dark:border-[#24496E] dark:bg-[#102D4D] md:flex-row md:items-center md:p-12">
          <div className="flex max-w-2xl items-start gap-5">
            <div className="rounded-2xl bg-white p-4 text-[#0052CC] dark:bg-[#17365B] dark:text-cyan-300">
              <Users size={28} />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-[#0052CC] dark:text-cyan-300">
                Work with Evaryn
              </p>
              <h2 className="mt-3 text-2xl font-bold md:text-3xl">
                Build your future with us
              </h2>
              <p className="mt-4 leading-7 text-slate-600 dark:text-slate-300">
                Explore our professional roles and discover
                opportunities as recruitment openings become available.
              </p>
            </div>
          </div>
          <Link
            href="/careers"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#0052CC] px-6 py-4 font-semibold text-white transition hover:bg-[#003F9E]"
          >
            Explore careers
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* FIND YOUR WAY */}
      <section className="relative isolate overflow-hidden border-y border-slate-200 bg-white px-6 py-20 dark:border-slate-800 dark:bg-[#0C1B33] md:px-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[url('/watermarks/evaryn-watermark.svg')] bg-center bg-no-repeat opacity-[0.035] dark:opacity-[0.08]"
        />
        <div className="relative mx-auto w-full">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#0052CC] dark:text-cyan-300">
            Explore Evaryn
          </p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
            Find your way around
          </h2>
          <p className="mt-5 max-w-2xl leading-7 text-slate-600 dark:text-slate-300">
            Whether you want to request a service, learn more
            about our team or explore careers, start here.
          </p>

          <div className="mt-11 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {navigationCards.map(({ title, description, href, Icon }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-start gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-[#00AEEF] hover:shadow-lg dark:border-slate-700 dark:bg-[#101F39]"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#E7F6FF] text-[#0052CC] dark:bg-[#17365B] dark:text-cyan-300">
                  <Icon size={23} />
                </div>
                <div>
                  <h3 className="text-lg font-bold">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {description}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#0052CC] dark:text-cyan-300">
                    Explore
                    <ArrowRight size={15} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CUSTOM REQUEST */}
      <section className="px-6 py-20 md:px-8">
        <div className="mx-auto flex w-full flex-col items-start justify-between gap-8 rounded-3xl bg-gradient-to-r from-[#071327] to-[#002B7F] p-9 text-white md:flex-row md:items-center md:p-14">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-cyan-300">
              Tailored Solutions
            </p>
            <h2 className="mt-4 text-3xl font-bold">
              Don't see what you need?
            </h2>
            <p className="mt-5 max-w-2xl leading-7 text-slate-200">
              Tell us about your project. We welcome custom
              requests and can discuss requirements beyond
              our listed services.
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
      </section>

      {/* LOCATION */}
      <section className="border-t border-slate-200 bg-white px-6 py-20 dark:border-slate-800 dark:bg-[#0C1B33] md:px-8">
        <div className="mx-auto grid w-full items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-[#0052CC] dark:text-cyan-300">
              Where we are
            </p>
            <h2 className="mt-4 text-3xl font-bold md:text-4xl">
              Based in Nairobi, Kenya.
              <span className="mt-2 block text-[#0052CC] dark:text-cyan-300">
                Connected to the world.
              </span>
            </h2>
            <p className="mt-6 max-w-xl leading-8 text-slate-600 dark:text-slate-300">
              Evaryn Technologies Limited operates from
              Nairobi, Kenya, serving clients through
              professional online collaboration and delivery.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="https://www.google.com/maps/search/?api=1&query=Nairobi%2C%20Kenya"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-[#0052CC] px-6 py-4 font-semibold text-white hover:bg-[#003F9E]"
              >
                Open in Maps
                <ArrowRight size={17} />
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-6 py-4 font-semibold text-[#071327] dark:border-slate-600 dark:text-white"
              >
                Get in touch
              </Link>
            </div>
          </div>

          <div className="relative flex min-h-80 items-center justify-center overflow-hidden rounded-3xl border border-cyan-200 bg-gradient-to-br from-[#E7F6FF] to-[#D5E9FB] dark:border-[#24496E] dark:from-[#102D4D] dark:to-[#071327]">
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[url('/watermarks/evaryn-watermark.svg')] bg-center bg-contain bg-no-repeat opacity-25"
            />
            <div className="relative flex flex-col items-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-8 border-white/70 bg-[#0052CC] text-white shadow-xl dark:border-white/10">
                <MapPin size={42} />
              </div>
              <div className="mt-6 rounded-xl border border-white/70 bg-white/90 px-7 py-4 text-center shadow-lg dark:border-slate-700 dark:bg-[#101F39]">
                <p className="font-bold text-[#071327] dark:text-white">
                  Nairobi, Kenya
                </p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Evaryn Technologies Limited
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
