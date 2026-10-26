import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { changeInitialPassword } from "./actions";

async function PasswordContent() {
  await connection();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/portal/login");

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#071327] px-5 py-12 text-white">
      <section className="w-full max-w-md rounded-2xl border border-white/10 bg-[#101F39] p-8">
        <p className="text-xs font-bold tracking-widest text-cyan-300">
          EVARYN TECHNOLOGIES
        </p>

        <h1 className="mt-5 text-2xl font-bold">
          Set Your Personal Password
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-300">
          Before entering your employee workspace, replace
          your temporary password with one of your own.
        </p>

        <form action={changeInitialPassword} className="mt-7 space-y-5">
          <label className="block text-sm font-medium">
            New password
            <input name="password" type="password" minLength={12}
              required autoComplete="new-password"
              className="mt-2 w-full rounded-xl border border-slate-600 bg-[#071327] px-4 py-3" />
          </label>

          <label className="block text-sm font-medium">
            Confirm new password
            <input name="confirm" type="password" minLength={12}
              required autoComplete="new-password"
              className="mt-2 w-full rounded-xl border border-slate-600 bg-[#071327] px-4 py-3" />
          </label>

          <button type="submit"
            className="w-full rounded-xl bg-[#0052CC] px-5 py-3 font-semibold">
            Save New Password
          </button>
        </form>
      </section>
    </main>
  );
}

export default function ChangePasswordPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#071327]" />}>
      <PasswordContent />
    </Suspense>
  );
}