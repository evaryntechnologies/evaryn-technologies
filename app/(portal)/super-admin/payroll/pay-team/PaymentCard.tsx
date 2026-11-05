"use client";
import Link from "next/link";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { settleEmployeeTotal, type SettlementFeedback } from "../pay-team-actions";
const initial: SettlementFeedback = {status:"idle",message:""};
function SubmitPayment({disabled}:{disabled:boolean}){
 const {pending}=useFormStatus();return <button type="submit" disabled={disabled||pending} className="rounded-xl bg-[#6ECFEA] px-5 py-3 font-semibold text-[#071D38] hover:bg-[#91E0F3] disabled:cursor-not-allowed disabled:opacity-40">{pending?"Recording…":"Record full payment"}</button>;
}
export function PaymentCard({employeeId,fullName,accrued,adjustments,amount,entries,periods,hasMethod}:{employeeId:string;fullName:string;accrued:string;adjustments:string;amount:string;entries:number;periods:number;hasMethod:boolean}){
 const [feedback,action]=useActionState(settleEmployeeTotal,initial);const router=useRouter();
 useEffect(()=>{if(feedback.status==="success")router.refresh()},[feedback.status,router]);
 const positive=Number(amount)>0;
 return <article className="rounded-2xl border border-[#2B536F] bg-[#102D4D] p-6 shadow-lg shadow-[#06162A]/20">
   <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-lg font-semibold">{fullName}</h3><p className="text-sm text-slate-300">{entries} earnings entries · {periods} payout period{periods===1?"":"s"}</p></div><span className="rounded-full border border-[#9975C9] bg-[#332454] px-3 py-1 text-xs text-[#E9DAFF]">Awaiting payout</span></div>
   <dl className="mt-5 space-y-3 text-sm"><div className="flex justify-between gap-3"><dt className="text-slate-300">Approved accrued earnings</dt><dd className="font-semibold tabular-nums">${accrued}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-300">Named final adjustments</dt><dd className="font-semibold tabular-nums">{Number(adjustments)>=0?"+":""}${adjustments}</dd></div><div className="flex justify-between gap-3 border-t border-[#41627D] pt-4"><dt className="font-semibold">Final amount to remit</dt><dd className="text-2xl font-bold tabular-nums text-cyan-200">${amount}</dd></div></dl>
   <Link href="/portal/super-admin/on-hold" className="mt-5 inline-block text-sm font-semibold text-[#C6AFF1] underline underline-offset-4">Adjust this employee in On Hold</Link>
   {!hasMethod&&<p role="alert" className="mt-3 rounded-lg bg-amber-900/30 p-3 text-sm text-amber-200">Employee has no recorded payment method.</p>}
   {!positive&&<p role="alert" className="mt-3 rounded-lg bg-amber-900/30 p-3 text-sm text-amber-200">No positive amount to remit. Resolve a negative balance in On Hold; zero-payout closeout is not supported here.</p>}
   <form action={action} className="mt-5 space-y-3"><input type="hidden" name="employeeId" value={employeeId}/><label className="block text-sm text-slate-200">External transfer reference<input name="reference" required minLength={3} maxLength={120} placeholder="Bank or transfer transaction reference" className="mt-1 w-full rounded-xl border border-[#41627D] bg-[#071D38] p-3 text-white"/></label><p className="text-xs leading-5 text-slate-300">Record only after actually remitting the displayed amount. The payment is final and locks all settled entries. This does not transfer money.</p>{feedback.message&&<p role="status" aria-live="polite" className={`rounded-lg p-3 text-sm ${feedback.status==="success"?"bg-emerald-900/30 text-emerald-200":"bg-rose-900/30 text-rose-200"}`}>{feedback.message}</p>}<SubmitPayment disabled={!hasMethod||!positive}/></form>
 </article>;
}
