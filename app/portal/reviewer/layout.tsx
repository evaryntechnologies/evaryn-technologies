import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import RoleLogout from "../RoleLogout";

export default function RoleLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#071327] px-5 py-3 sm:px-10">
        <Link href="/portal/reviewer"><Image src="/brand/evaryn-full.png" alt="Evaryn Technologies Limited" width={210} height={65} className="h-auto max-h-14 w-auto max-w-[55vw] object-contain" /></Link>
        <RoleLogout />
      </div>
      {children}
    </>
  );
}