import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { ArrowLeft } from "lucide-react";
import ApplicationPreview from "@/components/forms/ApplicationPreview";
import { getHiringCategories } from "@/lib/recruitment-openings";

export const metadata: Metadata = {
  title: "Apply",
  description: "Employment application information for Evaryn Technologies Limited.",
};

async function ApplyContent() {
  await connection();
  const openCareers = (await getHiringCategories()).filter((job) => job.isOpen);
  return (
    <main>
      <section className="site-hero">
        <div className="site-container">
          <div className="site-hero__copy">
            <p className="site-eyebrow">Careers</p>
            <h1 className="site-h1">Apply to Evaryn</h1>
            <p className="site-lead">
              When openings are available, use this page to share your experience, portfolio and CV.
            </p>
          </div>
        </div>
      </section>
      <section className="site-section">
        <div className="site-container">
          <Link href="/careers" className="site-link">
            <ArrowLeft size={17} aria-hidden="true" /> Back to Careers
          </Link>
          <div style={{ marginTop: "2rem" }}>
            <Suspense fallback={<div className="site-card">Loading the application form...</div>}>
              <ApplicationPreview openCareers={openCareers} />
            </Suspense>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function ApplyPage() {
  return (
    <Suspense fallback={<main className="site-section"><div className="site-container">Loading application form...</div></main>}>
      <ApplyContent />
    </Suspense>
  );
}
