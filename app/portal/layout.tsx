import type { ReactNode } from "react";
import { Suspense } from "react";
import AdminActivityTracker from "./AdminActivityTracker";
import PortalShell from "./PortalShell";
import "./portal-shell.css";

export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <AdminActivityTracker />
      </Suspense>
      <Suspense fallback={null}>
        <PortalShell>{children}</PortalShell>
      </Suspense>
    </>
  );
}
