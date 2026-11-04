"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowUpRight, ChevronDown } from "lucide-react";
import BrandLogo from "@/components/brand/BrandLogo";
import ThemeSwitcher from "@/components/theme/ThemeSwitcher";

const mainLinks = [
  { label: "Services", href: "/services" },
  { label: "Past Projects", href: "/projects" },
  { label: "About Us", href: "/about" },
  { label: "Work With Us", href: "/work-with-us" },
  { label: "Feedback & Reviews", href: "/reviews" },
];
const audiences = [
  { label: "For Clients", links: [{ label: "Create client account", href: "/clients/register" }, { label: "Client login", href: "/clients/login" }, { label: "Client services", href: "/services" }, { label: "Investors", href: "/work-with-us#investors" }] },
  { label: "For Experts", links: [{ label: "Apply as an expert", href: "/experts/register" }, { label: "Expert login", href: "/experts/login" }, { label: "Expert opportunities", href: "/careers" }] },
];
export default function PublicHeader() {
  const [open, setOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const pathname = usePathname();
  const [activeAudience, setActiveAudience] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);
  useEffect(() => {
    setActiveAudience(null);
    setOpen(false);
  }, [pathname]);
  useEffect(() => {
    const dismiss = (event: PointerEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) setActiveAudience(null);
    };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setActiveAudience(null); };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", dismiss); document.removeEventListener("keydown", escape); };
  }, []);
  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 45);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return <header className={`ev2-header${compact ? " ev2-header--compact" : ""}`}>
    <div className="ev2-shell ev2-header-inner">
      <Link className="ev2-logo" href="/" aria-label="Evaryn Technologies Limited home" onClick={() => setOpen(false)}><BrandLogo priority /></Link>
      <nav ref={navRef} className="ev2-desktop-nav" aria-label="Main navigation">
        {mainLinks.map(l => <Link key={l.href} href={l.href} aria-current={pathname===l.href?"page":undefined}>{l.label}</Link>)}
        {audiences.map(a=><div key={a.label} className={`ev2-dropdown${activeAudience === a.label ? " ev2-dropdown--open" : ""}`}>
          <button type="button" className="ev2-dropdown-trigger" aria-expanded={activeAudience === a.label} aria-haspopup="true" onClick={()=>setActiveAudience(activeAudience === a.label ? null : a.label)}>{a.label}<ChevronDown size={14}/></button>
          {activeAudience === a.label && <div className="ev2-dropdown-menu">{a.links.map(l=><Link href={l.href} key={l.href} onClick={()=>setActiveAudience(null)}>{l.label}</Link>)}</div>}
        </div>)}
      </nav>
      <div className="ev2-header-actions"><ThemeSwitcher/><Link href="/contact" className="ev2-primary ev2-header-cta">Contact Us <ArrowUpRight size={15}/></Link></div>
      <button className="ev2-mobile-toggle" type="button" aria-expanded={open} aria-controls="ev2-mobile-menu" aria-label={open?"Close navigation":"Open navigation"} onClick={()=>{setActiveAudience(null);setOpen(!open)}}>{open?<X/>:<Menu/>}</button>
    </div>
    {open && <nav id="ev2-mobile-menu" className="ev2-mobile-nav" aria-label="Mobile navigation">
      {mainLinks.map(l=><Link href={l.href} onClick={()=>setOpen(false)} key={l.href}>{l.label}</Link>)}
      {audiences.map(a=><div className="ev2-mobile-group" key={a.label}><strong>{a.label}</strong>{a.links.map(l=><Link key={l.href} href={l.href} onClick={()=>setOpen(false)}>{l.label}</Link>)}</div>)}
      <Link href="/contact" onClick={()=>setOpen(false)}>Contact Us</Link>
    </nav>}
  </header>;
}
