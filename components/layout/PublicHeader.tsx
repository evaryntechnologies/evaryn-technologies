"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowUpRight, ChevronDown } from "lucide-react";
import BrandLogo from "@/components/brand/BrandLogo";
import ThemeSwitcher from "@/components/theme/ThemeSwitcher";

const mainLinks = [
  { label: "Services", href: "/services" },
  { label: "Our Work", href: "/projects" },
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
  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 45);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return <header className={`ev2-header${compact ? " ev2-header--compact" : ""}`}>
    <div className="ev2-shell ev2-header-inner">
      <Link className="ev2-logo" href="/" aria-label="Evaryn Technologies Limited home" onClick={() => setOpen(false)}><BrandLogo priority /></Link>
      <nav className="ev2-desktop-nav" aria-label="Main navigation">
        {mainLinks.map(l => <Link key={l.href} href={l.href} aria-current={pathname===l.href?"page":undefined}>{l.label}</Link>)}
        {audiences.map(a=><details key={a.label} className="ev2-dropdown"><summary>{a.label}<ChevronDown size={14}/></summary><div className="ev2-dropdown-menu">{a.links.map(l=><Link href={l.href} key={l.href}>{l.label}</Link>)}</div></details>)}
      </nav>
      <div className="ev2-header-actions"><ThemeSwitcher/><Link href="/contact" className="ev2-primary ev2-header-cta">Contact Us <ArrowUpRight size={15}/></Link></div>
      <button className="ev2-mobile-toggle" type="button" aria-expanded={open} aria-controls="ev2-mobile-menu" aria-label={open?"Close navigation":"Open navigation"} onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button>
    </div>
    {open && <nav id="ev2-mobile-menu" className="ev2-mobile-nav" aria-label="Mobile navigation">
      {mainLinks.map(l=><Link href={l.href} onClick={()=>setOpen(false)} key={l.href}>{l.label}</Link>)}
      {audiences.map(a=><div className="ev2-mobile-group" key={a.label}><strong>{a.label}</strong>{a.links.map(l=><Link key={l.href} href={l.href} onClick={()=>setOpen(false)}>{l.label}</Link>)}</div>)}
      <Link href="/contact" onClick={()=>setOpen(false)}>Contact Us</Link>
    </nav>}
  </header>;
}
