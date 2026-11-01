import { BackLink } from "@/app/portal/ui";
import {connection} from "next/server";
import {Suspense} from "react";
import Link from "next/link";
import {requireEmployee} from "@/lib/auth/require-employee";
import {prisma} from "@/lib/db/prisma";
import HireApplicantForm from "./HireApplicantForm";
async function Content(){await connection();const auth=await requireEmployee(["SUPER_ADMIN"]);const profile=await prisma.employeeProfile.findUnique({where:{authUserId:auth.id},select:{status:true,role:true}});if(!profile||profile.role!=="SUPER_ADMIN"||profile.status!=="ACTIVE")throw new Error("Access denied.");const [applications,categories]=await Promise.all([prisma.jobApplication.findMany({where:{status:"SHORTLISTED"},orderBy:{createdAt:"asc"},take:100}),prisma.taskCategory.findMany({where:{active:true},select:{id:true,name:true},orderBy:{name:"asc"}})]);return <main className="min-h-screen bg-[#071327] p-5 text-white sm:p-10"><BackLink href="/portal/super-admin" label="Dashboard" /><h1 className="mt-5 text-3xl font-bold">Hire Shortlisted Applicants</h1><p className="mt-2 text-slate-300">Super Admin creates the employee's real account and assigns eligible work categories. No public self-activation.</p><div className="mt-6 grid gap-4 lg:grid-cols-2">{applications.map(a=><article key={a.id} className="rounded-xl border border-white/10 bg-[#101F39] p-5"><h2 className="font-semibold">{a.name}</h2><p className="text-sm text-slate-300">{a.email} · Applied as {a.role}</p><HireApplicantForm applicationId={a.id} categories={categories}/></article>)}{!applications.length&&<p>No shortlisted applications awaiting hiring.</p>}</div></main>}
export default function Page(){return <Suspense fallback={<p>Loading shortlisted applicants…</p>}><Content/></Suspense>}
