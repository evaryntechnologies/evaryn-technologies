import type { ReactNode } from "react";

// Navigation for this section now lives in one tab bar directly under each page's header.
export default function TaskManagementLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
