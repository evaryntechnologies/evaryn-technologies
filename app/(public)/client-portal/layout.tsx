import type { ReactNode } from "react";
import Link from "next/link";
import { ensureClientProfile, signOutClient } from "../clients/actions";
export default async function ClientPortalLayout({children}:{children:ReactNode}) {
 const client = await ensureClientProfile();
 return <div className="mx-auto min-h-[70vh] max-w-6xl px-5 py-8">
 <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#09264B] p-5 text-white">
 <div><p className="text-xs uppercase tracking-wide text-cyan-300">Client workspace</p><p className="font-bold">Welcome, {client.fullName}</p></div>
 <nav aria-label="Client navigation" className="flex flex-wrap items-center gap-3 text-sm"><Link className="hover:underline" href="/client-portal">Dashboard</Link><Link className="hover:underline" href="/client-portal/requests/new">New Request</Link><Link className="hover:underline" href="/client-portal/projects">My Projects</Link><form action={signOutClient}><button className="rounded-lg border border-white/40 px-3 py-2 hover:bg-white/10">Sign Out</button></form></nav>
 </div>{children}</div>;
}
