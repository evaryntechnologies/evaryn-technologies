"use client";
import {useActionState,useEffect} from "react";
import {useFormStatus} from "react-dom";
import {useRouter} from "next/navigation";
import {settleEmployeeTotal,type SettlementFeedback} from "../pay-team-actions";
const initial:SettlementFeedback={status:"idle",message:""};
function Submit({disabled}:{disabled:boolean}){const {pending}=useFormStatus();return <button disabled={disabled||pending} className="evx-btn evx-btn-primary">{pending?"Recording…":"Record verified payment"}</button>}
export function PaymentCard({employeeId,fullName,amount,hasMethod,canSettle}:{employeeId:string;fullName:string;amount:string;hasMethod:boolean;canSettle:boolean}){
 const [state,action]=useActionState(settleEmployeeTotal,initial);const router=useRouter();
 useEffect(()=>{if(state.status==="success")router.refresh()},[state.status,router]);
 return <form action={action} className="evx-panel evx-form"><h4>Record actual payment</h4><p className="evx-meta">{fullName} · ${amount} · this records an external transfer; it does not send money.</p><input type="hidden" name="employeeId" value={employeeId}/><label className="evx-field"><span>Bank / transfer reference</span><input required minLength={3} maxLength={120} name="reference" className="evx-input"/></label>{!hasMethod&&<p className="evx-meta" style={{color:"var(--evx-amber)"}}>No saved employee payment method.</p>}{state.message&&<p role="status" className="evx-meta" style={{color:state.status==="success"?"var(--evx-green)":"var(--evx-rose)",fontWeight:600}}>{state.message}</p>}<Submit disabled={!canSettle||!hasMethod}/></form>
}
