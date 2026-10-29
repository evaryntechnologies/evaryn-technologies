import type { ReactNode } from "react";
import { Suspense } from "react";
import PortalShell from "./PortalShell";
import AdminActivityTracker from "./AdminActivityTracker";
import "./portal-shell.css";

export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <PortalShell>{children}</PortalShell>
        <AdminActivityTracker />
      </Suspense>
    </>
  );
}
