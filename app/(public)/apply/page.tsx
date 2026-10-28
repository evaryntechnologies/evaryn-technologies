import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import ApplicationPreview from "@/components/forms/ApplicationPreview";
import { getOpenCareerSlugs } from "@/lib/recruitment-openings";
import { connection } from "next/server";

export const metadata: Metadata = { title: "Apply", description: "Employment application information for Evaryn Technologies Limited." };

async function ApplyContent() {
  await connection();
  const openSlugs = await getOpenCareerSlugs();
  return (
    <main className="min-h-screen bg-[#F3F7FC] text-[#071327] dark:bg-[#071327] dark:text-white">
      <section className="bg-gradient-to-br from-[#071327] via-[#002B7F] to-[#0052CC] px-6 py-16 text-white md:py-24">
        <div className="mx-auto w-full"><p className="text-sm font-bold uppercase tracking-widest text-cyan-200">Careers</p><h1 className="mt-4 text-4xl font-bold md:text-5xl">Apply to Evaryn</h1><p className="mt-5 max-w-2xl leading-8 text-slate-200">When openings are available, use this page to share your experience, portfolio and CV.</p></div>
      </section>
      <section className="mx-auto w-full px-6 py-16"><Link href="/careers" className="font-semibold text-[#0052CC] dark:text-cyan-300">â† Back to Careers</Link><div className="mt-8"><Suspense fallback={<div className="rounded-xl border border-slate-200 bg-white p-8 text-slate-600 dark:border-slate-700 dark:bg-[#101F39] dark:text-slate-300">Loading application formâ€¦</div>}><ApplicationPreview openSlugs={openSlugs} /></Suspense></div></section>
    </main>
  );
}

export default function ApplyPage() {return <Suspense fallback={<main className="min-h-screen p-8">Loading application form…</main>}><ApplyContent/></Suspense>}
