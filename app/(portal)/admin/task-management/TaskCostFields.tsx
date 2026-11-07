"use client";
import {useMemo,useState} from "react";
type Category = {id:string;name:string;rate:string;billingUnit:string;rateKES:string|null};
const label:Record<string,string>={TASK:"task",PAGE:"page",HOUR:"hour",EDITED_VIDEO:"edited video",EDITED_PHOTO:"edited photo"};
export default function TaskCostFields({categories,workers}:{categories:Category[];workers:{id:string;fullName:string;email:string;categoryIds:string[]}[]}) {
 const [selected,setSelected]=useState(""); const [quantity,setQuantity]=useState("1"); const [mode,setMode]=useState("OPEN");
 const [rateSelection,setRateSelection]=useState("PREDEFINED"); const [currency,setCurrency]=useState<"USD"|"KES">("USD");
 const [customRate,setCustomRate]=useState(""); const [customTotal,setCustomTotal]=useState("");
 const category=useMemo(()=>categories.find(c=>c.name===selected),[categories,selected]);
 const count=Number(quantity);
 const customAmount=rateSelection==="CUSTOM_TOTAL"?Number(customTotal):Number(customRate);
 const preset=currency==="KES"?category?.rateKES:category?.rate;
 const rate=rateSelection==="PREDEFINED"?Number(preset ?? 0):rateSelection==="CUSTOM_RATE"?customAmount:(count>0?customAmount/count:0);
 const total=category&&Number.isFinite(count)&&count>0&&Number.isFinite(rate)&&rate>=0 ? (rateSelection==="CUSTOM_TOTAL"?customAmount:rate*count).toFixed(2):"0.00";
 const field="mt-2 w-full rounded-xl border border-slate-600 bg-[#071327] px-4 py-3 font-bold text-white";
 return <>
 <label>Publication<select name="publishMode" value={mode} onChange={e=>setMode(e.target.value)} className={field}><option value="DRAFT">Save as draft (private)</option><option value="OPEN">Publish to Task Hub (unassigned)</option><option value="ASSIGN">Assign directly to a Tasker</option></select></label>
 <label>Category<select name="category" required value={selected} onChange={e=>{setSelected(e.target.value);setRateSelection("PREDEFINED");setCustomRate("");setCustomTotal("");}} className={field}><option value="">Select category</option>{categories.map(c=><option key={c.name} value={c.name}>{c.name}</option>)}</select></label>
 {mode === "ASSIGN" && <label>Assigned Tasker<select key={selected} name="assignedToId" required defaultValue="" className={field}><option value="">Select eligible Tasker</option>{workers.filter(w=>category&&w.categoryIds.includes(category.id)).map(w=><option key={w.id} value={w.id}>{w.fullName} ({w.email})</option>)}</select></label>}
 <label>Pricing option<select name="rateSelection" value={rateSelection} onChange={e=>setRateSelection(e.target.value)} className={field}><option value="PREDEFINED">Predefined rate</option><option value="CUSTOM_RATE">Custom rate per unit</option><option value="CUSTOM_TOTAL">Custom total amount</option></select></label>
 <label>Pricing currency<select name="pricingCurrency" value={currency} onChange={e=>setCurrency(e.target.value as "USD"|"KES")} className={field}><option value="USD">USD ($)</option><option value="KES">KES (KSh)</option></select></label>
 {rateSelection==="PREDEFINED"&&<label>Predefined rate per unit<input readOnly value={category?(preset===null||preset===undefined?"Not configured — select custom pricing":`${currency} ${Number(preset).toFixed(2)} per ${label[category.billingUnit]??category.billingUnit}`):"Choose a category"} className={field}/></label>}
 {rateSelection==="CUSTOM_RATE"&&<label>Custom rate per unit ({currency})<input name="customRate" type="number" required min="0" step="0.01" value={customRate} onChange={e=>setCustomRate(e.target.value)} className={field}/></label>}
 {rateSelection==="CUSTOM_TOTAL"&&<label>Custom total for service ({currency})<input name="customTotal" type="number" required min="0" step="0.01" value={customTotal} onChange={e=>setCustomTotal(e.target.value)} className={field}/></label>}
 {rateSelection==="PREDEFINED"&&preset==null&&<p role="alert" className="text-amber-300">No predefined {currency} rate for this category. Choose Custom rate or Custom total.</p>}
 <label>Units ordered<input name="unitsOrdered" required min="0.01" max="100000000" step="0.01" type="number" value={quantity} onChange={e=>setQuantity(e.target.value)} className={field}/></label>
 <label>Order total ({currency})<output className={field+" block"}>{currency} {total}</output></label>
 </>;
}
