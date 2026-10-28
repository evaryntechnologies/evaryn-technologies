import { connection } from "next/server";
import { Suspense } from "react";
import Link from "next/link";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";
import {updateApplication} from "./actions";
import HiringControls from "./HiringControls";
async function Content(){
 await connection(); const user=await requireEmployee(["ADMIN","SUPER_ADMIN"]);
 const [rows, openings]=await Promise.all([prisma.jobApplication.findMany({orderBy:{createdAt:"desc"},take:150}), prisma.$queryRaw<Array<{slug:string;isOpen:boolean}>>`SELECT "slug", "isOpen" FROM public."HiringOpening" ORDER BY "slug"`]);
 return <main className="min-h-screen bg-[#071327] px-4 py-8 text-white sm:px-8"><Link href="/portal" className="text-cyan-300">← My Dashboard</Link><h1 className="mt-5 text-3xl font-bold">Recruitment</h1><p className="mt-2 text-slate-300">Review applications, shortlist candidates and record decisions. Hiring and account creation are separate controlled steps.</p><HiringControls openings={openings}/><div className="mt-6 grid gap-4 md:grid-cols-2">{rows.map(a=><article key={a.id} className="rounded-xl border border-white/10 bg-[#101F39] p-5"><div className="flex justify-between gap-3"><h2 className="font-semibold">{a.name}</h2><span className="text-cyan-300">{a.status}</span></div><p className="mt-2 text-sm text-slate-300">{a.role} · {a.email}</p><p className="mt-2 text-sm">{a.experience}</p><p className="mt-3 whitespace-pre-wrap text-sm text-slate-300">{a.note}</p>{a.portfolioLink&&<a className="mt-2 block text-cyan-300 underline" href={a.portfolioLink} target="_blank" rel="noopener noreferrer">Portfolio</a>}<form action={updateApplication} className="mt-4 flex flex-wrap gap-2"><input type="hidden" name="id" value={a.id}/><select name="status" defaultValue={a.status} className="min-w-0 flex-1 rounded-lg bg-[#071327] p-3"><option value="NEW">New</option><option value="SHORTLISTED">Shortlisted</option><option value="REJECTED">Rejected</option></select><button className="rounded-lg bg-[#0052CC] px-4 py-3">Save</button></form></article>)}{!rows.length&&<p className="text-slate-300">No applications received yet.</p>}</div></main>;
}
export default function Page(){return <Suspense fallback={<p>Loading recruitment…</p>}><Content/></Suspense>}
