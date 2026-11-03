import Link from "next/link";
import type { Metadata } from "next";
import { publishedReviews } from "@/lib/public-showcase";
export const metadata: Metadata = {
  title: "Client Reviews | Evaryn Technologies Limited",
  description: "Published and approved client feedback about Evaryn Technologies Limited.",
};
export default function ReviewsPage() {
  return <main className="mx-auto w-full max-w-5xl px-5 py-16 text-[var(--ev-ink)] md:px-8">
    <p className="mb-4 text-sm font-bold uppercase tracking-widest text-[var(--ev-accent-text)]">Client feedback</p>
    <h1 className="text-4xl font-bold">Client Reviews</h1>
    <p className="mt-4 max-w-2xl leading-relaxed opacity-80">Only verified feedback shared with permission is published here.</p>
    {publishedReviews.length ? <div className="mt-10 grid gap-5 md:grid-cols-2">{publishedReviews.map((review)=><blockquote key={review.id} className="rounded-xl border border-[var(--ev-border)] bg-[var(--ev-surface)] p-6"><p>“{review.quote}”</p><footer className="mt-4 font-semibold">— {review.attribution}</footer></blockquote>)}</div> : <div className="mt-10 rounded-xl border border-[var(--ev-border)] bg-[var(--ev-surface)] p-7">We are preparing approved client feedback for publication.</div>}
    <Link href="/projects" className="mt-10 inline-block font-semibold text-[var(--ev-accent-text)] underline underline-offset-4">Explore our projects</Link>
  </main>;
}
