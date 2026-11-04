import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { ensureClientProfile } from "../clients/actions";
export default async function ClientHome(){
 const client=await ensureClientProfile();
 const [requests,projects]=await Promise.all([
 prisma.clientProjectRequest.findMany({where:{clientId:client.id},orderBy:{createdAt:"desc"},take:50}),
 prisma.clientProjectAccess.count({where:{clientId:client.id}})
 ]);
 const [delivered,tracked] = await Promise.all([
 prisma.clientDelivery.count({where:{clientId:client.id}}),
 prisma.clientOrderAssignment.count({where:{clientId:client.id}})
 ]);
 return <main className="space-y-8"><header className="ev-client-panel ev-client-hero relative overflow-hidden p-8 md:p-10"><p className="text-xs font-bold uppercase tracking-[.2em] text-[var(--ev-accent-text)]">Client workspace</p><h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">Welcome, {client.fullName}</h1><p className="mt-3 max-w-2xl text-base leading-7 text-[var(--ev-muted)]">One place to request services, follow production and receive quality-approved deliverables.</p></header>
 <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Workspace overview">{[
 {label:"Service requests",value:requests.length,href:"/client-portal/requests/new",action:"New request"},
 {label:"Shared projects",value:projects,href:"/client-portal/projects",action:"View projects"},
 {label:"Orders tracked",value:tracked,href:"/client-portal/orders",action:"Track active work"},
 {label:"Delivered orders",value:delivered,href:"/client-portal/delivered",action:"View deliveries"}
 ].map(m=><Link key={m.label} href={m.href} className="ev-client-panel block p-6 transition-transform hover:-translate-y-0.5"><p className="text-sm text-[var(--ev-muted)]">{m.label}</p><p className="mt-2 text-4xl font-bold">{m.value}</p><p className="mt-4 text-sm font-semibold text-[var(--ev-accent-text)]">{m.action} →</p></Link>)}</section>
 <section className="ev-client-panel p-6"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold">Recent requests</h2><Link href="/client-portal/requests/new" className="rounded-xl bg-[var(--ev-primary)] px-4 py-2 text-sm font-bold text-[var(--ev-on-primary)]">+ New request</Link></div><div className="mt-4 space-y-2">{requests.map(r=><Link key={r.id} href={`/client-portal/requests/${r.id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--ev-border)] bg-[var(--ev-inset)] p-4 hover:border-[#7956AF]"><span className="font-medium">{r.title}</span><span className="text-xs font-semibold text-[var(--ev-accent-text)]">{r.status.replaceAll("_"," ")}</span></Link>)}{!requests.length&&<p className="text-sm text-[var(--ev-muted)]">No requests yet. Submit your first project request.</p>}</div></section></main>;
}