import React from "react";
import Link from "next/link";

const SERVICES = [
  {
    title: "Multimodal Data Annotation",
    slug: "/services/data-annotation",
    badge: "AI & RLHF Ready",
    description:
      "High-precision computer vision bounding boxes, semantic segmentation, audio prosody transcription, and RLHF rubric alignment.",
  },
  {
    title: "Technical Writing & Documentation",
    slug: "/services/technical-writing",
    badge: "Engineering Grade",
    description:
      "API references, system architecture manuals, research synthesis, and developer-focused documentation crafted by domain specialists.",
  },
  {
    title: "Editorial & Non-Technical Content",
    slug: "/services/non-technical-writing",
    badge: "Brand & Strategy",
    description:
      "Structured research articles, executive whitepapers, and conversion-focused digital copy tailored for global audiences.",
  },
  {
    title: "Commercial Video Post-Production",
    slug: "/services/video-editing",
    badge: "4K Studio Pipeline",
    description:
      "Frame-accurate editing, motion graphics, color grading, and multi-platform broadcast formatting with rapid turnaround.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#090A0F] text-slate-100">
      <section className="relative overflow-hidden pt-20 pb-28 border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
            Enterprise Expert-in-the-Loop & Digital Execution
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.12]">
            Precision Workforce Pipelines for{" "}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              AI & Modern Enterprises
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Evaryn Technologies combines multi-stage quality assurance, vetted domain specialists, and real-time operational telemetry to deliver high-accuracy data annotation, technical writing, and media production.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/custom-request"
              className="px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-xl shadow-blue-600/25 transition"
            >
              Configure a Custom Project →
            </Link>
            <Link
              href="/portal/login"
              className="px-6 py-3.5 rounded-2xl bg-[#12141C] hover:bg-white/[0.08] border border-white/15 text-slate-200 font-semibold text-sm transition"
            >
              Access Workforce Portal
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { stat: "99.2%", label: "QA Acceptance Rate" },
              { stat: "3-Stage", label: "Tasker → Reviewer → QA" },
              { stat: "24/7", label: "Managed Pipeline Telemetry" },
              { stat: "ISO-Aligned", label: "Role-Based Access Control" },
            ].map((item, i) => (
              <div
                key={i}
                className="p-4 rounded-2xl bg-[#12141C]/90 border border-white/[0.07]"
              >
                <div className="text-xl sm:text-2xl font-bold text-white">{item.stat}</div>
                <div className="text-xs text-slate-400 mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-blue-400">
              Core Capabilities
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2">
              Managed Delivery Pipelines
            </h2>
          </div>
          <Link
            href="/services"
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 mt-4 md:mt-0"
          >
            Compare All Service SLAs →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {SERVICES.map((s) => (
            <Link
              key={s.slug}
              href={s.slug}
              className="group bento-card p-7 bg-[#12141C] border border-white/[0.08] rounded-3xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 rounded-full text-[11px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {s.badge}
                  </span>
                  <span className="text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all">
                    →
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition">
                  {s.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                  {s.description}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/[0.06] text-xs font-medium text-slate-300">
                Explore workflow specifications
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
