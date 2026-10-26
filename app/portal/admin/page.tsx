import { connection } from "next/server";
import Link from "next/link";
import { Suspense } from "react";
import { requireEmployee } from "@/lib/auth/require-employee";
import { signOut } from "../actions";
import {
  ClipboardList,
  Users,
  FolderKanban,
  Wallet,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

const modules = [
  {
    title: "Task Management",
    description:
      "Create projects, assign work, and monitor task progress.",
    href: "/portal/admin/task-management",
    icon: ClipboardList,
    available: true,
  },
  {
    title: "Employee Management",
    description:
      "Manage employee profiles, roles, and account access.",
    href: "#",
    icon: Users,
    available: false,
  },
  {
    title: "Projects",
    description:
      "Review project activity and overall delivery progress.",
    href: "#",
    icon: FolderKanban,
    available: false,
  },
  {
    title: "Payroll",
    description:
      "Manage employee earnings, payments, and adjustments.",
    href: "#",
    icon: Wallet,
    available: false,
  },
];

async function AdminContent() {
  await connection();
  const employee = await requireEmployee([
    "ADMIN",
    "SUPER_ADMIN",
  ]);

  return (
    <div className="mx-auto max-w-7xl">
      <header className="flex flex-wrap items-start justify-between gap-5 border-b border-white/10 pb-7">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
            EVARYN TECHNOLOGIES LIMITED
          </p>

          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Administration
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-300">
            Manage your workforce, projects, and business operations.
          </p>
        </div>

        <form action={signOut}>
          <button
            type="submit"
            className="rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold transition hover:bg-white/10"
          >
            Sign Out
          </button>
        </form>
      </header>

      <section className="mt-8 rounded-2xl border border-white/10 bg-[#101F39] p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <ShieldCheck
            className="text-cyan-300"
            size={22}
            aria-hidden="true"
          />

          <span className="text-sm font-semibold text-cyan-300">
            Authorized Workspace
          </span>
        </div>

        <h2 className="mt-4 text-xl font-bold">
          Welcome to Evaryn Administration
        </h2>

        <p className="mt-3 break-words text-sm text-slate-300">
          {employee.email}
        </p>

        <p className="mt-2 text-sm text-slate-400">
          Role: {employee.role.replaceAll("_", " ")}
        </p>
      </section>

      <div className="mt-10">
        <h2 className="text-xl font-bold">
          Management Tools
        </h2>

        <p className="mt-2 text-sm text-slate-300">
          Access the tools available to your administrator account.
        </p>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {modules.map((module) => {
          const Icon = module.icon;

          const content = (
            <>
              <div className="flex items-center justify-between">
                <div className="rounded-xl bg-[#0052CC]/20 p-3 text-cyan-300">
                  <Icon size={23} aria-hidden="true" />
                </div>

                {module.available ? (
                  <ArrowRight
                    size={20}
                    className="text-cyan-300"
                    aria-hidden="true"
                  />
                ) : (
                  <span className="text-xs text-slate-400">
                    Coming later
                  </span>
                )}
              </div>

              <h3 className="mt-6 text-lg font-bold">
                {module.title}
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-300">
                {module.description}
              </p>
            </>
          );

          return module.available ? (
            <Link
              key={module.title}
              href={module.href}
              className="rounded-2xl border border-white/10 bg-[#101F39] p-6 transition hover:border-cyan-400/40 hover:bg-[#15294B]"
            >
              {content}
            </Link>
          ) : (
            <div
              key={module.title}
              className="rounded-2xl border border-white/10 bg-[#101F39] p-6 opacity-65"
            >
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-[#071327] px-5 py-9 text-white sm:px-10">
      <Suspense
        fallback={
          <div className="mx-auto max-w-7xl rounded-2xl border border-white/10 bg-[#101F39] p-8 text-slate-300">
            Loading administration...
          </div>
        }
      >
        <AdminContent />
      </Suspense>
    </main>
  );
}