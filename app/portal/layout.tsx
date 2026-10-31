import type { ReactNode } from "react";
import { Suspense } from "react";
import AdminActivityTracker from "./AdminActivityTracker";
import PortalShellWithNotifications from "./PortalShellWithNotifications";
import "./portal-shell.css";

export default function PortalLayout({ children }: { children: ReactNode }) {
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
