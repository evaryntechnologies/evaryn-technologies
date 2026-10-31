import { Suspense } from "react";
import { connection } from "next/server";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";
import { publishAnnouncement } from "./actions";
import Link from "next/link";

async function Content({searchParams}:{searchParams:Promise<{sent?:string}>}) {
  await connection();
  const auth = await requireEmployee(["REVIEWER","QA","ADMIN","SUPER_ADMIN"]);
  const sender = await prisma.employeeProfile.findUnique({where:{authUserId:auth.id},select:{role:true,status:true}});
  if (!sender || sender.status !== "ACTIVE" || !["REVIEWER","QA","ADMIN","SUPER_ADMIN"].includes(sender.role)) return <p>Access denied.</p>;
  const params = await searchParams;
  return <main className="mx-auto w-full max-w-3xl px-4 py-6 text-[var(--ev-ink)] sm:px-6">
    <Link href="/portal" className="text-sm text-cyan-600 dark:text-cyan-300">← Dashboard</Link>
    <header className="mt-5"><p className="text-xs font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-300">EVARYN · Communications</p><h1 className="mt-2 text-2xl font-semibold sm:text-3xl">General messages & memos</h1><p className="mt-2 text-sm text-[var(--ev-muted)]">Send important information to all active employees, including administrators and the Super Admin. This is separate from order discussions.</p></header>
    {params.sent === "1" && <p role="status" className="mt-4 rounded-xl border border-emerald-500/30 p-3 text-sm">Message delivered to active employees' notification inboxes.</p>}
    <form action={publishAnnouncement} className="mt-6 space-y-4 rounded-2xl border border-[var(--ev-border)] bg-[var(--ev-surface)] p-4 sm:p-6">
      <label className="block text-sm font-medium">Subject<input name="title" required minLength={4} maxLength={140} className="mt-2 w-full rounded-xl border border-[var(--ev-border)] bg-[var(--ev-surface-2)] p-3" placeholder="Important team update" /></label>
      <label className="block text-sm font-medium">Message<textarea name="body" required minLength={10} maxLength={4000} rows={7} className="mt-2 w-full rounded-xl border border-[var(--ev-border)] bg-[var(--ev-surface-2)] p-3" placeholder="Write a clear memo for the team..." /></label>
      <p className="text-xs text-[var(--ev-muted)]">Recipients: All active employees. Please avoid sharing confidential individual payroll or personnel details in a company-wide memo.</p>
      <button className="min-h-11 rounded-xl bg-[#0052CC] px-5 py-3 font-semibold text-white hover:bg-[#1268e3]">Send message to team</button>
    </form>
  </main>;
}
export default function Page({searchParams}:{searchParams:Promise<{sent?:string}>}) {return <Suspense fallback={<p className="p-6">Loading team messages…</p>}><Content searchParams={searchParams}/></Suspense>}
