import Link from "next/link";
import {
  ArrowUpRight,
  FileText,
  PenLine,
  Database,
  Clapperboard,
} from "lucide-react";
import type { Service } from "@/lib/services";

const iconMap = {
  file: FileText,
  pen: PenLine,
  database: Database,
  video: Clapperboard,
};

export default function ServiceCard({
  service,
}: {
  service: Service;
}) {
  const Icon = iconMap[service.icon];

  return (
    <Link
      href={`/services/${service.slug}`}
      className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-[#00AEEF] hover:shadow-xl dark:border-slate-700 dark:bg-[#101F39]"
    >
      <div className="flex items-start justify-between">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E7F6FF] text-[#0052CC] dark:bg-[#17365B] dark:text-[#00C6FF]">
          <Icon size={27} strokeWidth={1.8} />
        </div>

        <ArrowUpRight
          size={20}
          className="text-slate-400 transition group-hover:text-[#0052CC] dark:group-hover:text-cyan-300"
        />
      </div>

      <h3 className="mt-8 text-xl font-bold tracking-tight text-[#071327] dark:text-white">
        {service.title}
      </h3>

      <p className="mt-4 flex-1 text-sm leading-7 text-slate-600 dark:text-slate-300">
        {service.shortDescription}
      </p>

      <div className="mt-8 border-t border-slate-100 pt-5 text-sm font-semibold text-[#0052CC] dark:border-slate-700 dark:text-cyan-300">
        Explore service
      </div>
    </Link>
  );
}
