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
    <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-[var(--ev-surface)] border border-[var(--ev-border-soft)] overflow-x-auto max-w-full mb-6">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
              isActive
                ? "bg-[var(--ev-primary)] text-[var(--ev-on-primary)] shadow-md"
                : "text-[var(--ev-ink)] hover:bg-[var(--ev-inset)]"
            }`}
          >
            <span>{tab.label}</span>
            {typeof tab.count === "number" && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                  isActive
                    ? "bg-white/25"
                    : "bg-[var(--ev-inset)] text-[var(--ev-muted)]"
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
