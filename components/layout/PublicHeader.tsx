"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, LockKeyhole } from "lucide-react";
import ThemeSwitcher from "@/components/theme/ThemeSwitcher";

const STAFF_LOGIN_URL = "/portal/login";

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

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b-[3px] border-[var(--ev-cyan)] bg-[color-mix(in_srgb,var(--ev-nav)_92%,transparent)] shadow-[var(--ev-shadow)] backdrop-blur-lg">
      <div className="mx-auto flex h-20 w-full max-w-[1400px] items-center justify-between gap-4 px-5 md:px-8">
        <Link
          href="/"
          onClick={closeMenu}
          className="flex min-w-0 items-center gap-3 rounded-xl dark:bg-[#f3fbff] dark:px-3 dark:py-1"
          aria-label="Evaryn Technologies Limited - Home"
        >
          <Image src="/brand/evaryn-full-trimmed.png" alt="Evaryn Technologies Limited" width={320} height={95} className="h-auto max-h-14 w-auto max-w-[min(62vw,260px)] object-contain" priority />
        </Link>

        {/* Desktop navigation */}
        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-1 lg:flex"
        >
          {links.map((link) => {
            const active =
              pathname === link.href ||
              pathname.startsWith(link.href + "/");

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition hover:bg-[var(--ev-surface-2)] hover:text-[var(--ev-accent-text)] ${
                  active
                    ? "bg-[var(--ev-surface-2)] text-[var(--ev-accent-text)]"
                    : "text-[var(--ev-ink)]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center gap-3 lg:flex">
          <ThemeSwitcher />

          <Link
            href={STAFF_LOGIN_URL}
            aria-current={
              pathname === STAFF_LOGIN_URL ? "page" : undefined
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0052CC] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#003F9E] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ev-cyan)]"
          >
            <LockKeyhole size={16} aria-hidden="true" />
            Staff Login
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          aria-label={
            menuOpen ? "Close navigation" : "Open navigation"
          }
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMenuOpen((previous) => !previous)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--ev-border)] bg-[var(--ev-surface)] text-[var(--ev-ink)] lg:hidden"
        >
          {menuOpen ? (
            <X size={22} aria-hidden="true" />
          ) : (
            <Menu size={22} aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Mobile navigation */}
      {menuOpen && (
        <nav
          id="mobile-navigation"
          aria-label="Mobile navigation"
          className="border-t border-[var(--ev-border)] bg-[var(--ev-nav)] px-5 py-5 lg:hidden"
        >
          <div className="mx-auto flex w-full flex-col gap-2">
            {links.map((link) => {
              const active =
                pathname === link.href ||
                pathname.startsWith(link.href + "/");

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMenu}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-lg px-3 py-3 text-sm font-semibold transition hover:bg-[var(--ev-surface-2)] ${
                    active
                      ? "bg-[var(--ev-surface-2)] text-[var(--ev-accent-text)]"
                      : "text-[var(--ev-ink)]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--ev-border)] pt-5">
              <ThemeSwitcher />

              <Link
                href={STAFF_LOGIN_URL}
                onClick={closeMenu}
                aria-current={
                  pathname === STAFF_LOGIN_URL
                    ? "page"
                    : undefined
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0052CC] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#003F9E] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ev-cyan)]"
              >
                <LockKeyhole size={16} aria-hidden="true" />
                Staff Login
              </Link>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}