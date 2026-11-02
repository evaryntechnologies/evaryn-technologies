import "server-only";
import Link from "next/link";
import { connection } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ArrowUpRight } from "lucide-react";

// TaskCategory is the existing Super Admin editable service/category source.
// Do not expose internal pay rates or billing settings on the public website.
const descriptions: Record<string, string> = {
  "lidar annotation": "3D point-cloud labeling, object localization and spatial annotation for perception workflows.",
  "3d point cloud annotation": "Structured 3D object labeling, classification and scene understanding.",
  "2d bounding box annotation": "Object detection datasets with consistent box labeling and review.",
  "polygon annotation": "Precise object boundaries for computer-vision training datasets.",
  "semantic segmentation": "Pixel-level scene classification with project-defined taxonomies.",
  "instance segmentation": "Individual object masks for detailed image and video understanding.",
  "image classification": "Consistent image tagging against your defined categories.",
  "video annotation": "Frame-level and temporal event annotation for video AI.",
  "object tracking annotation": "Track objects across frames and evolving visual scenes.",
  "keypoint and pose annotation": "Human pose, skeletal points and landmark annotation.",
  "ocr and document annotation": "Document labeling, transcription and extraction for AI workflows.",
  "audio transcription": "Speech transcription and structured linguistic labels.",
  "speech and audio annotation": "Speaker turns, timestamps, audio events and sound labeling.",
  "natural language processing annotation": "Text classification, entity recognition and linguistic dataset review.",
  "rlhf and ai response evaluation": "Human preference judgments and rubric-based model-response assessment.",
  "llm prompt and response evaluation": "Prompt creation, answer evaluation, factuality and instruction-following review.",
  "data collection for ai": "Project-scoped collection of consented data under agreed guidelines.",
  "egocentric video collection": "First-person video capture programs with defined guidelines and privacy safeguards.",
  "data quality assurance": "Independent quality checks, sampling and annotation consistency reviews.",
  "data labeling and annotation": "Managed human-in-the-loop labeling for multimodal AI datasets.",
};

export default async function LiveServiceCatalog() {
  await connection();
  const categories = await prisma.taskCategory.findMany({
    where: { active: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  return (
    <section className="mx-auto max-w-[1240px] px-5 py-10 sm:px-8 lg:py-12">
      <p className="text-xs font-bold uppercase tracking-[.15em] text-[var(--ev-accent-text)]">Live service catalog</p>
      <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">Explore our individual services</h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--ev-muted)] sm:text-base">
        Browse our current service categories, including specialized AI training data tasks. Need a tailored workflow? Tell us about your project and quality requirements.
      </p>
      {categories.length ? (
        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/custom-request?category=${encodeURIComponent(category.name)}`}
              className="group rounded-xl border border-[var(--ev-border)] bg-[var(--ev-surface)] p-5 transition hover:border-[var(--ev-accent-text)]"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold leading-6">{category.name}</h3>
                <ArrowUpRight size={17} className="shrink-0 text-[var(--ev-accent-text)]" />
              </div>
              <p className="mt-2 text-sm leading-6 text-[var(--ev-muted)]">
                {descriptions[category.name.trim().toLowerCase()] ?? `Request a tailored ${category.name.toLowerCase()} delivery plan with agreed scope and quality review.`}
              </p>
              <span className="mt-4 inline-block text-sm font-semibold text-[var(--ev-accent-text)]">Discuss this service</span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="mt-6 text-sm text-[var(--ev-muted)]">Our catalog is being updated. Contact us for a custom proposal.</p>
      )}
    </section>
  );
}
