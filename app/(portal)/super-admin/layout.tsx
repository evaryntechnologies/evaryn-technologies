import type { ReactNode } from "react";
import EvarynAccessNav from "@/components/navigation/EvarynAccessNav";

// The existing parent portal and individual pages continue to enforce authorization.
// This is navigation only; it does not grant access to any destination.
export default function SuperAdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <EvarynAccessNav area="super-admin" />
      {children}
    </>
  );
}
