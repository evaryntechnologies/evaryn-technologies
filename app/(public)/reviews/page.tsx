import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, ClipboardCheck, MessageSquareQuote, PackageCheck, ShieldCheck } from "lucide-react";
import { publishedReviews } from "@/lib/public-showcase";

export const metadata: Metadata = {
  title: "Feedback & Reviews | Evaryn Technologies Limited",
  description: "How Evaryn collects client ratings on every delivery, and the verified feedback clients have allowed us to publish.",
};

const how = [
  { Icon: PackageCheck, title: "Every delivery is rated", text: "When an order passes our quality checks and reaches the client, they rate it from their own workspace." },
  { Icon: ShieldCheck, title: "Ratings reach the whole team", text: "The score is attributed to every specialist who worked on the order: producer, reviewer and quality assurance." },
  { Icon: MessageSquareQuote, title: "Published only with permission", text: "A testimonial appears here only after the client who gave it has verified and approved the wording." },
];

export default function Reviews() {
  const hasReviews = publishedReviews.length > 0;
  return (
    <main className="ev2-page">
      <section className="ev2-inner-hero">
        <div className="ev2-shell">
          <span className="ev2-kicker">Feedback & reviews</span>
          <h1>Trust is earned<br /><em>one delivery at a time.</em></h1>
          <p>Our clients rate every delivery, and that rating follows the work back to the people who produced it. Here is how it works, and what clients have allowed us to share.</p>
        </div>
      </section>

      {hasReviews && (
        <section className="ev2-section ev2-shell" aria-labelledby="voices">
          <span className="ev2-kicker">In their words</span>
          <h2 id="voices">What clients say about working with us.</h2>
          <div className="ev2-two-col" style={{ marginTop: "2.5rem" }}>
            {publishedReviews.map((r) => (
              <blockquote className="ev2-card" key={r.id}>
                <MessageSquareQuote size={28} aria-hidden="true" style={{ color: "var(--ev-amethyst-text)" }} />
                <p className="ev2-quote">“{r.quote}”</p>
                <footer style={{ color: "var(--ev-muted)", fontWeight: 650 }}>{r.attribution}</footer>
              </blockquote>
            ))}
          </div>
        </section>
      )}

      <section className={`ev2-section ${hasReviews ? "ev2-section-tinted" : "ev2-shell"}`} aria-labelledby="how">
        <div className={hasReviews ? "ev2-shell" : undefined}>
          <span className="ev2-kicker">How feedback works</span>
          <h2 id="how">A rating loop built into delivery.</h2>
          <div className="ev2-service-grid" style={{ marginTop: "2.5rem" }}>
            {how.map(({ Icon, title, text }) => (
              <article className="ev2-benefit" key={title}>
                <span className="ev2-icon"><Icon size={24} aria-hidden="true" /></span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {!hasReviews && (
        <section className="ev2-section ev2-shell" aria-labelledby="verified" style={{ paddingTop: 0 }}>
          <div className="ev2-card ev2-empty">
            <ClipboardCheck size={30} aria-hidden="true" style={{ color: "var(--ev-accent-text)" }} />
            <h2 id="verified">Only verified feedback is published here.</h2>
            <p>Every testimonial on this page is checked and approved by the client who gave it. No placeholders and no invented endorsements. To see how we work first-hand, ask our team about a scoped pilot.</p>
            <Link className="ev2-textlink" href="/contact">Ask about a pilot <ArrowUpRight size={16} /></Link>
          </div>
        </section>
      )}
    </main>
  );
}
