"use client";
import { useActionState } from "react";
import { hireApplicant, type HireState } from "./actions";
const initial:HireState={error:"",employeeId:"",temporaryPassword:""};
export default function HireApplicantForm({applicationId,categories}:{applicationId:string;categories:{id:string;name:string}[]}){
 const [state,action,pending]=useActionState(hireApplicant,initial);
 return <form action={action} className="mt-4 space-y-3 rounded-lg border border-white/15 p-4"><input type="hidden" name="applicationId" value={applicationId}/>
 <label className="block text-sm">Employment role<select name="role" className="mt-1 w-full rounded-lg bg-[#071327] p-3"><option value="TASKER">Tasker</option><option value="REVIEWER">Reviewer</option><option value="QA">QA</option><option value="ADMIN">Admin</option></select></label>
 <fieldset className="space-y-2"><legend className="font-semibold">Eligible categories (required for Tasker / Reviewer / QA)</legend>{categories.map(c=><label key={c.id} className="flex items-center gap-2 text-sm"><input type="checkbox" name="categoryIds" value={c.id}/>{c.name}</label>)}</fieldset>
 <label className="flex gap-2 text-sm"><input type="checkbox" name="emailVerified" value="yes" required/>I have verified this employee's email belongs to them.</label>
 {state.error&&<p role="alert" className="text-amber-200">{state.error}</p>}
 {state.employeeId&&<div role="status" className="rounded-lg border border-emerald-500 p-3"><p>Employee ID: {state.employeeId}</p><p className="break-all">Temporary password: {state.temporaryPassword}</p><p className="text-xs">Copy these details now; the password will not be shown again. Share using a secure channel.</p></div>}
 <button disabled={pending||Boolean(state.employeeId)} className="rounded-lg bg-[#0052CC] px-4 py-2 disabled:opacity-50">{pending?"Creating employee…":"Hire and create employee account"}</button></form>
}
