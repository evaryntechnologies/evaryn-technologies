
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { connection } from "next/server";
import { requireEmployee } from "@/lib/auth/require-employee";
import { signOut } from "../actions";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  ShieldCheck,
  Wallet,
  ArrowUpRight,
} from "lucide-react";

const modules = [
  {
    title: "Task Management",
    description: "Create projects, assign tasks and monitor assignments.",
    href: "/portal/admin/task-management",
    icon: ClipboardList,
    ready: true,
  },
  {
    title: "Task Categories",
    description: "Add, rename, deactivate or delete task categories.",
    href: "/portal/super-admin/categories",
    icon: ClipboardList,
    ready: true,
  },
  {
    title: "Administration",
    description: "Access the existing administrative workspace.",
    href: "/portal/admin",
    icon: LayoutDashboard,
    ready: true,
  },
  {
   title: "Employee Management",
description: "Manage staff accounts, roles and permissions.",
href: "/portal/super-admin/employees",
icon: Users,
ready: true,
  },
  {
    title: "Review and QA",
    description: "Oversee the work approval process.",
    href: "",
    icon: ShieldCheck,
    ready: false,
  },
  {
    title: "Payroll",
    description: "Manage employee earnings and payments.",
    href: "",
    icon: Wallet,
    ready: false,
  },
];

async function SuperAdminContent() {
  await connection();

  const employee = await requireEmployee(["SUPER_ADMIN"]);

  return (
    <div className="w-full max-w-none">
      <Link href="/"><Image src="/brand/evaryn-full-trimmed.png" alt="Evaryn Technologies Limited" width={240} height={74} className="mb-5 h-auto max-h-28 w-auto max-w-[75vw] object-contain" /></Link>
      <header className="flex flex-wrap items-center justify-between gap-5 border-b border-white/10 pb-7">
        <div>
          <p className="text-xs font-bold tracking-[0.2em] text-cyan-300">
            EVARYN TECHNOLOGIES LIMITED
          </p>
          <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
            Super Admin Dashboard
          </h1>
          <p className="mt-3 text-sm text-slate-300">
            System administration and operational oversight.
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
        <div className="flex items-center gap-3 text-cyan-300">
          <ShieldCheck size={22} aria-hidden="true" />
          <span className="text-sm font-semibold">
            Authorized Super Administrator
          </span>
        </div>

        <h2 className="mt-5 text-xl font-bold">
          Welcome to Evaryn
        </h2>
        <p className="mt-3 break-all text-sm text-slate-300">
          {employee.email}
        </p>
        <p className="mt-2 text-sm text-slate-400">
          Role: Super Admin
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold">Management Modules</h2>
        <p className="mt-2 text-sm text-slate-300">
          Access the available administrative tools.
        </p>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {modules.map((module) => {
            const Icon = module.icon;

            const content = (
              <>
                <div className="flex items-center justify-between">
                  <div className="rounded-xl bg-[#0052CC]/20 p-3 text-cyan-300">
                    <Icon size={23} aria-hidden="true" />
                  </div>
                  {module.ready ? (
                    <ArrowUpRight
                      size={19}
                      className="text-cyan-300"
                      aria-hidden="true"
                    />
                  ) : (
                    <span className="text-xs text-slate-400">
                      In development
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

            return module.ready ? (
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
      </section>
    </div>
  );
}

export default function SuperAdminPage() {
  return (
    <main className="min-h-screen bg-[#071327] px-5 py-9 text-white sm:px-10">
      <Suspense
        fallback={
          <div className="w-full max-w-none rounded-2xl border border-white/10 bg-[#101F39] p-8 text-slate-300">
            Loading your secure dashboard...
          </div>
        }
      >
        <SuperAdminContent />
      </Suspense>
    </main>
  );
}
