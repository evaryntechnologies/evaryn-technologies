import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { ArrowRight, CalendarCheck2, ClipboardCheck, Clock3, Rocket, ShieldCheck, TrendingUp } from "lucide-react";
import { getHiringCategories } from "@/lib/recruitment-openings";
import SectionHead from "@/components/public/SectionHead";

export const metadata: Metadata = {
  title: "Careers",
  description:
    "Skilled, project-based work with clear standards, a path from specialist to reviewer to QA, and scheduled pay. Explore open roles at Evaryn Technologies.",
};

const benefits = [
  { title: "Work on your terms", detail: "Project-based opportunities with defined deliverables you can plan around.", Icon: Clock3 },
  { title: "Twice-monthly pay schedule", detail: "Scheduled payments on the 5th and 20th for eligible completed work, with your earnings visible in your portal.", Icon: CalendarCheck2 },
  { title: "Clear standards", detail: "Defined expectations, written guidelines and quality checks at each stage, so you know what good looks like.", Icon: ClipboardCheck },
  { title: "Room to grow", detail: "A real progression from specialist to Review and QA roles, based on the quality of your work.", Icon: TrendingUp },
  { title: "Fair, transparent assessment", detail: "Reviews and ratings are recorded and visible to you, and strong results lead to more work.", Icon: ShieldCheck },
  { title: "Work on AI and media projects", detail: "Be part of data annotation, content and video work for clients building the next generation of products.", Icon: Rocket },
];

async function CareerContent() {
  await connection();
  const careers = await getHiringCategories();
  const openCareers = careers.filter((job) => job.isOpen);

  return (
    <main>
      <section className="site-hero">
        <div className="site-container">
          <div className="site-hero__copy">
            <p className="site-eyebrow">Careers at Evaryn</p>
            <h1 className="site-h1">
              Build your career with Evaryn.
              <span className="site-accent">Skilled work, clear standards, reliable pay.</span>
            </h1>
            <p className="site-lead">
              Join a team built around innovation, people and progress. We train, support and reward people who
              care about quality, and we promote them when they deliver it.
            </p>
            <div className="site-actions">
              <a href="#openings" className="site-btn site-btn--cyan">
                See open roles <ArrowRight size={18} aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="site-section">
        <div className="site-container">
          <SectionHead eyebrow="Why work with us" title="A place to do good work and be recognised for it" />
          <div className="site-grid site-grid--3">
            {benefits.map(({ title, detail, Icon }) => (
              <div key={title} className="site-card site-card--hover">
                <span className="site-icon"><Icon size={24} aria-hidden="true" /></span>
                <h3 className="site-h3">{title}</h3>
                <p>{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="openings" className="site-section site-band">
        <div className="site-container">
          <SectionHead eyebrow="Opportunities" title="Current openings" />
          {openCareers.length === 0 ? (
            <div className="site-card" role="status">
              <h3 className="site-h3">We are not hiring right now.</h3>
              <p>Please check this page for future opportunities. Applications are currently closed.</p>
            </div>
          ) : (
            <div className="site-grid site-grid--3">
              {openCareers.map((job) => (
                <article key={job.slug} className="site-card site-card--hover">
                  <h3 className="site-h3" style={{ fontSize: "1.3rem" }}>{job.title}</h3>
                  <p>{job.summary}</p>
                  <div>
                    <h4 style={{ fontWeight: 650 }}>What we look for</h4>
                    <ul className="site-list site-list--muted" style={{ marginTop: "0.7rem" }}>
                      {job.requirements.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <Link href={`/apply?role=${encodeURIComponent(job.slug)}`} className="site-btn site-btn--primary" style={{ marginTop: "auto", alignSelf: "flex-start" }}>
                    Apply <ArrowRight size={17} aria-hidden="true" />
                  </Link>
                </article>
              ))}
            </div>
          )}

          <details className="site-faq" style={{ marginTop: "2rem" }}>
            <summary style={{ cursor: "pointer", fontWeight: 650 }}>Learn about our professional categories</summary>
            <div className="site-grid site-grid--3" style={{ marginTop: "1.25rem" }}>
              {careers.map((job) => (
                <div key={job.slug}>
                  <h3 style={{ fontWeight: 650 }}>{job.title}</h3>
                  <p style={{ marginTop: "0.3rem", color: "var(--ev-muted)", lineHeight: 1.6 }}>{job.summary}</p>
                </div>
              ))}
            </div>
          </details>
        </div>
      </section>
    </main>
  );
}

export default function CareersPage() {
  return (
    <Suspense fallback={<main className="site-section"><div className="site-container">Loading careers...</div></main>}>
      <CareerContent />
    </Suspense>
  );
}
