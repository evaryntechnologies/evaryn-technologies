"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import PaymentChangeFields from "./PaymentChangeFields";

export default function PaymentRequestForm({ hasCurrent }: { hasCurrent: boolean }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true); setMessage("");
    try {
      const response = await fetch("/api/portal/payment-method", {
        method: "POST", body: new FormData(event.currentTarget), credentials: "same-origin",
      });
      const result: { ok?: boolean; error?: string } = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || `Request failed (${response.status}).`);
      setSuccess(true);
      setMessage("Submitted successfully. Your payment method is pending approval by an Admin or Super Admin.");
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to submit the payment method.");
    } finally { setSubmitting(false); }
  }
  return <form onSubmit={submit} className="mt-6 max-w-2xl rounded-xl border border-white/10 bg-[#101F39] p-5">
    {!success && <PaymentChangeFields />}
    {message && <p role="status" aria-live="polite" className={`mt-4 rounded-lg p-3 text-sm ${success ? "bg-emerald-950 text-emerald-200" : "bg-rose-950 text-rose-200"}`}>{message}</p>}
    {!success && <button type="submit" disabled={submitting} className="mt-5 rounded-lg bg-[#0052CC] px-5 py-3 font-semibold disabled:opacity-50">{submitting ? "Submitting…" : hasCurrent ? "Request payment method change" : "Submit payment method for approval"}</button>}
  </form>;
}
