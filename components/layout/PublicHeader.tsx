"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronDown } from "lucide-react";
import BrandLogo from "@/components/brand/BrandLogo";
import ThemeSwitcher from "@/components/theme/ThemeSwitcher";

// Home is the Evaryn logo; contact sits between Clients and Experts.
const navigation = [
  { type: "link", label: "About Us", href: "/about" },
  { type: "link", label: "Work With Us", href: "/work-with-us" },
  { type: "link", label: "Services", href: "/services" },
  { type: "link", label: "Past Projects", href: "/projects" },
  { type: "link", label: "Feedback & Reviews", href: "/reviews" },
  { type: "menu", label: "For Clients", links: [
    { label: "Client signup", href: "/clients/register" },
    { label: "Client login", href: "/clients/login" },
    { label: "Client services", href: "/services" },
    { label: "Investors", href: "/work-with-us#investors" },
  ] },
  { type: "link", label: "Contact Us", href: "/contact" },
  { type: "menu", label: "For Experts", links: [
    { label: "Apply as an expert", href: "/experts/register" },
    { label: "Expert login", href: "/experts/login" },
    { label: "Expert opportunities", href: "/careers" },
  ] },
] as const;

export default function PublicHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [compact, setCompact] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const menuId = "evaryn-header-menu";
  const closeAll = () => { setActiveMenu(null); setMobileOpen(false); };

  useEffect(() => { setActiveMenu(null); setMobileOpen(false); }, [pathname]);
  useEffect(() => {
    const scroll = () => setCompact(window.scrollY > 45);
    scroll();
    window.addEventListener("scroll", scroll, { passive: true });
    return () => window.removeEventListener("scroll", scroll);
  }, []);
  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) setActiveMenu(null);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setActiveMenu(null); setMobileOpen(false); }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, []);

  return <header ref={headerRef} className={`ev2-header${compact ? " ev2-header--compact" : ""}`}>
    <div className="ev2-shell ev2-header-inner">
      <Link href="/" className="ev2-logo" onClick={closeAll} aria-label="Evaryn Technologies Limited — Home"><BrandLogo priority /></Link>
      <nav className="ev2-desktop-nav" aria-label="Main navigation">
        {navigation.map((item) => item.type === "link" ?
          <Link href={item.href} key={item.label} onClick={() => setActiveMenu(null)} aria-current={pathname === item.href ? "page" : undefined}>{item.label}</Link>
          : <div key={item.label} className={`ev2-dropdown${activeMenu === item.label ? " ev2-dropdown--open" : ""}`}>
              <button type="button" className="ev2-dropdown-trigger" aria-expanded={activeMenu === item.label} aria-haspopup="true" aria-controls={`${menuId}-${item.label.replace(/\s+/g, "-").toLowerCase()}`} onClick={() => setActiveMenu(activeMenu === item.label ? null : item.label)}>
                {item.label}<ChevronDown size={14} aria-hidden="true" />
              </button>
              {activeMenu === item.label && <div id={`${menuId}-${item.label.replace(/\s+/g, "-").toLowerCase()}`} className="ev2-dropdown-menu">
                {item.links.map(link => <Link key={link.href} href={link.href} onClick={closeAll}>{link.label}</Link>)}
              </div>}
            </div>)}
      </nav>
      <div className="ev2-header-actions"><ThemeSwitcher /></div>
      <button className="ev2-mobile-toggle" type="button" aria-expanded={mobileOpen} aria-controls="ev2-mobile-menu" aria-label={mobileOpen ? "Close navigation" : "Open navigation"} onClick={() => { setActiveMenu(null); setMobileOpen(!mobileOpen); }}>
        {mobileOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
      </button>
    </div>
    {mobileOpen && <nav id="ev2-mobile-menu" className="ev2-mobile-nav" aria-label="Mobile navigation">
      {navigation.map(item => item.type === "link" ?
        <Link key={item.label} href={item.href} onClick={closeAll}>{item.label}</Link>
        : <div key={item.label} className="ev2-mobile-group"><strong>{item.label}</strong>
            {item.links.map(link => <Link key={link.href} href={link.href} onClick={closeAll}>{link.label}</Link>)}
          </div>)}
    </nav>}
  </header>;
}
