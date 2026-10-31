import type { ReactNode } from "react";
import { Suspense } from "react";
import { headers } from "next/headers";
import AdminActivityTracker from "./AdminActivityTracker";
import PortalShellWithNotifications from "./PortalShellWithNotifications";
import "./portal-shell.css";

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const path = (await headers()).get("x-evaryn-portal-path") ?? "";
  // Public auth routes must render without PortalShellWithNotifications,
  // which requires an authenticated employee and otherwise redirects to login.
  if (["/portal/login", "/portal/register", "/portal/unauthorized"].some(
    (route) => path === route || path.startsWith(`${route}/`)
  )) {
    return <>{children}</>;
  }

  return (
    <div className="ev-portal">
      <Suspense fallback={null}>
        <AdminActivityTracker />
      </Suspense>
      <Suspense fallback={null}>
        <PortalShellWithNotifications>{children}</PortalShellWithNotifications>
      </Suspense>
    </div>
  );
}
