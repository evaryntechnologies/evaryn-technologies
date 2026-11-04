import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Us | Evaryn Technologies",
  description:
    "Learn about Evaryn Technologies, our mission, vision, values, and commitment to reliable technology-enabled business solutions.",
};

const values = [
  {
    title: "Quality",
    description:
      "We place care, consistency, and attention to detail at the center of the work we deliver.",
  },
  {
    title: "Integrity",
    description:
      "We value transparency, accountability, and responsible business relationships.",
  },
  {
    title: "Collaboration",
    description:
      "We believe successful projects begin with understanding client needs and working toward shared goals.",
  },
  {
    title: "Continuous Improvement",
    description:
      "We strive to refine our processes, strengthen our capabilities, and adapt to evolving requirements.",
  },
];

export default function AboutPage() {
  return (
    <main className="text-[var(--ev-ink)]">
      <section className="relative overflow-hidden px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <span className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--ev-accent-text)]">
            About Evaryn Technologies
          </span>

          <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            Technology-driven solutions. People-centered delivery.
          </h1>

          <p className="mt-7 max-w-3xl text-lg leading-8 text-[var(--ev-muted)]">
            Evaryn Technologies is a technology-focused company committed
            to helping businesses manage complex work through dependable
            services, structured processes, and a focus on quality.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/services"
              className="rounded-xl bg-[var(--ev-accent-text)] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-85"
            >
              Explore Our Services
            </Link>
            <Link
              href="/contact"
              className="rounded-xl border border-current/20 px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-70"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      <section className="px-5 py-14 sm:px-8">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-[var(--ev-accent-text)]">
              Who We Are
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight">
              Built around purposeful work
            </h2>
          </div>
          <div className="space-y-5 text-base leading-8 text-[var(--ev-muted)]">
            <p>
              We recognize that businesses need more than technical
              capabilities. They need dependable execution, clear
              communication, and solutions that respond to their
              operational priorities.
            </p>
            <p>
              Our approach brings together people, technology, and
              organized workflows to support projects that require
              accuracy, coordination, and accountability.
            </p>
          </div>
        </div>
      </section>

      <section className="px-5 py-14 sm:px-8">
        <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-2">
          <article className="rounded-2xl border border-current/10 bg-[var(--ev-accent-text)]/[0.05] p-8 sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-widest text-[var(--ev-accent-text)]">
              Our Mission
            </p>
            <h2 className="mt-4 text-2xl font-semibold">
              Delivering work that matters
            </h2>
            <p className="mt-4 leading-8 text-[var(--ev-muted)]">
              To provide reliable, quality-focused services that help
              organizations accomplish their goals through effective
              collaboration and responsible execution.
            </p>
          </article>

          <article className="rounded-2xl border border-current/10 bg-[var(--ev-accent-text)]/[0.05] p-8 sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-widest text-[var(--ev-accent-text)]">
              Our Vision
            </p>
            <h2 className="mt-4 text-2xl font-semibold">
              Progress through innovation
            </h2>
            <p className="mt-4 leading-8 text-[var(--ev-muted)]">
              To build a trusted technology services organization
              recognized for its adaptability, professionalism, and
              commitment to meaningful client outcomes.
            </p>
          </article>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-[var(--ev-accent-text)]">
            What Guides Us
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight">
            Our Core Values
          </h2>

          <div className="mt-9 grid gap-5 sm:grid-cols-2">
            {values.map((value, index) => (
              <article
                key={value.title}
                className="rounded-2xl border border-current/10 p-7 sm:p-8"
              >
                <span className="text-sm font-semibold text-[var(--ev-accent-text)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 text-xl font-semibold">
                  {value.title}
                </h3>
                <p className="mt-3 leading-7 text-[var(--ev-muted)]">
                  {value.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-6xl rounded-3xl border border-current/10 bg-[var(--ev-accent-text)]/[0.05] px-7 py-12 text-center sm:px-12">
          <h2 className="text-3xl font-semibold tracking-tight">
            Let us build what comes next
          </h2>
          <p className="mx-auto mt-5 max-w-2xl leading-8 text-[var(--ev-muted)]">
            Whether you are exploring a new project or looking for a
            dependable delivery partner, we welcome the opportunity
            to understand your needs.
          </p>
          <Link
            href="/contact"
            className="mt-7 inline-flex rounded-xl bg-[var(--ev-accent-text)] px-7 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-85"
          >
            Get in Touch
          </Link>
        </div>
      </section>
    </main>
  );
}
