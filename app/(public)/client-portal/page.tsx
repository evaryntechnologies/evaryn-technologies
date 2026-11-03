import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { ensureClientProfile } from "../clients/actions";
export default async function ClientHome(){
 const client=await ensureClientProfile();
 const [requests,projects]=await Promise.all([
 prisma.clientProjectRequest.findMany({where:{clientId:client.id},orderBy:{createdAt:"desc"},take:50}),
 prisma.clientProjectAccess.count({where:{clientId:client.id}})
 ]);
 return <main><h1 className="text-3xl font-bold">My Client Dashboard</h1><p className="mt-2 text-sm text-slate-500">Manage requests and projects shared with your account.</p>
 <div className="mt-6 grid gap-4 sm:grid-cols-3"><div className="rounded-xl border p-5"><p className="text-sm text-slate-500">Service requests</p><p className="text-3xl font-bold">{requests.length}</p></div><div className="rounded-xl border p-5"><p className="text-sm text-slate-500">Projects shared</p><p className="text-3xl font-bold">{projects}</p></div><Link className="rounded-xl bg-[#0758B5] p-5 font-semibold text-white" href="/client-portal/requests/new">+ Submit Project Request</Link></div>
 <h2 className="mt-10 text-xl font-semibold">Recent requests</h2><div className="mt-3 grid gap-2">{requests.map(r=><Link key={r.id} href={`/client-portal/requests/${r.id}`} className="flex items-center justify-between gap-3 rounded-lg border p-4 hover:border-cyan-500"><span className="font-medium">{r.title}</span><span className="text-xs text-cyan-700">{r.status.replaceAll("_"," ")}</span></Link>)}{!requests.length&&<p className="rounded-lg border p-5 text-sm text-slate-500">No requests yet. Submit your first project request.</p>}</div></main>
}
