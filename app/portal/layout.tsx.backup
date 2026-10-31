import type { ReactNode } from "react";
import { connection } from "next/server";
import { requireEmployee } from "@/lib/auth/require-employee";
import PortalSidebar from "@/components/layout/PortalSidebar";
import RoleLogout from "./RoleLogout";
export default async function PortalLayout({children}:{children:ReactNode}) {
 await connection();
 const user=await requireEmployee();
 return <div className="min-h-screen bg-[#071327] text-slate-100"><PortalSidebar role={user.role}/><div className="min-h-screen lg:pl-[76px]"><header className="flex min-h-16 items-center justify-end border-b border-white/10 px-5 pl-16 lg:pl-6"><RoleLogout/></header><main className="mx-auto max-w-7xl px-4 py-7 sm:px-8">{children}</main></div></div>;
}
