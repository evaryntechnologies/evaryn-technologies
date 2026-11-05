"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/client-portal", label: "Overview", exact: true },
  { href: "/client-portal/orders", label: "My orders" },
  { href: "/client-portal/delivered", label: "Delivered", exact: true },
  { href: "/client-portal/delivered/awaiting", label: "Awaiting your decision" },
  { href: "/client-portal/requests/new", label: "New request" },
  { href: "/client-portal/projects", label: "Projects" },
];

export default function ClientNav({ awaiting }: { awaiting: number }) {
  const path = usePathname();
  return (
    <nav className="cp-nav" aria-label="Client navigation">
      {items.map((i) => {
        const active = i.exact ? path === i.href : path.startsWith(i.href);
        return (
          <Link key={i.href} href={i.href} aria-current={active ? "page" : undefined}>
            {i.label}
            {i.href.endsWith("/delivered") && awaiting > 0 && <span className="cp-count">{awaiting}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
