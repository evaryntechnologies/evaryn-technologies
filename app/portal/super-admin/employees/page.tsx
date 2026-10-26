
import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { Users, UserPlus, ArrowLeft, ShieldCheck } from "lucide-react";

import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";
import AddEmployeeForm from "./AddEmployeeForm";
import {updateEmployeeCategories} from "./category-actions";

async function EmployeeContent() {
  await connection();

  const administrator = await requireEmployee(["SUPER_ADMIN"]);

  const profile = await prisma.employeeProfile.findUnique({
    where: { authUserId: administrator.id },
    select: { role: true, status: true },
  });

  if (
    !profile ||
    profile.role !== "SUPER_ADMIN" ||
    profile.status !== "ACTIVE"
  ) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-amber-500/30 bg-[#101F39] p-8">
        <h1 className="text-xl font-bold text-amber-200">
          Account Not Activated
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-300">
          Your Super Admin employee profile is not active.
          Please verify your employee account before accessing
          Employee Management.
        </p>
      </div>
    );
  }

  const categories=await prisma.taskCategory.findMany({where:{active:true},select:{id:true,name:true},orderBy:{name:"asc"}});
  const employees = await prisma.employeeProfile.findMany({
    select: {
      id: true,
      authUserId: true,
      fullName: true,
      email: true,
      role: true,
      status: true,
      department: true,
      createdAt: true,
      eligibleCategories:{select:{categoryId:true}},
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const totalEmployees = employees.length;

  const activeEmployees = employees.filter(
    (employee) => employee.status === "ACTIVE"
  ).length;

  const pendingEmployees = employees.filter(
    (employee) => employee.status === "PENDING"
  ).length;

  const roleLabels: Record<string, string> = {
    TASKER: "Tasker",
    REVIEWER: "Reviewer",
    QA: "Quality Assurance",
    ADMIN: "Administrator",
    SUPER_ADMIN: "Super Administrator",
  };

  return (
    <div className="w-full max-w-none">
      {/* Navigation */}
      <Link
        href="/portal/super-admin"
        className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 transition hover:text-cyan-200"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Back to Super Admin
      </Link>

      {/* Page heading */}
      <header className="mt-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
          EVARYN TECHNOLOGIES LIMITED
        </p>

        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          Employee Management
        </h1>

        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
          Create employee accounts, assign roles and manage
          your workforce from one secure dashboard.
        </p>
      </header>

      {/* Summary */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-[#101F39] p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-300">
              Employees Shown
            </p>
            <Users
              size={19}
              className="text-cyan-300"
              aria-hidden="true"
            />
          </div>

          <p className="mt-4 text-3xl font-bold">
            {totalEmployees}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#101F39] p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-300">
              Active
            </p>
            <ShieldCheck
              size={19}
              className="text-emerald-300"
              aria-hidden="true"
            />
          </div>

          <p className="mt-4 text-3xl font-bold text-emerald-300">
            {activeEmployees}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#101F39] p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-300">
              Pending
            </p>
            <UserPlus
              size={19}
              className="text-amber-300"
              aria-hidden="true"
            />
          </div>

          <p className="mt-4 text-3xl font-bold text-amber-300">
            {pendingEmployees}
          </p>
        </div>
      </div>

      {/* Employee creation */}
      <div className="mt-8">
        <AddEmployeeForm categories={categories} />
      </div>

      {/* Employee directory */}
      <section className="mt-8 rounded-2xl border border-white/10 bg-[#101F39] p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">
              Employee Directory
            </h2>

            <p className="mt-2 text-sm text-slate-300">
              View registered employees and their assigned roles.
            </p>
          </div>

          <span className="rounded-lg border border-white/10 bg-[#071327] px-3 py-2 text-xs font-medium text-slate-300">
            Showing {employees.length} employees
          </span>
        </div>

        {employees.length === 0 ? (
          <div className="mt-7 rounded-xl border border-dashed border-white/15 px-5 py-12 text-center">
            <Users
              size={32}
              className="mx-auto text-slate-400"
              aria-hidden="true"
            />

            <h3 className="mt-4 text-lg font-semibold">
              No Employees Yet
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-300">
              Employee accounts created through the form
              above will appear here.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-3">
            {employees.map((employee) => {
              const isActive = employee.status === "ACTIVE";
              const isPending = employee.status === "PENDING";

              const statusColor = isActive
                ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
                : isPending
                  ? "border-amber-400/25 bg-amber-400/10 text-amber-300"
                  : "border-slate-400/25 bg-slate-400/10 text-slate-300";

              return (
                <article
                  key={employee.id}
                  className="flex flex-col gap-5 rounded-xl border border-white/10 bg-[#071327]/60 p-5 transition hover:border-white/20 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-4">
                    <div
                      aria-hidden="true"
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0052CC]/25 text-sm font-bold text-cyan-300"
                    >
                      {employee.fullName
                        .trim()
                        .split(/\s+/)
                        .slice(0, 2)
                        .map((part) => part.charAt(0))
                        .join("")
                        .toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-semibold text-white">
                        {employee.fullName}
                      </h3>

                      <p className="mt-1 break-all text-sm text-slate-300">
                        {employee.email}
                      </p>

                      {employee.department && (
                        <p className="mt-2 text-xs text-slate-400">
                          Department: {employee.department}
                        </p>
                      )}

                      <p className="mt-2 text-xs text-slate-400">
                        Employee ID: EV-
                        {employee.authUserId
                          .replaceAll("-", "")
                          .toUpperCase()}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                    <span className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold text-cyan-300">
                      {roleLabels[employee.role] ??
                        employee.role.replaceAll("_", " ")}
                    </span>

                    <span
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${statusColor}`}
                    >
                      {employee.status}
                    </span>{!["ADMIN","SUPER_ADMIN"].includes(employee.role) && <details className="w-full sm:w-auto sm:min-w-64 rounded-lg border border-white/15 p-3"><summary className="cursor-pointer text-sm font-semibold text-cyan-300">Edit categories ({employee.eligibleCategories.length})</summary><form action={updateEmployeeCategories} className="mt-3 grid gap-2"><input type="hidden" name="employeeId" value={employee.id}/>{categories.map(c=><label key={c.id} className="flex items-center gap-2 text-sm"><input name="categoryIds" type="checkbox" value={c.id} defaultChecked={employee.eligibleCategories.some(e=>e.categoryId===c.id)}/>{c.name}</label>)}<button className="mt-2 rounded-lg bg-[#0052CC] px-3 py-2 text-sm font-semibold">Save assigned categories</button></form></details>}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <p className="mt-6 text-xs leading-6 text-slate-400">
        Showing up to 100 employee records. Employee permissions
        must always be enforced on the server, regardless of
        what appears in this directory.
      </p>
    </div>
  );
}

export default function EmployeeManagementPage() {
  return (
    <main className="min-h-screen bg-[#071327] px-5 py-9 text-white sm:px-10">
      <Suspense
        fallback={
          <div className="w-full max-w-none rounded-2xl border border-white/10 bg-[#101F39] p-8 text-slate-300">
            Loading employee management...
          </div>
        }
      >
        <EmployeeContent />
      </Suspense>
    </main>
  );
}
