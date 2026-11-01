import { changeEmployeeRole,changeEmployeeStatus,deleteEmployeeAccount } from "./access-actions";

type Props = {id:string; role:string;status:string;isSelf:boolean};
export default function EmployeeAccessControls({id,role,status,isSelf}:Props){
 if(isSelf||role==="SUPER_ADMIN"||status==="DELETED") return null;
 return <details className="w-full rounded-xl border border-white/20 p-3 text-sm">
   <summary className="cursor-pointer font-semibold text-cyan-200">Super Admin: manage account</summary>
   <div className="mt-3 grid gap-4">
     <form action={changeEmployeeRole} className="flex flex-wrap items-end gap-2">
       <input type="hidden" name="employeeId" value={id}/>
       <label className="grid gap-1">Role (promote or demote)
         <select name="role" defaultValue={role} className="rounded-lg bg-[#071327] p-2 border border-white/20">
           {[["TASKER","Tasker"],["REVIEWER","Reviewer"],["QA","QA"],["ADMIN","Admin"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}
         </select>
       </label>
       <button className="rounded-lg bg-blue-700 px-3 py-2 font-semibold">Save role</button>
     </form>
     <form action={changeEmployeeStatus} className="flex flex-wrap items-end gap-2">
       <input type="hidden" name="employeeId" value={id}/><input type="hidden" name="action" value="temporary"/>
       <label className="grid gap-1">Suspend until (date and time)
         <input required type="datetime-local" name="until" className="rounded-lg border border-white/20 bg-[#071327] p-2"/>
       </label><button className="rounded-lg bg-amber-700 px-3 py-2">Suspend temporarily</button>
     </form>
     <div className="flex flex-wrap gap-2">
       <form action={changeEmployeeStatus}><input type="hidden" name="employeeId" value={id}/><input type="hidden" name="action" value="permanent"/><button className="rounded-lg border border-red-400/50 px-3 py-2">Terminate permanently</button></form>
       {status!=="ACTIVE"&&<form action={changeEmployeeStatus}><input type="hidden" name="employeeId" value={id}/><input type="hidden" name="action" value="reinstate"/><button className="rounded-lg bg-emerald-700 px-3 py-2">Reinstate</button></form>}
     </div>
     <form action={deleteEmployeeAccount} className="flex flex-wrap gap-2 items-end border-t border-white/10 pt-3">
       <input type="hidden" name="employeeId" value={id}/>
       <label className="grid gap-1">Type DELETE to revoke login and archive this account
         <input name="confirmation" required pattern="DELETE" placeholder="DELETE" className="rounded-lg border border-white/20 bg-[#071327] p-2"/>
       </label><button className="rounded-lg bg-red-800 px-3 py-2">Delete account</button>
       <p className="w-full text-xs text-slate-400">Task history is retained; the employee profile is anonymized.</p>
     </form>
   </div>
 </details>;
}
