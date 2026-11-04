import type { ReactNode } from "react";
import Link from "next/link";
import { ensureClientProfile, signOutClient } from "../clients/actions";
export default async function ClientPortalLayout({children}:{children:ReactNode}) {
 const client = await ensureClientProfile();
 return <div className="mx-auto min-h-[70vh] max-w-6xl px-5 py-8">
 <div className="mb-8 flex flex-wrap items-center justify-between gap-4 ev-client-panel ev-client-header rounded-2xl p-5 text-[var(--ev-ink)]">
 <div><p className="text-xs uppercase tracking-wide text-[var(--ev-accent-text)]">Client workspace</p><p className="font-bold">Welcome, {client.fullName}</p></div>
 <nav aria-label="Client navigation" className="flex flex-wrap items-center gap-3 text-sm"><Link className="hover:underline" href="/client-portal">Dashboard</Link><Link className="hover:underline" href="/client-portal/requests/new">New Request</Link><Link className="hover:underline" href="/client-portal/projects">My Projects</Link><Link className="hover:underline" href="/client-portal/orders">Track Orders</Link><Link className="hover:underline" href="/client-portal/delivered">Delivered Orders</Link><form action={signOutClient}><button className="rounded-lg border border-[var(--ev-border)] px-3 py-2 hover:bg-[var(--ev-inset)]">Sign Out</button></form></nav>
 </div>{children}</div>;
}
