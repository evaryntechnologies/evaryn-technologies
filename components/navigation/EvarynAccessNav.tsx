import Link from "next/link";
import type { CSSProperties } from "react";

type NavItem = { label: string; href: string };

const publicItems: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Our Work", href: "/projects" },
  { label: "Client Reviews", href: "/reviews" },
  { label: "Work With Us", href: "/work-with-us" },
  { label: "Client Sign Up", href: "/clients/register" },
  { label: "Client Log In", href: "/clients/login" },
  { label: "Are You an Expert?", href: "/experts" },
  { label: "Careers", href: "/careers" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const superAdminItems: NavItem[] = [
  { label: "Dashboard", href: "/portal/super-admin" },
  { label: "Client Requests", href: "/portal/super-admin/client-requests" },
  { label: "Company Email", href: "/portal/super-admin/emails" },
  { label: "Expert Applications", href: "/portal/super-admin/expert-applications" },
  { label: "Inquiries", href: "/portal/super-admin/inquiries" },
  { label: "Employees", href: "/portal/super-admin/employees" },
  { label: "Payroll", href: "/portal/super-admin/payroll" },
  { label: "Pay Team", href: "/portal/super-admin/payroll/pay-team" },
  { label: "Orders", href: "/portal/super-admin/orders" },
  { label: "Audit Log", href: "/portal/super-admin/audit-log" },
];

const navStyle: CSSProperties = {
  display: "block",
  position: "relative",
  width: "100%",
  boxSizing: "border-box",
  background: "#0a2342",
  color: "#ffffff",
  borderBlock: "1px solid #2475ab",
  padding: "12px 16px",
  zIndex: 20,
};

const linkStyle: CSSProperties = {
  display: "inline-block",
  padding: "9px 12px",
  border: "1px solid #547ea7",
  borderRadius: 7,
  background: "#163b63",
  color: "#ffffff",
  textDecoration: "none",
  fontSize: 13,
  fontWeight: 600,
  lineHeight: 1.25,
};

export default function EvarynAccessNav({ area }: { area: "public" | "super-admin" }) {
  const items = area === "public" ? publicItems : superAdminItems;
  return (
    <nav
      aria-label={area === "public" ? "All public website pages" : "Super Admin quick access"}
      data-evaryn-navigation-reset={area}
      style={navStyle}
    >
      <div style={{ maxWidth: 1440, marginInline: "auto" }}>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: "#a6d9f7" }}>
          {area === "public" ? "EXPLORE EVARYN" : "SUPER ADMIN — QUICK ACCESS"}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          {items.map(({ label, href }) => (
            <Link key={href} href={href} style={linkStyle}>
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
