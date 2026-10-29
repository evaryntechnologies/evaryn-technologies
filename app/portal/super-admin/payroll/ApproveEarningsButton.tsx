"use client";
import { useActionState } from "react";
import { approveWorkforcePayWithFeedback } from "./actions";

export function ApproveEarningsButton({ eventKey, amount }: { eventKey: string; amount: number }) {
  const [state, action, pending] = useActionState(approveWorkforcePayWithFeedback, { ok: false, message: "" });
  if (!Number.isFinite(amount) || amount <= 0) {
    return <p className="mt-3 text-sm text-amber-300">No payable active time recorded. Approval is unavailable for zero earnings.</p>;
  }
  return <form action={action} className="mt-3 space-y-2">
    <input type="hidden" name="eventKey" value={eventKey}/>
    <button type="submit" disabled={pending || state.ok} className="rounded-lg bg-[#0052CC] px-4 py-2 font-semibold text-white disabled:opacity-50">
      {pending ? "Approving…" : state.ok ? "Approved" : "Approve earnings"}
    </button>
    {state.message && <p role="status" aria-live="polite" className={state.ok ? "text-sm text-emerald-300" : "text-sm text-amber-300"}>{state.message}</p>}
  </form>;
}
