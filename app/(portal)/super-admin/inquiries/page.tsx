import { BackLink } from "@/app/portal/ui";
import { connection } from "next/server";
import { Suspense } from "react";
import Link from "next/link";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";
import {updateInquiry} from "./actions";
async function Content(){await connection();await requireEmployee(["SUPER_ADMIN"]);const [clients,custom]=await Promise.all([prisma.clientInquiry.findMany({orderBy:{createdAt:"desc"},take:100}),prisma.customServiceRequest.findMany({orderBy:{createdAt:"desc"},take:100})]);
 const items=[...clients.map(i=>({id:i.id,kind:"client",name:i.name,email:i.email,title:i.service,details:i.details,status:i.status,createdAt:i.createdAt})),...custom.map(i=>({id:i.id,kind:"custom",name:i.name,email:i.email,title:i.requestTitle,details:i.details,status:i.status,createdAt:i.createdAt}))].sort((a,b)=>b.createdAt.getTime()-a.createdAt.getTime());
 return <main className="min-h-screen bg-[#071327] px-4 py-8 text-white sm:px-8"><BackLink href="/portal" label="Dashboard" /><h1 className="mt-5 text-3xl font-bold">Client Inquiries</h1><p className="mt-2 text-slate-300">Client and custom service requests · Super Admin only</p><div className="mt-6 grid gap-4 lg:grid-cols-2">{items.map(i=><article key={i.kind+i.id} className="rounded-xl border border-white/10 bg-[#101F39] p-5"><div className="flex items-start justify-between gap-2"><h2 className="font-semibold">{i.title}</h2><span className="text-xs text-cyan-300">{i.status}</span></div><p className="mt-2 text-sm text-slate-300">{i.name} · {i.email} · {i.kind}</p><p className="mt-3 whitespace-pre-wrap text-sm">{i.details}</p><form className="mt-4 flex gap-2" action={updateInquiry}><input type="hidden" name="id" value={i.id}/><input type="hidden" name="kind" value={i.kind}/><select name="status" defaultValue={i.status} className="min-w-0 flex-1 rounded-lg bg-[#071327] p-3"><option value="NEW">New</option><option value="IN_DISCUSSION">In discussion</option><option value="CLOSED">Closed</option></select><button className="rounded-lg bg-[#0052CC] px-4">Save</button></form></article>)}{!items.length&&<p>No inquiries yet.</p>}</div></main>;
}
export default function Page(){return <Suspense fallback={<p>Loading inquiries…</p>}><Content/></Suspense>}
