import "server-only";
import { prisma } from "@/lib/db/prisma";
import { careers } from "@/lib/careers";

export async function getOpenCareerSlugs(): Promise<string[]> {
 const rows = await prisma.$queryRaw<Array<{slug:string}>>`
   SELECT "slug" FROM public."HiringOpening" WHERE "isOpen" = true`;
 const allowed = new Set(careers.map(job => job.slug));
 return rows.map(row=>row.slug).filter(slug=>allowed.has(slug));
}
