"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export interface NavItem {
  label: string;
  href: string;
  section?: "Workspace" | "Operations" | "Quality & Review" | "Finance & Admin";
  roles?: string[];
}

interface PortalShellProps {
  children: React.ReactNode;
  userRole?: string;
  userName?: string;
  userEmail?: string;
  unreadNotifications?: number;
}

const DEFAULT_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/portal", section: "Workspace" },
  { label: "Task Hub", href: "/portal/task-hub", section: "Workspace" },
  { label: "My Work", href: "/portal/my-work", section: "Workspace" },
  { label: "Marketplace", href: "/portal/tasker/marketplace", section: "Workspace", roles: ["TASKER", "SUPER_ADMIN", "ADMIN"] },
  { label: "Reviewer Queue", href: "/portal/reviewer/queue", section: "Quality & Review", roles: ["REVIEWER", "ADMIN", "SUPER_ADMIN"] },
  { label: "QA Queue", href: "/portal/qa/queue", section: "Quality & Review", roles: ["QA", "ADMIN", "SUPER_ADMIN"] },
  { label: "QA Client Actions", href: "/portal/qa/client-actions", section: "Quality & Review", roles: ["QA", "ADMIN", "SUPER_ADMIN"] },
  { label: "Ratings & Rubrics", href: "/portal/ratings", section: "Quality & Review" },
  { label: "Task Management", href: "/portal/admin/task-management", section: "Operations", roles: ["ADMIN", "SUPER_ADMIN"] },
  { label: "Operations Hub", href: "/portal/admin/operations", section: "Operations", roles: ["ADMIN", "SUPER_ADMIN"] },
  { label: "Reassignments", href: "/portal/admin/reassignments", section: "Operations", roles: ["ADMIN", "SUPER_ADMIN"] },
  { label: "Disputes", href: "/portal/admin/disputes", section: "Operations", roles: ["ADMIN", "SUPER_ADMIN"] },
  { label: "Time Tracker", href: "/portal/admin/time-tracker", section: "Operations", roles: ["ADMIN", "SUPER_ADMIN"] },
  { label: "My Earnings", href: "/portal/earnings", section: "Finance & Admin" },
  { label: "Payment Method", href: "/portal/payment-method", section: "Finance & Admin" },
  { label: "Payroll Ledger", href: "/portal/super-admin/payroll", section: "Finance & Admin", roles: ["SUPER_ADMIN"] },
  { label: "Employees & Access", href: "/portal/super-admin/employees", section: "Finance & Admin", roles: ["SUPER_ADMIN", "ADMIN"] },
  { label: "Recruitment", href: "/portal/admin/recruitment", section: "Finance & Admin", roles: ["ADMIN", "SUPER_ADMIN"] },
  { label: "Audit Log", href: "/portal/super-admin/audit-log", section: "Finance & Admin", roles: ["SUPER_ADMIN"] },
];

export default function PortalShell({
  children,
  userRole = "TASKER",
  userName = "Evaryn Operator",
  userEmail = "operator@evaryn.com",
  unreadNotifications = 0,
}: PortalShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("evaryn_sidebar_collapsed");
    if (saved !== null) setCollapsed(saved === "true");
  }, []);

  const toggleSidebar = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("evaryn_sidebar_collapsed", String(next));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setCmdOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const normalizedRole = userRole?.toUpperCase() || "TASKER";

  const filteredNav = DEFAULT_NAV_ITEMS.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(normalizedRole);
  });

  const sections = ["Workspace", "Quality & Review", "Operations", "Finance & Admin"] as const;

  const commandResults = filteredNav.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#090A0F] text-slate-100 flex flex-col md:flex-row selection:bg-blue-600 selection:text-white">
      <aside
        className={`${
          collapsed ? "md:w-20" : "md:w-64"
        } fixed inset-y-0 left-0 z-40 flex flex-col border-r border-white/[0.08] bg-[#0D0F17]/95 backdrop-blur-xl transition-all duration-300 ${
          mobileMenuOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/[0.08]">
          <Link href="/portal" className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/25 shrink-0">
              E
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-semibold tracking-tight text-sm text-white leading-none">
                  EVARYN
                </span>
                <span className="text-[10px] font-medium uppercase tracking-widest text-blue-400 mt-1">
                  Workforce OS
                </span>
              </div>
            )}
          </Link>
          <button
            onClick={toggleSidebar}
            title="Toggle Sidebar"
            className="hidden md:flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition"
          >
            {collapsed ? "»" : "«"}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {sections.map((section) => {
            const items = filteredNav.filter((i) => i.section === section);
            if (items.length === 0) return null;
            return (
              <div key={section}>
                {!collapsed && (
                  <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    {section}
                  </div>
                )}
                <div className="space-y-1">
                  {items.map((item) => {
                    const isActive =
                      item.href === "/portal"
                        ? pathname === "/portal"
                        : pathname?.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                          isActive
                            ? "bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm"
                            : "text-slate-400 hover:text-slate-100 hover:bg-white/[0.04]"
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            isActive ? "bg-blue-400 shadow-[0_0_8px_#60a5fa]" : "bg-slate-600"
                          }`}
                        />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-3 border-t border-white/[0.08] bg-[#090A0F]/60">
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-xs font-semibold text-blue-400 shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">{userName}</p>
                <p className="text-[10px] text-slate-400 truncate">{normalizedRole}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          collapsed ? "md:pl-20" : "md:pl-64"
        }`}
      >
        <header className="sticky top-0 z-30 h-16 border-b border-white/[0.08] bg-[#090A0F]/80 backdrop-blur-md px-4 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden px-2.5 py-1.5 rounded-lg border border-white/10 text-xs text-slate-300"
            >
              Menu
            </button>
            <button
              onClick={() => setCmdOpen(true)}
              className="flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-[#12141C] border border-white/[0.08] hover:border-blue-500/40 text-xs text-slate-400 transition w-48 sm:w-72"
            >
              <span>Search or jump to...</span>
              <kbd className="ml-auto text-[10px] bg-white/[0.06] text-slate-300 px-1.5 py-0.5 rounded border border-white/10">
                ⌘K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              System Operational
            </span>

            <Link
              href="/portal/notifications"
              className="relative px-3 py-1.5 rounded-xl bg-[#12141C] border border-white/[0.08] hover:border-white/20 text-xs font-medium text-slate-200 transition"
            >
              Alerts
              {unreadNotifications > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 bg-blue-600 text-white rounded-full text-[10px]">
                  {unreadNotifications}
                </span>
              )}
            </Link>

            <Link
              href="/"
              className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs text-slate-300 transition"
            >
              Public Site
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {cmdOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-24 px-4"
          onClick={() => setCmdOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-[#12141C] border border-white/15 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3.5 border-b border-white/10 flex items-center gap-3">
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type a module name or route (e.g., Payroll, QA Queue, Earnings)..."
                className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
              />
              <button
                onClick={() => setCmdOpen(false)}
                className="text-xs text-slate-400 hover:text-white px-2 py-0.5 rounded bg-white/5"
              >
                ESC
              </button>
            </div>
            <div className="max-h-72 overflow-y-auto p-2 divide-y divide-white/[0.04]">
              {commandResults.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No matching portal modules found.
                </div>
              ) : (
                commandResults.map((item) => (
                  <button
                    key={item.href}
                    onClick={() => {
                      setCmdOpen(false);
                      router.push(item.href);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs text-slate-200 hover:bg-blue-600/20 hover:text-blue-300 transition"
                  >
                    <span className="font-medium">{item.label}</span>
                    <span className="text-[10px] uppercase tracking-wider text-slate-500">
                      {item.section}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
