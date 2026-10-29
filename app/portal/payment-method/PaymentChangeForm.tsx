"use client";
import { useActionState } from "react";
import PaymentChangeFields from "./PaymentChangeFields";
import { requestPaymentChangeWithFeedback } from "./actions";

export default function PaymentChangeForm() {
  const [state, action, pending] = useActionState(requestPaymentChangeWithFeedback, { error: "", success: "" });
  return <form action={action} className="mt-6 max-w-2xl rounded-xl border border-white/10 bg-[#101F39] p-5">
    <PaymentChangeFields />
    {state.error && <p role="alert" className="mt-4 rounded-lg border border-rose-400/40 bg-rose-950/40 p-3 text-sm text-rose-100">{state.error}</p>}
    {state.success && <p role="status" className="mt-4 rounded-lg border border-emerald-400/40 bg-emerald-950/40 p-3 text-sm text-emerald-100">{state.success}</p>}
    <button disabled={pending} type="submit" className="mt-5 rounded-lg bg-[#0052CC] px-5 py-3 font-semibold text-white disabled:cursor-wait disabled:opacity-60">{pending ? "Sending request…" : "Request payment method change"}</button>
  </form>;
}
