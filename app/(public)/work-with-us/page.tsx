import Link from "next/link";
export default function WorkWithUs() {
  return <main className="mx-auto max-w-5xl px-5 py-16 sm:py-24">
    <div className="rounded-3xl border border-sky-500/20 bg-[#0A2343] p-8 text-white shadow-xl sm:p-12">
      <p className="text-sm font-semibold uppercase tracking-widest text-cyan-300">Evaryn Technologies Limited</p>
      <h1 className="mt-4 text-4xl font-bold sm:text-5xl">Work With Us</h1>
      <p className="mt-5 max-w-2xl text-lg text-slate-200">Bring your next project to Evaryn. Create a secure client account to submit service requests, check their progress, and access projects shared with you.</p>
      <div className="mt-9 flex flex-wrap gap-3"><Link className="rounded-xl bg-[#0866CF] px-6 py-3 font-semibold text-white hover:bg-[#0052AA]" href="/clients/register">New Client? Create Account</Link><Link className="rounded-xl border border-cyan-300/50 px-6 py-3 font-semibold text-white hover:bg-white/10" href="/clients/login">Existing Client? Log In</Link></div>
    </div>
    <p className="mt-7 text-sm">Not ready to register? <Link className="font-semibold text-cyan-700 underline dark:text-cyan-300" href="/contact">Contact our team</Link> or email <a href="mailto:contact@evaryninc.com" className="underline">contact@evaryninc.com</a>.</p>
  </main>;
}
