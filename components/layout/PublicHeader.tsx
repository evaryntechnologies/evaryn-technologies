"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, LockKeyhole } from "lucide-react";
import ThemeSwitcher from "@/components/theme/ThemeSwitcher";

const links = [
  { label: "Services", href: "/services" },
  { label: "How we work", href: "/how-we-work" },
  { label: "Why Evaryn", href: "/why-evaryn" },
  { label: "Careers", href: "/careers" },
  { label: "Contact", href: "/contact" },
];

export default function PublicHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl dark:border-slate-800 dark:bg-[#071327]/95">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-5 md:px-8">
        <Link
          href="/"
          onClick={() => setMenuOpen(false)}
          className="flex min-w-0 items-center gap-3"
        >
          <Image
            src="/brand/evaryn-icon.png"
            alt="Evaryn Technologies logo"
            width={45}
            height={45}
            className="h-11 w-11 object-contain"
          />

          <div className="min-w-0 leading-tight">
            <span className="block text-lg font-extrabold tracking-wide text-[#0052CC] dark:text-[#00C6FF]">
              EVARYN
            </span>
            <span className="block text-[11px] font-semibold tracking-wide text-slate-600 dark:text-slate-300">
              TECHNOLOGIES LIMITED
            </span>
          </div>
        </Link>

        <nav aria-label="Main navigation" className="hidden items-center gap-5 lg:flex">
          {links.map((link) => {
            const active =
              pathname === link.href ||
              pathname.startsWith(link.href + "/");

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`text-sm font-medium transition hover:text-[#0052CC] dark:hover:text-cyan-300 ${
                  active
                    ? "text-[#0052CC] dark:text-cyan-300"
                    : "text-slate-600 dark:text-slate-300"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <ThemeSwitcher />

          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-[#0052CC] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#003F9E]"
          >
            <LockKeyhole size={16} />
            Staff login
          </Link>
        </div>

        <button
          type="button"
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMenuOpen(!menuOpen)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-[#071327] dark:border-slate-700 dark:text-white lg:hidden"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {menuOpen && (
        <nav
          id="mobile-navigation"
          aria-label="Mobile navigation"
          className="border-t border-slate-200 bg-white px-5 py-5 dark:border-slate-800 dark:bg-[#071327] lg:hidden"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {link.label}
              </Link>
            ))}

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5 dark:border-slate-800">
              <ThemeSwitcher />

              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0052CC] px-5 py-3 text-sm font-semibold text-white"
              >
                <LockKeyhole size={16} />
                Staff login
              </Link>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
