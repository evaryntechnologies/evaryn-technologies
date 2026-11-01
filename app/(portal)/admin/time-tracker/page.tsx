import { BackLink } from "@/app/portal/ui";
import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";
import LiveAdminTracker from "./LiveAdminTracker";

type Session={id:string;startedAt:Date;endedAt:Date|null;rateHourly:unknown;activeSeconds:number};
async function Content(){
  await connection(); const user=await requireEmployee(["ADMIN"]);
  const employee=await prisma.employeeProfile.findUnique({where:{authUserId:user.id},select:{id:true,role:true,status:true}});
  if(employee?.role!=="ADMIN"||employee.status!=="ACTIVE")return <p className="p-8">Admin only.</p>;
  const sessions=await prisma.$queryRaw<Session[]>`SELECT id,"startedAt","endedAt","rateHourly","activeSeconds" FROM public."AdminTimeSession" WHERE "employeeId"=${employee.id}::uuid ORDER BY "startedAt" DESC LIMIT 100`;
  return <main className="min-h-screen bg-[#071327] p-5 text-white sm:p-8"><div className="w-full space-y-5"><BackLink href="/portal" label="Dashboard" /><h1 className="text-3xl font-bold">Admin Activity Time Tracker</h1><p className="text-slate-300">Time accrues while this browser tab is visible and you are interacting with the portal. It pauses during inactivity or when the tab is hidden. The server verifies every heartbeat; logged-in idle time is not paid.</p><LiveAdminTracker/><h2 className="text-xl font-bold">Recent activity sessions</h2>{sessions.map(s=><div key={s.id} className="rounded-xl bg-[#101F39] p-4"><p>{s.startedAt.toLocaleString("en-KE",{timeZone:"Africa/Nairobi"})} — {s.endedAt?.toLocaleString("en-KE",{timeZone:"Africa/Nairobi"})??"Session open"}</p><p className="mt-1 text-sm text-slate-300">{(s.activeSeconds/3600).toFixed(2)} active hours · ${((s.activeSeconds/3600)*Number(s.rateHourly)).toFixed(2)} accrued</p></div>)}{!sessions.length&&<p>No activity tracked yet.</p>}</div></main>;
}
export default function Page(){return <Suspense fallback={<p className="p-5">Loading activity…</p>}><Content/></Suspense>}
