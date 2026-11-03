import EvarynAccessNav from "@/components/navigation/EvarynAccessNav";
import type { ReactNode } from "react";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/layout/PublicFooter";
import "./public.css";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="ev-public site flex min-h-screen flex-col">
      <PublicHeader />
      <EvarynAccessNav area="public" />
      <div className="flex-1">{children}</div>
      <PublicFooter />
    </div>
  );
}
