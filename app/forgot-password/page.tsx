"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, useTransition } from "react";
import { sendPasswordRecovery } from "./actions";

const destinations = {
  staff: { label: "Staff", href: "/portal/login" },
  clients: { label: "Clients", href: "/clients/login" },
  experts: { label: "Experts", href: "/experts/login" },
} as const;

function RecoveryForm() {
  const search = useSearchParams();
  const raw = search.get("for");
  const area = raw === "clients" || raw === "experts" ? raw : "staff";
  const destination = destinations[area];
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  function submit(formData: FormData) {
    setMessage("");
    formData.set("area", area);
    startTransition(async () => {
      const result = await sendPasswordRecovery(formData);
      if (result.ok) {
        setSuccess(true);
      } else {
        setMessage(result.message);
      }
    });
  }

  return (
    <main className="min-h-[75vh] px-5 py-16 sm:py-24">
      <section className="mx-auto max-w-md rounded-3xl border border-sky-300/25 bg-sky-200/15 p-7 shadow-2xl backdrop-blur-xl dark:border-sky-300/15 dark:bg-[#0B2441]/80 sm:p-10">
        <p className="text-sm font-semibold tracking-[0.18em] text-[#7956AF] dark:text-[#C6B4EE]">EVARYN TECHNOLOGIES</p>
        <h1 className="mt-4 text-3xl font-bold text-[#0B2441] dark:text-sky-50">Forgot your password?</h1>
        <p className="mt-3 text-base leading-relaxed text-[#28516D] dark:text-sky-100/85">Enter the email address associated with your {destination.label.toLowerCase()} account. We will email you a secure link to set a new password.</p>
        {success ? (
          <div role="status" className="mt-7 rounded-2xl border border-cyan-500/30 bg-cyan-200/25 p-5 text-[#0B2441] dark:text-sky-50">
            If an account exists for that address, you will receive password reset instructions. Check your inbox and spam folder.
          </div>
        ) : (
          <form action={submit} className="mt-7 space-y-5">
            <label htmlFor="recovery-email" className="block text-sm font-semibold text-[#0B2441] dark:text-sky-100">Email address</label>
            <input id="recovery-email" name="email" type="email" required autoComplete="email" maxLength={254} placeholder="you@company.com" className="w-full rounded-xl border border-sky-400/35 bg-white/85 px-4 py-3 text-[#0B2441] outline-none focus:ring-2 focus:ring-[#7956AF] dark:border-white/20 dark:bg-[#15345B] dark:text-white" />
            {message && <p role="alert" className="text-sm text-red-700 dark:text-red-200">{message}</p>}
            <button type="submit" disabled={pending} className="w-full rounded-xl bg-[#7956AF] px-5 py-3 font-semibold text-white transition hover:bg-[#674698] disabled:opacity-60">{pending ? "Sending..." : "Email me a reset link"}</button>
          </form>
        )}
        <p className="mt-7 text-sm text-[#28516D] dark:text-sky-100/85"><Link href={destination.href} className="font-semibold text-[#125F92] underline underline-offset-4 dark:text-cyan-300">Back to {destination.label} Login</Link></p>
      </section>
    </main>
  );
}

export default function ForgotPasswordPage() {
  return <Suspense fallback={<main className="min-h-[75vh] p-10">Loading password recovery...</main>}><RecoveryForm /></Suspense>;
}
