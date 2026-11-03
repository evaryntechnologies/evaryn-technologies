import Link from "next/link";
import { signInClient } from "../actions";
export default async function ClientLogin({ searchParams }: { searchParams: Promise<{error?: string;verified?:string}> }) {
 const p=await searchParams;
 return <main className="mx-auto max-w-md px-5 py-20"><h1 className="text-3xl font-bold">Client Login</h1><p className="mt-2 text-sm text-slate-500">Sign in to manage your Evaryn projects and service requests.</p>
 {p.verified && <p className="mt-4 rounded-lg bg-emerald-100 p-3 text-emerald-900">Email verified. You can log in now.</p>}
 {p.error && <p role="alert" className="mt-4 rounded-lg bg-red-100 p-3 text-red-900">Unable to sign in. Check your credentials and email verification.</p>}
 <form action={signInClient} className="mt-6 grid gap-4 rounded-xl border border-sky-500/20 p-6"><label className="grid gap-1 text-sm font-medium">Email<input required type="email" name="email" autoComplete="email" className="rounded-lg border p-3 text-slate-900"/></label><label className="grid gap-1 text-sm font-medium">Password<input required type="password" name="password" autoComplete="current-password" className="rounded-lg border p-3 text-slate-900"/></label><button className="rounded-lg bg-[#0758B5] px-4 py-3 font-semibold text-white">Log In</button></form>
 <p className="mt-5 text-sm">New client? <Link className="font-semibold text-cyan-700 underline" href="/clients/register">Create account</Link></p></main>;
}
