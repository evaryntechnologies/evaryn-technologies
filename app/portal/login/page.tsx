import { Suspense } from "react";
import { signIn } from "../actions";

type LoginProps = {
  searchParams: Promise<{ error?: string }>;
};

async function LoginContent({ searchParams }: LoginProps) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#071327] px-4 py-12 text-white">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-[#101F39] p-8 shadow-xl sm:p-10">
        <p className="text-sm font-semibold tracking-widest text-cyan-300">
          EVARYN TECHNOLOGIES
        </p>

        <h1 className="mt-5 text-3xl font-bold">
          Staff Login
        </h1>

        <p className="mt-3 text-sm text-slate-300">
          Secure access for authorized employees.
        </p>

        {params.error && (
          <p role="alert" className="mt-6 rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-sm text-red-200">
            Unable to sign in. Check your details and try again.
          </p>
        )}

        <form action={signIn} className="mt-8 space-y-5">
          <label className="block text-sm font-medium">
            Email address
            <input
              name="email"
              type="email"
              required
              autoComplete="username"
              className="mt-2 w-full rounded-xl border border-slate-600 bg-[#071327] px-4 py-3 text-white"
            />
          </label>

          <label className="block text-sm font-medium">
            Password
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="mt-2 w-full rounded-xl border border-slate-600 bg-[#071327] px-4 py-3 text-white"
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-xl bg-[#0052CC] px-5 py-3 font-semibold text-white transition hover:bg-[#003F9E]"
          >
            Sign In
          </button>
        </form>
      </section>
    </main>
  );
}

export default function LoginPage(props: LoginProps) {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#071327] text-white">
          <p className="text-sm text-slate-300">
            Loading staff login...
          </p>
        </main>
      }
    >
      <LoginContent {...props} />
    </Suspense>
  );
}