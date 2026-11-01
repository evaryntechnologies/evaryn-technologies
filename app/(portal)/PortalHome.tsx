import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { requireEmployee } from "@/lib/auth/require-employee";

const destinations = {
  TASKER: "/portal/tasker",
  REVIEWER: "/portal/reviewer",
  QA: "/portal/qa",
  ADMIN: "/portal/admin",
  SUPER_ADMIN: "/portal/super-admin",
} as const;

async function AuthenticatedDestination() {
  // Wait for a real incoming request before accessing
  // Supabase authentication and session-expiry timestamps.
  await connection();

  const employee = await requireEmployee();

  redirect(destinations[employee.role]);

  return null;
}

export default function PortalPage() {
  return (
    <main className="min-h-screen bg-[#071327] text-white">
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center px-5">
            <p className="text-sm text-slate-300">
              Opening your secure workspace...
            </p>
          </div>
        }
      >
        <AuthenticatedDestination />
      </Suspense>
    </main>
  );
}