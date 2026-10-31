import "server-only";
import Link from "next/link";
import { connection } from "next/server";
import { ArrowRight, ArrowUpRight, Layers3 } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { services } from "@/lib/services";

// Stable links only for services that already have a dedicated public detail page.
const existingPages: Record<string, string> = {
  "technical writing": "technical-writing",
  "non-technical writing": "non-technical-writing",
  "content writing": "non-technical-writing",
  "data annotation": "data-annotation",
  "video editing": "video-editing",
};

async function activeExpertise() {
  // Categories must be resolved at request time, not frozen into a build.
  await connection();
  const categories = await prisma.taskCategory.findMany({
    where: { active: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  return categories.map((category) => {
    const slug = existingPages[category.name.trim().toLowerCase()];
    const detail = slug ? services.find((service) => service.slug === slug) : undefined;
    return {
      ...category,
      href: detail ? `/services/${detail.slug}` : `/custom-request?category=${encodeURIComponent(category.name)}`,
      description: detail?.shortDescription ?? `Discuss a ${category.name} project with our team and request a tailored service.`,
    };
  });
}

export async function ExpertiseHeroList() {
  const categories = await activeExpertise();
  if (!categories.length) return <p className="text-sm text-cyan-100">Our available services are being updated. Contact us for a custom project.</p>;
  return (
    <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
      {categories.map((category) => (
        <Link key={category.id} href={category.href} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/10 p-4 transition hover:bg-white/20">
          <span className="text-sm font-semibold">{category.name}</span>
          <ArrowRight size={17} className="shrink-0 text-cyan-200" />
        </Link>
      ))}
    </div>
  );
}

export async function ExpertiseServiceGrid() {
  const categories = await activeExpertise();
  if (!categories.length) return <p className="text-sm text-slate-600 dark:text-slate-300">No active service categories are currently published. Contact us about your project.</p>;
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {categories.map((category) => (
        <Link key={category.id} href={category.href} className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-cyan-200 bg-[#E7F6FF] p-7 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-[#00AEEF] hover:shadow-xl dark:border-[#24496E] dark:bg-[#102D4D]">
          <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-[#0048A8] to-[#00B0F8] transition-transform duration-300 group-hover:scale-x-100" />
          <div className="flex items-start justify-between">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#C9EEFF] text-[#0052CC] dark:bg-[#173F67] dark:text-[#00C6FF]">
              <Layers3 size={27} strokeWidth={1.8} />
            </div>
            <ArrowUpRight size={20} className="text-[#3872A6] transition group-hover:text-[#0052CC] dark:group-hover:text-cyan-300" />
          </div>
          <h3 className="mt-8 text-xl font-bold tracking-tight text-[#07325B] dark:text-cyan-50">{category.name}</h3>
          <p className="mt-4 flex-1 text-sm leading-7 text-[#245377] dark:text-[#BCD9EF]">{category.description}</p>
          <div className="mt-8 border-t border-cyan-200 pt-5 text-sm font-semibold text-[#0052CC] dark:border-[#315779] dark:text-cyan-300">Explore service</div>
        </Link>
      ))}
    </div>
  );
}
