"use client";

import { useActionState } from "react";
import {
  createEmployee,
  initialEmployeeState,
} from "./create-actions";

const field =
  "mt-2 w-full rounded-xl border border-slate-600 bg-[#071327] px-4 py-3 text-white";

export default function AddEmployeeForm() {
  const [state, action, pending] = useActionState(
    createEmployee,
    initialEmployeeState
  );

  return (
    <section className="rounded-2xl border border-white/10 bg-[#101F39] p-6 sm:p-8">
      <h2 className="text-xl font-bold">Add Employee</h2>
      <p className="mt-2 text-sm text-slate-300">
        Create an employee account without opening Supabase.
      </p>

      <form action={action} className="mt-6 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-medium">
            Full name
            <input name="fullName" required minLength={2}
              maxLength={150} className={field} />
          </label>

          <label className="block text-sm font-medium">
            Work email
            <input name="email" type="email" required
              maxLength={254} className={field} />
          </label>

          <label className="block text-sm font-medium">
            Employee role
            <select name="role" required defaultValue="" className={field}>
              <option value="">Select role</option>
              <option value="TASKER">Tasker</option>
              <option value="REVIEWER">Reviewer</option>
              <option value="QA">Quality Assurance</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </label>

          <label className="block text-sm font-medium">
            Department
            <input name="department" maxLength={120}
              className={field} />
          </label>
        </div>

        <label className="flex items-start gap-3 text-sm text-slate-300">
          <input type="checkbox" name="emailVerified" value="yes"
            required className="mt-1" />
          I have independently verified that this email address
          belongs to the intended employee.
        </label>

        <button disabled={pending} type="submit"
          className="rounded-xl bg-[#0052CC] px-6 py-3 font-semibold text-white disabled:opacity-50">
          {pending ? "Creating account..." : "Create Employee Account"}
        </button>
      </form>

      {state.error && (
        <p role="alert"
          className="mt-5 rounded-xl border border-red-500/30 bg-red-950/30 p-4 text-sm text-red-200">
          {state.error}
        </p>
      )}

      {state.employeeId && (
        <div role="status"
          className="mt-6 rounded-xl border border-cyan-400/30 bg-[#071327] p-5">
          <h3 className="font-bold text-cyan-300">
            Employee account created
          </h3>
          <p className="mt-3 text-sm text-slate-300">
            Copy these credentials now. The temporary password
            will not be shown after leaving this result.
          </p>
          <p className="mt-4 break-all text-sm">
            Employee ID: <strong>{state.employeeId}</strong>
          </p>
          <p className="mt-3 break-all text-sm">
            Temporary password: <strong>{state.temporaryPassword}</strong>
          </p>
          <p className="mt-4 text-xs text-amber-200">
            Deliver the credentials privately. Never place the
            temporary password in ordinary email.
          </p>
        </div>
      )}
    </section>
  );
}