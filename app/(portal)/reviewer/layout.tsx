import type { ReactNode } from "react";

// Logo, logout and navigation now live in the shared PortalShell sidebar.
export default function RoleLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
