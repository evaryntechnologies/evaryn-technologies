import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, BadgeCheck, ClipboardCheck, Wallet } from "lucide-react";

export const metadata: Metadata = {
  title: "Join the Evaryn Expert Network",
  description: "Apply to join Evaryn's vetted network of annotators, writers and editors. Applications are reviewed before access to work is granted.",
};

const points = [
  { Icon: ClipboardCheck, title: "Clear guidelines", text: "Every task comes with written standards and examples, so you know what good looks like." },
  { Icon: BadgeCheck, title: "Reviewed, then trusted", text: "Applications are vetted before access is granted, and quality is tracked on every batch." },
  { Icon: Wallet, title: "Reliable payment", text: "Approved work is recorded and paid through the platform, with a clear history of what you have done." },
];

export default function ExpertsHome() {
  return (
    <main className="ev2-page">
      <section className="ev2-inner-hero">
        <div className="ev2-shell">
          <span className="ev2-kicker">Evaryn expert network</span>
          <h1>Skilled work,<br /><em>clear standards.</em></h1>
          <p>Join our network of vetted professionals working on AI data, writing and video projects for international clients. Applications are reviewed before access to work is granted.</p>
          <div className="ev2-actions">
            <Link className="ev2-primary" href="/experts/register">Apply as an expert <ArrowUpRight size={17} /></Link>
            <Link className="ev2-secondary" href="/experts/login">Expert login</Link>
          </div>
        </div>
      </section>
      <section className="ev2-section ev2-shell">
        <div className="ev2-service-grid">
          {points.map(({ Icon, title, text }) => (
            <article className="ev2-benefit" key={title}>
              <span className="ev2-icon"><Icon size={24} aria-hidden="true" /></span>
              <h3>{title}</h3><p>{text}</p>
            </article>
          ))}
        </div>
        <Link className="ev2-textlink" href="/careers">See current opportunities <ArrowUpRight size={16} /></Link>
      </section>
    </main>
  );
}
