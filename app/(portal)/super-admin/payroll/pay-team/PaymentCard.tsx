"use client";
import {useActionState,useEffect} from "react";
import {useFormStatus} from "react-dom";
import {useRouter} from "next/navigation";
import {settleEmployeeTotal,type SettlementFeedback} from "../pay-team-actions";
const initial:SettlementFeedback={status:"idle",message:""};
function Submit({disabled}:{disabled:boolean}){const {pending}=useFormStatus();return <button disabled={disabled||pending} className="rounded-xl bg-cyan-300 px-4 py-3 text-sm font-semibold text-[#071D38] disabled:cursor-not-allowed disabled:opacity-40">{pending?"Recording…":"Record verified payment"}</button>}
export function PaymentCard({employeeId,fullName,amount,hasMethod,canSettle}:{employeeId:string;fullName:string;amount:string;hasMethod:boolean;canSettle:boolean}){
 const [state,action]=useActionState(settleEmployeeTotal,initial);const router=useRouter();
 useEffect(()=>{if(state.status==="success")router.refresh()},[state.status,router]);
 return <form action={action} className="space-y-3 rounded-xl border border-[#355875] p-4"><h4 className="font-semibold">Record actual payment</h4><p className="text-xs text-slate-300">{fullName} · ${amount} · this records an external transfer; it does not send money.</p><input type="hidden" name="employeeId" value={employeeId}/><label className="block text-xs text-slate-300">Bank / transfer reference<input required minLength={3} maxLength={120} name="reference" className="mt-1 w-full rounded-xl border border-[#426486] bg-[#071D38] px-3 py-2.5 text-sm text-white"/></label>{!hasMethod&&<p className="text-xs text-amber-300">No saved employee payment method.</p>}{state.message&&<p role="status" className={`text-sm ${state.status==="success"?"text-emerald-300":"text-rose-300"}`}>{state.message}</p>}<Submit disabled={!canSettle||!hasMethod}/></form>
}
