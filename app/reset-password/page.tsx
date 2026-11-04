"use client";

import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useMemo, useRef, useState } from "react";

function ResetPasswordForm() {
  const search = useSearchParams();
  const raw = search.get("for");
  const area = raw === "clients" || raw === "experts" ? raw : "staff";
  const loginHref = area === "clients" ? "/clients/login" : area === "experts" ? "/experts/login" : "/login";
  const initialized = useRef(false);
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  ), []);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    let active = true;

    async function initialize() {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        const tokenHash = url.searchParams.get("token_hash");
        const type = url.searchParams.get("type");

        const hashParams = new URLSearchParams(
          window.location.hash.replace(/^#/, "")
        );

        if (url.searchParams.get("error")) {
          throw new Error("Supabase rejected the recovery link.");
        }

        if (tokenHash && type === "recovery") {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: "recovery",
          });

          if (error) throw error;
        } else if (code) {
          const flowId = url.searchParams.get("sb_flow_id");

          const { error } =
            await supabase.auth.exchangeCodeForSession(
              code,
              flowId ? { flowId } : undefined
            );

          if (error) throw error;
        } else if (
          hashParams.get("type") === "recovery" &&
          hashParams.get("access_token") &&
          hashParams.get("refresh_token")
        ) {
          const { error } = await supabase.auth.setSession({
            access_token: hashParams.get("access_token")!,
            refresh_token: hashParams.get("refresh_token")!,
          });

          if (error) throw error;
        } else {
          throw new Error("Missing recovery credentials.");
        }

        const { data, error } = await supabase.auth.getUser();

        if (error || !data.user) {
          throw new Error("Recovery session is not valid.");
        }

        if (!active) return;

        window.history.replaceState(
          null,
          "",
          `/reset-password?for=${area}`
        );

        setError("");
        setReady(true);
      } catch (err) {
        console.error("Password recovery verification failed:", err);

        if (active) {
          setReady(false);
          setError(
            "This reset link is invalid or has expired. " +
            "Please request a new one."
          );
        }
      }
    }

    void initialize();

    return () => {
      active = false;
    };
  }, [supabase, area]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password.length < 12 || password.length > 128) {
      setError("Use a password between 12 and 128 characters.");
      return;
    }
    if (password !== confirm) {
      setError("The passwords do not match.");
      return;
    }
    setPending(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError("Your password could not be changed. Request a new link or try again.");
    } else {
      await supabase.auth.signOut();
      setSuccess(true);
      setReady(false);
      setPassword("");
      setConfirm("");
    }
    setPending(false);
  }

  return (
    <main className="min-h-[75vh] px-5 py-16 sm:py-24">
      <section className="mx-auto max-w-md rounded-3xl border border-sky-300/25 bg-sky-200/15 p-7 shadow-2xl backdrop-blur-xl dark:border-sky-300/15 dark:bg-[#0B2441]/80 sm:p-10">
        <p className="text-sm font-semibold tracking-[0.18em] text-[#7956AF] dark:text-[#C6B4EE]">EVARYN TECHNOLOGIES</p>
        <h1 className="mt-4 text-3xl font-bold text-[#0B2441] dark:text-sky-50">Create a new password</h1>
        {success ? <div role="status" className="mt-6 rounded-xl bg-cyan-200/30 p-4 text-[#0B2441] dark:text-sky-100">Your password has been changed. You can now sign in using your new password.</div> : ready ? (
          <form onSubmit={submit} className="mt-7 space-y-5">
            <label className="block text-sm font-semibold text-[#0B2441] dark:text-sky-100">New password<input type="password" required minLength={12} maxLength={128} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-sky-400/35 bg-white/85 px-4 py-3 text-[#0B2441] focus:ring-2 focus:ring-[#7956AF] dark:bg-[#15345B] dark:text-white" /></label>
            <label className="block text-sm font-semibold text-[#0B2441] dark:text-sky-100">Confirm new password<input type="password" required minLength={12} maxLength={128} autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} className="mt-2 w-full rounded-xl border border-sky-400/35 bg-white/85 px-4 py-3 text-[#0B2441] focus:ring-2 focus:ring-[#7956AF] dark:bg-[#15345B] dark:text-white" /></label>
            {error && <p role="alert" className="text-sm text-red-700 dark:text-red-200">{error}</p>}
            <button disabled={pending} type="submit" className="w-full rounded-xl bg-[#7956AF] px-5 py-3 font-semibold text-white hover:bg-[#674698] disabled:opacity-60">{pending ? "Updating..." : "Update password"}</button>
          </form>
        ) : <p role={error ? "alert" : "status"} className="mt-6 text-[#28516D] dark:text-sky-100">{error || "Checking your secure recovery link..."}</p>}
        <div className="mt-7 flex flex-wrap gap-4 text-sm">
          <Link className="font-semibold text-[#125F92] underline dark:text-cyan-300" href={loginHref}>Back to login</Link>
          {!success && <Link className="font-semibold text-[#7956AF] underline dark:text-[#C6B4EE]" href={`/forgot-password?for=${area}`}>Request a new link</Link>}
        </div>
      </section>
    </main>
  );
}

export default function ResetPasswordPage() {
  return <Suspense fallback={<main className="min-h-[75vh] p-10">Loading secure reset...</main>}><ResetPasswordForm /></Suspense>;
}
