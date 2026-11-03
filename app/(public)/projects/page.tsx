import Link from "next/link";
import type { Metadata } from "next";
import { publishedProjects, publishedReviews } from "@/lib/public-showcase";

export const metadata: Metadata = {
  title: "Projects & Client Reviews | Evaryn Technologies Limited",
  description: "Explore published Evaryn Technologies projects, verified client feedback and ways to collaborate with our team.",
};

export default function ProjectsPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-14 text-[var(--ev-ink)] md:px-8 md:py-20">
      <header className="mb-12 max-w-3xl space-y-5">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--ev-accent-text)]">Our work</p>
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Projects & Client Reviews</h1>
        <p className="text-lg leading-relaxed opacity-80">Explore work we have permission to share and feedback from clients who have authorized publication. We prioritize accuracy, confidentiality and clear outcomes.</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/work-with-us" className="rounded-xl bg-[#0052CC] px-5 py-3 font-semibold text-white hover:bg-[#003F9E]">Work With Us</Link>
          <Link href="/contact" className="rounded-xl border border-[var(--ev-border)] px-5 py-3 font-semibold hover:bg-[var(--ev-surface-2)]">Contact our team</Link>
        </div>
      </header>
      <section aria-labelledby="projects-heading" className="space-y-5">
        <h2 id="projects-heading" className="text-2xl font-bold">Selected projects</h2>
        {publishedProjects.length ? (
          <div className="grid gap-5 md:grid-cols-2">
            {publishedProjects.map((p) => (
              <article key={p.slug} className="rounded-2xl border border-[var(--ev-border)] bg-[var(--ev-surface)] p-6 shadow-sm">
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[var(--ev-accent-text)]">{p.category}</p>
                <h3 className="text-xl font-bold">{p.title}</h3>
                <p className="mt-4"><strong>Challenge:</strong> {p.challenge}</p>
                <p className="mt-3"><strong>Our approach:</strong> {p.approach}</p>
                <p className="mt-3"><strong>Outcome:</strong> {p.outcome}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-[var(--ev-border)] bg-[var(--ev-surface)] p-8">
            <p className="font-semibold">Our public project portfolio is being curated.</p>
            <p className="mt-2 opacity-75">We only publish project details after confirming accuracy and obtaining permission where necessary. Contact our team to discuss relevant experience and capabilities.</p>
          </div>
        )}
      </section>
      <section aria-labelledby="reviews-heading" className="mt-14 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="reviews-heading" className="text-2xl font-bold">Client reviews</h2>
          <Link href="/reviews" className="font-semibold text-[var(--ev-accent-text)] underline underline-offset-4">Reviews page</Link>
        </div>
        {publishedReviews.length ? (
          <div className="grid gap-5 md:grid-cols-2">
            {publishedReviews.map((r) => (
              <blockquote key={r.id} className="rounded-2xl border border-[var(--ev-border)] bg-[var(--ev-surface)] p-6">
                <p className="leading-relaxed">“{r.quote}”</p>
                <footer className="mt-4 text-sm font-semibold">— {r.attribution}</footer>
              </blockquote>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-[var(--ev-border)] bg-[var(--ev-surface)] p-8">
            <p className="font-semibold">Verified client feedback will appear here.</p>
            <p className="mt-2 opacity-75">We do not publish unverified testimonials.</p>
          </div>
        )}
      </section>
      <section className="mt-14 rounded-2xl bg-[#081D38] p-7 text-white md:p-10">
        <h2 className="text-2xl font-bold">Discuss your next project</h2>
        <p className="mt-3 max-w-2xl text-[#D0E6FA]">Tell us what you are building. We can help scope your requirements and recommend an appropriate delivery approach.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="https://wa.me/254712798426" target="_blank" rel="noopener noreferrer" className="rounded-xl bg-[#0052CC] px-5 py-3 font-semibold">WhatsApp</a>
          <a href="mailto:contact@evaryninc.com" className="rounded-xl border border-[#7EA9D0] px-5 py-3 font-semibold">Email us</a>
          <a href="https://www.linkedin.com/evaryntechnologies" target="_blank" rel="noopener noreferrer" className="rounded-xl border border-[#7EA9D0] px-5 py-3 font-semibold">LinkedIn</a>
        </div>
      </section>
    </main>
  );
}
