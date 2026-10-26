import Link from "next/link";
import type { ReactNode } from "react";

export default function TaskManagementLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <nav className="bg-[#071327] px-5 pt-5 text-white sm:px-10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3">
          <Link
            href="/portal/admin/task-management"
            className="rounded-xl border border-white/20 px-4 py-2 text-sm font-medium text-cyan-300 hover:bg-white/5"
          >
            Task Management
          </Link>
          <Link
            href="/portal/admin/task-history"
            className="rounded-xl border border-white/20 px-4 py-2 text-sm font-medium text-cyan-300 hover:bg-white/5"
          >
            Task History & Reports
          </Link>
        </div>
      </nav>
      {children}
    </>
  );
}