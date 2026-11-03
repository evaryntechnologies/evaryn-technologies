"use client";

import { useState } from "react";
import Link from "next/link";
import BrandLogo from "@/components/brand/BrandLogo";
import { usePathname } from "next/navigation";
import { ArrowRight, UsersRound, Menu, X } from "lucide-react";
import ThemeSwitcher from "@/components/theme/ThemeSwitcher";

const EXPERT_URL = "/experts";

const links = [
  { label: "Services", href: "/services" },
  { label: "How we work", href: "/how-we-work" },
  { label: "Why Evaryn", href: "/why-evaryn" },
  { label: "Investors", href: "/investors" },
  { label: "Careers", href: "/careers" },
  { label: "Work With Us", href: "/work-with-us" },
  { label: "Contact", href: "/contact" },
];

export default function PublicHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const closeMenu = () => setMenuOpen(false);
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="site-header">
      <div className="site-container">
        <div className="site-header__bar">
          <Link href="/" onClick={closeMenu} className="site-header__logo" aria-label="Evaryn Technologies Limited, home">
            <BrandLogo priority />
          </Link>

          <nav aria-label="Main navigation" className="site-nav">
            {links.map((link) => (
              <Link key={link.href} href={link.href} aria-current={isActive(link.href) ? "page" : undefined}>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="site-header__actions">
            <Link href="/work-with-us" aria-label="Work With Us — client registration" className="site-btn site-btn--primary">
              Work With Us <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <ThemeSwitcher />
            <Link href={EXPERT_URL} className="site-btn site-btn--ghost">
              <UsersRound size={15} aria-hidden="true" /> Are You an Expert?
            </Link>
            <Link href="/contact" className="site-btn site-btn--primary">
              Request a quote <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>

          <button
            type="button"
            className="site-header__burger"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="site-mobile-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {menuOpen && (
          <div id="site-mobile-menu" className="site-header__sheet">
            {links.map((link) => (
              <Link key={link.href} href={link.href} onClick={closeMenu} aria-current={isActive(link.href) ? "page" : undefined}>
                {link.label}
              </Link>
            ))}
            <div className="site-header__sheet-actions">
              <ThemeSwitcher />
              <Link href={EXPERT_URL} onClick={closeMenu} className="site-btn site-btn--ghost">
                <UsersRound size={15} aria-hidden="true" /> Are You an Expert?
              </Link>
              <Link href="/contact" onClick={closeMenu} className="site-btn site-btn--primary">
                Request a quote
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
