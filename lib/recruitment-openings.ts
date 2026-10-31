import "server-only";
import { prisma } from "@/lib/db/prisma";

export type HiringCategory = { slug: string; title: string; summary: string; requirements: string[]; isOpen: boolean };

// UUID-based slugs survive category renames and avoid collisions.
export function hiringSlug(categoryId: string) { return `category-${categoryId}`; }

export async function getHiringCategories(): Promise<HiringCategory[]> {
  const categories = await prisma.taskCategory.findMany({
    where: { active: true }, select: { id: true, name: true }, orderBy: { name: "asc" },
  });
  const openingRows = await prisma.$queryRaw<Array<{slug:string;isOpen:boolean}>>`
    SELECT "slug", "isOpen" FROM public."HiringOpening"`;
  const openBySlug = new Map(openingRows.map(row => [row.slug, row.isOpen]));
  // Preserve previously configured hiring switches for the original four roles.
  const previousSlugs: Record<string, string> = {
    "technical writer": "technical-writer",
    "content writer": "content-writer",
    "data annotator": "data-annotator",
    "video editor": "video-editor",
  };
  return categories.map(category => ({
    slug: hiringSlug(category.id), title: category.name,
    summary: `Apply to work on ${category.name} projects with Evaryn Technologies.`,
    requirements: ["Relevant experience in this category", "Ability to follow project guidelines", "Commitment to quality and deadlines"],
    isOpen: (openBySlug.get(hiringSlug(category.id)) ??
      openBySlug.get(previousSlugs[category.name.trim().toLowerCase()] ?? "")) === true,
  }));
}

export async function getOpenCareerSlugs(): Promise<string[]> {
  return (await getHiringCategories()).filter(job => job.isOpen).map(job => job.slug);
}
