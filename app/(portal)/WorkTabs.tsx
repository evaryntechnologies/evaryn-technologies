"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface WorkTabItem {
  label: string;
  href: string;
  count?: number;
}

interface WorkTabsProps {
  tabs: WorkTabItem[];
}

export default function WorkTabs({ tabs }: WorkTabsProps) {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#12141C] border border-white/[0.08] overflow-x-auto max-w-full mb-6">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
              isActive
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
                : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <span>{tab.label}</span>
            {typeof tab.count === "number" && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-white/[0.06] text-slate-300"
                }`}
              >
                {tab.count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
