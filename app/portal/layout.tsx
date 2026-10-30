import type { ReactNode } from "react";
import { Suspense } from "react";
import { connection } from "next/server";

import PortalSidebar from "@/components/layout/PortalSidebar";
import { requireEmployee } from "@/lib/auth/require-employee";
import RoleLogout from "./RoleLogout";

function PortalLoading() {
  return (
    <div className="min-h-screen bg-[#071327] text-slate-100">
      <div className="min-h-screen lg:pl-[76px]">
        <div className="border-b border-white/10 px-6 py-5">
          <div className="h-5 w-40 animate-pulse rounded bg-white/10" />
        </div>

        <main className="p-6">
          <div className="h-8 w-64 animate-pulse rounded bg-white/10" />
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-32 animate-pulse rounded-2xl border border-white/10 bg-white/5"
              />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

async function AuthenticatedPortal({
  children,
}: {
  children: ReactNode;
}) {
  await connection();

  const user = await requireEmployee();

  return (
    <div className="min-h-screen bg-[#071327] text-slate-100">
      <PortalSidebar role={user.role} />

      <div className="min-h-screen lg:pl-[76px]">
        <header className="flex min-h-16 items-center justify-end border-b border-white/10 px-5">
          <RoleLogout />
        </header>

        {children}
      </div>
    </div>
  );
}

export default function PortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Suspense fallback={<PortalLoading />}>
      <AuthenticatedPortal>{children}</AuthenticatedPortal>
    </Suspense>
  );
}
