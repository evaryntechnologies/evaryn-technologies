"use client";
import { useState } from "react";
import { settleTeamBalance } from "../pay-team-actions";

export function PaymentCard({employeeId,fullName,payoutDate,amount,entries,hasMethod,isDue}:{employeeId:string;fullName:string;payoutDate:string;amount:string;entries:number;hasMethod:boolean;isDue:boolean}){
  const [custom,setCustom]=useState(false);
  return <article className="rounded-2xl border border-white/10 bg-[#101F39] p-5 shadow-lg shadow-black/10">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-lg font-semibold text-white">{fullName}</h3><p className="text-sm text-slate-300">{entries} approved entries · Payout {payoutDate}</p></div><strong className="text-2xl text-cyan-200">${amount}</strong></div>
    {!hasMethod&&<p className="mt-3 rounded-lg bg-amber-900/30 p-3 text-sm text-amber-200">Approved payment method required.</p>}
    {!isDue&&<p className="mt-3 rounded-lg bg-slate-600/20 p-3 text-sm text-slate-300">Scheduled payout date has not arrived.</p>}
    <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={()=>setCustom(false)} className={`rounded-lg px-4 py-2 text-sm font-semibold ${!custom?'bg-[#2478E7] text-white':'border border-white/20 text-slate-200'}`}>Pay in full</button><button type="button" onClick={()=>setCustom(true)} className={`rounded-lg px-4 py-2 text-sm font-semibold ${custom?'bg-[#2478E7] text-white':'border border-white/20 text-slate-200'}`}>Enter amount to pay</button></div>
    <form action={settleTeamBalance} className="mt-4 space-y-3">
      <input type="hidden" name="employeeId" value={employeeId}/><input type="hidden" name="payoutDate" value={payoutDate}/><input type="hidden" name="mode" value={custom?"CUSTOM":"FULL"}/>
      {custom&&<><label className="block text-sm text-slate-200">Amount to pay ($)<input name="amount" type="number" step="0.01" min="0.01" max={amount} required placeholder="0.00" className="mt-1 w-full rounded-lg border border-white/15 bg-[#071327] p-3 text-white"/></label><label className="block text-sm text-slate-200">Reason for payment adjustment <span className="text-rose-300">*</span><textarea name="reason" minLength={10} maxLength={1000} required rows={3} placeholder="Explain why the final payment differs from the approved balance" className="mt-1 w-full rounded-lg border border-white/15 bg-[#071327] p-3 text-white"/></label></>}
      <label className="block text-sm text-slate-200">External payment reference<input name="reference" required minLength={3} maxLength={150} placeholder="Transfer or transaction reference" className="mt-1 w-full rounded-lg border border-white/15 bg-[#071327] p-3 text-white"/></label>
      <p className="text-xs text-slate-400">Record an external payment only after the funds have been sent. Custom amounts close this period's approved entries as adjusted settlements; the difference is documented, not carried forward.</p>
      <button disabled={!hasMethod||!isDue} className="rounded-lg bg-[#52ABF8] px-5 py-3 font-semibold text-[#071327] hover:bg-[#7AC4FF] disabled:cursor-not-allowed disabled:opacity-40">{custom?"Record adjusted payment":"Mark full amount as paid"}</button>
    </form>
  </article>;
}
