"use client";
import {useMemo,useState} from "react";
type Category = {id:string;name:string;rate:string;billingUnit:string};
const label:Record<string,string>={TASK:"task",PAGE:"page",HOUR:"hour",EDITED_VIDEO:"edited video",EDITED_PHOTO:"edited photo"};
export default function TaskCostFields({categories,workers}:{categories:Category[];workers:{id:string;fullName:string;email:string;categoryIds:string[]}[]}) {
 const [selected,setSelected]=useState(""); const [quantity,setQuantity]=useState("1"); const [mode,setMode]=useState("OPEN");
 const category=useMemo(()=>categories.find(c=>c.name===selected),[categories,selected]);
 const count=Number(quantity); const total=category&&Number.isFinite(count)&&count>0 ? (Number(category.rate)*count).toFixed(2):"0.00";
 const field="mt-2 w-full rounded-xl border border-slate-600 bg-[#071327] px-4 py-3 font-bold text-white";
 return <>
 <label>Publication<select name="publishMode" value={mode} onChange={e=>setMode(e.target.value)} className={field}><option value="DRAFT">Save as draft (private)</option><option value="OPEN">Publish to Task Hub (unassigned)</option><option value="ASSIGN">Assign directly to a Tasker</option></select></label>
 <label>Category<select name="category" required value={selected} onChange={e=>setSelected(e.target.value)} className={field}><option value="">Select category</option>{categories.map(c=><option key={c.name} value={c.name}>{c.name}</option>)}</select></label>
 {mode === "ASSIGN" && <label>Assigned Tasker<select key={selected} name="assignedToId" required defaultValue="" className={field}><option value="">Select eligible Tasker</option>{workers.filter(w=>category&&w.categoryIds.includes(category.id)).map(w=><option key={w.id} value={w.id}>{w.fullName} ({w.email})</option>)}</select></label>}
 <label>Rate per unit<input readOnly value={category?`$${Number(category.rate).toFixed(2)} per ${label[category.billingUnit]??category.billingUnit}`:"Choose a category"} className={field} /></label>
 <label>Units ordered<input name="unitsOrdered" required min="0.01" max="100000000" step="0.01" type="number" value={quantity} onChange={e=>setQuantity(e.target.value)} className={field}/></label>
 <label>Order cost (USD)<output className={field+" block"}>${total}</output></label>
 </>;
}
