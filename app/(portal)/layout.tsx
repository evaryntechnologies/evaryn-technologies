import type { ReactNode } from "react";
import { Suspense } from "react";
import { headers } from "next/headers";
import AdminActivityTracker from "./AdminActivityTracker";
import PortalShellWithNotifications from "./PortalShellWithNotifications";
import "./portal-shell.css";
import "./layout-system.css";

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const path = (await headers()).get("x-evaryn-portal-path") ?? "";
  // Public auth routes must render without PortalShellWithNotifications,
  // which requires an authenticated employee and otherwise redirects to login.
  if (["/login", "/register", "/unauthorized"].some(
    (route) => path === route || path.startsWith(`${route}/`)
  )) {
    // Same visual theme as the rest of the portal (watermark, colours, light/dark).
    return <div className="ev-portal">{children}</div>;
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
