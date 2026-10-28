import type { ReactNode } from "react";
import { Suspense } from "react";
import PortalDashboardReturn from "./PortalDashboardReturn";

export default function PortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <Suspense fallback={null}>
        <PortalDashboardReturn />
      </Suspense>
      {children}
    </>
  );
}