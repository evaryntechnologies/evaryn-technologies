"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { label: "Services", href: "/services" },
  { label: "How We Work", href: "/how-we-work" },
  { label: "Why Evaryn", href: "/why-evaryn" },
  { label: "Careers", href: "/careers" },
  { label: "Contact", href: "/contact" },
];

export default function PublicHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#090A0F]/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/25">
            E
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-white block leading-none">
              EVARYN
            </span>
            <span className="text-[10px] font-medium tracking-widest uppercase text-blue-400">
              Technologies Ltd
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-xs font-medium transition ${
                  active ? "text-blue-400" : "text-slate-300 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/portal/login"
            className="px-4 py-2 rounded-xl border border-white/15 hover:border-white/30 text-xs font-medium text-slate-200 transition"
          >
            Operator Portal
          </Link>
          <Link
            href="/custom-request"
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-lg shadow-blue-600/25 transition"
          >
            Request Custom Pipeline
          </Link>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden px-3 py-2 rounded-lg border border-white/10 text-xs text-slate-200"
        >
          {mobileOpen ? "Close" : "Menu"}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#0D0F17] px-4 py-5 space-y-3">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block py-2 text-sm font-medium text-slate-200 hover:text-blue-400"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-white/10 flex flex-col gap-2.5">
            <Link
              href="/portal/login"
              className="w-full py-2.5 text-center rounded-xl border border-white/15 text-xs font-medium text-white"
            >
              Operator Portal
            </Link>
            <Link
              href="/custom-request"
              className="w-full py-2.5 text-center rounded-xl bg-blue-600 text-xs font-semibold text-white"
            >
              Request Custom Pipeline
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
