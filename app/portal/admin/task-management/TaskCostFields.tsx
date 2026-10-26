"use client";
import {useMemo,useState} from "react";
type Category = {id:string;name:string;rate:string;billingUnit:string};
const label:Record<string,string>={TASK:"task",PAGE:"page",HOUR:"hour",EDITED_VIDEO:"edited video",EDITED_PHOTO:"edited photo"};
export default function TaskCostFields({categories,workers}:{categories:Category[];workers:{id:string;fullName:string;email:string;categoryIds:string[]}[]}) {
 const [selected,setSelected]=useState(""); const [quantity,setQuantity]=useState("1");
 const category=useMemo(()=>categories.find(c=>c.name===selected),[categories,selected]);
 const count=Number(quantity); const total=category&&Number.isFinite(count)&&count>0 ? (Number(category.rate)*count).toFixed(2):"0.00";
 const field="mt-2 w-full rounded-xl border border-slate-600 bg-[#071327] px-4 py-3 font-bold text-white";
 return <>
 <label>Category<select name="category" required value={selected} onChange={e=>setSelected(e.target.value)} className={field}><option value="">Select category</option>{categories.map(c=><option key={c.name} value={c.name}>{c.name}</option>)}</select></label>
 <label>Assigned Tasker<select key={selected} name="assignedToId" required defaultValue="" className={field}><option value="">Select eligible Tasker</option>{workers.filter(w=>category&&w.categoryIds.includes(category.id)).map(w=><option key={w.id} value={w.id}>{w.fullName} ({w.email})</option>)}</select></label>
 <label>Rate per unit<input readOnly value={category?`$${Number(category.rate).toFixed(2)} per ${label[category.billingUnit]??category.billingUnit}`:"Choose a category"} className={field} /></label>
 <label>Units ordered<input name="unitsOrdered" required min="0.01" max="100000000" step="0.01" type="number" value={quantity} onChange={e=>setQuantity(e.target.value)} className={field}/></label>
 <label>Order cost (USD)<output className={field+" block"}>${total}</output></label>
 </>;
}
