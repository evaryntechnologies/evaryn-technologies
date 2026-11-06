"use client";

import { useActionState } from "react";
import { decideExpertWithFeedback } from "./actions";

export default function ExpertDecisionForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState(decideExpertWithFeedback, { error: "" });
  return (
    <form action={action} className="mt-5 grid gap-3">
      <input type="hidden" name="id" value={id} />
      <label className="text-sm">Assigned role
        <select name="role" className="ml-3 rounded bg-[#071327] p-2">
          <option value="TASKER">Tasker</option><option value="REVIEWER">Reviewer</option><option value="QA">QA</option>
        </select>
      </label>
      <label className="text-sm">Reason (required only for rejection)
        <textarea name="reason" maxLength={1000} className="mt-2 block w-full rounded bg-[#071327] p-3" />
      </label>
      {state.error && <p role="alert" className="rounded border border-red-400/40 bg-red-950/40 p-2 text-sm text-red-200">{state.error}</p>}
      <div className="flex flex-wrap gap-3">
        <button disabled={pending} name="decision" value="APPROVE" className="rounded bg-emerald-700 px-4 py-2 disabled:opacity-50">Approve</button>
        <button disabled={pending} name="decision" value="WAITLIST" className="rounded bg-blue-700 px-4 py-2 disabled:opacity-50">Waitlist</button>
        <button disabled={pending} name="decision" value="REJECT" className="rounded bg-red-800 px-4 py-2 disabled:opacity-50">Reject</button>
      </div>
    </form>
  );
}
