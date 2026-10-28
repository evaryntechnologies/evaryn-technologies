import type { ReactNode } from "react";
import { Suspense } from "react";
import PortalDashboardReturn from "./PortalDashboardReturn";
import AdminActivityTracker from "./AdminActivityTracker";

export default function PortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <Suspense fallback={null}>
        <PortalDashboardReturn />
        <AdminActivityTracker />
      </Suspense>
      {children}
    </>
  );
}