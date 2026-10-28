"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function PortalDashboardReturn() {
  const pathname = usePathname();

  if (
    !pathname ||
    pathname === "/portal" ||
    pathname.startsWith("/portal/login") ||
    pathname.startsWith("/portal/register") ||
    pathname.startsWith("/portal/change-password") ||
    pathname.startsWith("/portal/unauthorized")
  ) {
    return null;
  }

  return (
    <nav
      aria-label="Staff portal navigation"
      className="flex w-full items-center justify-end border-b border-white/10 bg-[#071327] px-4 py-2 sm:px-8"
    >
      <Link
        href="/portal"
        className="inline-flex items-center rounded-lg border border-cyan-400/30 px-4 py-2 text-sm font-semibold text-cyan-200 hover:bg-white/10"
      >
        ← My Dashboard
      </Link>
    </nav>
  );
}