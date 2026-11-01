import { BackLink } from "@/app/portal/ui";
import Link from "next/link";
import { signOut } from "../actions";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#071327] px-5 text-white">
      <section className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#101F39] p-8 text-center shadow-xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600/20 text-2xl text-cyan-300">
          !
        </div>

        <h1 className="mt-6 text-2xl font-bold">
          Access Restricted
        </h1>

        <p className="mt-4 text-sm leading-7 text-slate-300">
          Your account does not have permission to access this
          workspace. If you believe this is an error, contact
          your system administrator.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <BackLink href="/portal" label="Dashboard" />

          <form action={signOut}>
            <button
              type="submit"
              className="rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold"
            >
              Sign Out
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}