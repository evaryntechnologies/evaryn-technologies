"use client";
import {useActionState,useEffect,useMemo,useState} from "react";
import {useFormStatus} from "react-dom";
import {useRouter} from "next/navigation";
import {settleEmployeeTotal,type SettlementFeedback} from "../pay-team-actions";
const initial:SettlementFeedback={status:"idle",message:""};
function Submit({disabled}:{disabled:boolean}){const {pending}=useFormStatus();return <button disabled={disabled||pending} className="evx-btn evx-btn-primary">{pending?"Recording…":"Record verified payment"}</button>}
export function PaymentCard({employeeId,fullName,amount,hasMethod,canSettle,preferredCurrency="USD"}:{employeeId:string;fullName:string;amount:string;hasMethod:boolean;canSettle:boolean;preferredCurrency?:"USD"|"KES"}){
 const [state,action]=useActionState(settleEmployeeTotal,initial);const router=useRouter();
 const [currency,setCurrency]=useState<"USD"|"KES">(preferredCurrency);
 const [rate,setRate]=useState("");const [paidAmount,setPaidAmount]=useState("");
 const expected=useMemo(()=>currency==="USD"?Number(amount):Number(rate)>0?Math.round(Number(amount)*Number(rate)*100)/100:NaN,[amount,rate,currency]);
 useEffect(()=>{if(state.status==="success")router.refresh()},[state.status,router]);
 const fmt=(n:number,c:"USD"|"KES")=>Number.isFinite(n)?new Intl.NumberFormat("en-KE",{style:"currency",currency:c}).format(n):"Enter a valid exchange rate";
 return <form action={action} className="evx-panel evx-form"><h4>Record actual payment</h4>
 <p className="evx-meta">{fullName} · {fmt(Number(amount),"USD")} accounting balance. This records an external transfer; it does not send money.</p>
 <input type="hidden" name="employeeId" value={employeeId}/>
 <label className="evx-field"><span>Payment currency</span><select className="evx-select" name="paymentCurrency" required value={currency} onChange={e=>{setCurrency(e.target.value as "USD"|"KES");setPaidAmount("")}}><option value="USD">USD — US Dollar</option><option value="KES">KES — Kenyan Shilling</option></select></label>
 {currency==="KES"&&<><label className="evx-field"><span>Verified rate · KES for 1 USD</span><input className="evx-input" name="exchangeRate" type="number" min="1" max="10000" step="0.000001" required value={rate} onChange={e=>setRate(e.target.value)} placeholder="Enter rate used by your transfer provider"/></label><p className="evx-meta">Use the actual provider/bank rate for this transfer, not an estimated live market rate. The rate and amount will be saved in the payment audit.</p></>}
 <p className="evx-meta" style={{fontWeight:700}}>Expected {currency} transfer: {fmt(expected,currency)}</p>
 <label className="evx-field"><span>Actual transferred amount ({currency})</span><input className="evx-input" type="number" name="transferAmount" min="0.01" step="0.01" required value={paidAmount} onChange={e=>setPaidAmount(e.target.value)} placeholder={Number.isFinite(expected)?expected.toFixed(2):"Enter rate first"}/></label>
 <label className="evx-field"><span>Bank / transfer reference</span><input required minLength={3} maxLength={120} name="reference" className="evx-input"/></label>
 {!hasMethod&&<p className="evx-meta" style={{color:"var(--evx-amber)"}}>No saved employee payment method.</p>}
 {state.message&&<p role="status" className="evx-meta" style={{color:state.status==="success"?"var(--evx-green)":"var(--evx-rose)",fontWeight:600}}>{state.message}</p>}
 <Submit disabled={!canSettle||!hasMethod||!Number.isFinite(expected)||Number(paidAmount).toFixed(2)!==expected.toFixed(2)}/>
 </form>;
}
