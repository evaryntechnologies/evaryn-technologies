import Link from "next/link";
import { registerClient } from "../actions";
export default async function ClientRegister({ searchParams }: { searchParams: Promise<{error?: string}> }) {
 const p=await searchParams;
 return <main className="ev2-register-page mx-auto max-w-lg px-5 py-16"><p className="font-semibold uppercase tracking-wider text-cyan-700">Work With Us</p><h1 className="mt-2 text-3xl font-bold">Create a client account</h1><p className="mt-2 text-sm text-slate-500">For businesses and individuals requesting Evaryn services. Expert applications are separate.</p>
 {p.error && <p role="alert" className="mt-4 rounded-lg bg-red-100 p-3 text-red-800">{p.error === "configuration" ? "Registration is temporarily unavailable because the website address is not configured. Please contact Evaryn support." : p.error === "unavailable" ? "Registration service is temporarily unavailable. Please try again shortly." : p.error === "invalid" ? "Please check your name, email, and password (at least 12 characters, matching confirmation)." : "Registration could not be completed. Check your details or use your existing account."}</p>}
 <form action={registerClient} className="ev2-register-card">
 <label className="grid gap-1 text-sm font-medium">Full name<input required minLength={2} maxLength={150} name="fullName" autoComplete="name" className="rounded-lg border p-3 text-slate-900"/></label>
 <label className="grid gap-1 text-sm font-medium">Company (optional)<input maxLength={200} name="companyName" autoComplete="organization" className="rounded-lg border p-3 text-slate-900"/></label>
 <label className="grid gap-1 text-sm font-medium">Email<input required type="email" name="email" autoComplete="email" className="rounded-lg border p-3 text-slate-900"/></label>
 <label className="grid gap-1 text-sm font-medium">Password (12+ characters)<input required minLength={12} maxLength={128} type="password" name="password" autoComplete="new-password" className="rounded-lg border p-3 text-slate-900"/></label>
 <label className="grid gap-1 text-sm font-medium">Confirm password<input required type="password" name="confirm" autoComplete="new-password" className="rounded-lg border p-3 text-slate-900"/></label>
 <button className="rounded-lg bg-[#0758B5] px-5 py-3 font-semibold text-white hover:bg-[#00479A]">Create Account</button>
 </form><p className="mt-5 text-sm">Already registered? <Link href="/clients/login" className="font-semibold text-cyan-700 underline">Log in</Link></p></main>;
}
