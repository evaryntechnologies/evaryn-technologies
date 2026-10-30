import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import RoleLogout from "../RoleLogout";
import { Suspense } from "react";
import WorkTabs from "../WorkTabs";

export default function RoleLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#071327] px-5 py-3 sm:px-10">
        <Link href="/portal/tasker"><Image src="/brand/evaryn-full-trimmed.png" alt="Evaryn Technologies Limited" width={210} height={65} className="h-auto max-h-20 w-auto max-w-[55vw] object-contain" /></Link>
        <RoleLogout />
      </div>
      <Suspense fallback={null}><WorkTabs role="TASKER" /></Suspense>
      {children}
    </>
  );
}