"use client";

import { useMemo, useState } from "react";
import { Search, Users, UserRound, Globe2 } from "lucide-react";

type Employee = {id:string;fullName:string;role:string};
const roles = [
  {id:"TASKER",label:"All taskers"},
  {id:"REVIEWER",label:"All reviewers"},
  {id:"QA",label:"All QA"},
  {id:"ADMIN",label:"All admins"},
  {id:"SUPER_ADMIN",label:"Super Admin"},
];

export default function RecipientPicker({employees}:{employees:Employee[]}) {
  const [general,setGeneral] = useState(false);
  const [search,setSearch] = useState("");
  const [people,setPeople] = useState<string[]>([]);
  const [groups,setGroups] = useState<string[]>([]);
  const shown = useMemo(()=>employees.filter(x=>(x.fullName+" "+x.role).toLowerCase().includes(search.toLowerCase())).slice(0,100),[employees,search]);
  const toggle=(set:(n:string[])=>void, old:string[], id:string)=>set(old.includes(id)?old.filter(x=>x!==id):[...old,id]);
  return <section className="space-y-5">
    <div className="grid gap-3 sm:grid-cols-2">
      <label className={`flex cursor-pointer gap-3 rounded-xl border p-4 ${!general?"border-[#7956AF] bg-[#7956AF]/10":"border-[var(--ev-border)] bg-[var(--ev-surface-2)]"}`}><input type="radio" name="scope" value="SELECTED" checked={!general} onChange={()=>setGeneral(false)} className="mt-1 accent-[#7956AF]"/><UserRound size={20} className="shrink-0 text-[#7956AF]"/><span><strong className="block text-sm">Specific people or teams</strong><span className="mt-1 block text-xs leading-5 text-[var(--ev-muted)]">Only chosen employees and team members can see the discussion.</span></span></label>
      <label className={`flex cursor-pointer gap-3 rounded-xl border p-4 ${general?"border-[#00A8D4] bg-[#00A8D4]/10":"border-[var(--ev-border)] bg-[var(--ev-surface-2)]"}`}><input type="radio" name="scope" value="GENERAL" checked={general} onChange={()=>setGeneral(true)} className="mt-1 accent-[#00A8D4]"/><Globe2 size={20} className="shrink-0 text-[#00A8D4]"/><span><strong className="block text-sm">General — entire company</strong><span className="mt-1 block text-xs leading-5 text-[var(--ev-muted)]">All active employees can view and reply. Do not post confidential information.</span></span></label>
    </div>
    {!general&&<>
      <div><p className="mb-3 flex items-center gap-2 text-sm font-semibold"><Users size={17} className="text-[#7956AF]"/> Select entire teams</p><div className="flex flex-wrap gap-2">{roles.map(r=><label key={r.id} className={`cursor-pointer rounded-xl border px-3 py-2 text-sm ${groups.includes(r.id)?"border-[#7956AF] bg-[#7956AF]/10":"border-[var(--ev-border)] bg-[var(--ev-surface-2)]"}`}><input className="mr-2 accent-[#7956AF]" type="checkbox" name="roles" value={r.id} checked={groups.includes(r.id)} onChange={()=>toggle(setGroups,groups,r.id)}/>{r.label}</label>)}</div></div>
      <div><p className="mb-3 text-sm font-semibold">Select named recipients</p><label className="flex items-center gap-2 rounded-xl border border-[var(--ev-border)] bg-[var(--ev-surface-2)] px-4"><Search size={17} className="text-[var(--ev-muted)]"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search employee name or role" aria-label="Search employees" className="min-h-12 w-full min-w-0 bg-transparent text-sm outline-none"/></label><div className="mt-3 max-h-64 overflow-y-auto rounded-xl border border-[var(--ev-border)] bg-[var(--ev-surface-2)] p-2">{shown.length?shown.map(p=><label key={p.id} className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-[#7956AF]/10"><input type="checkbox" name="employees" value={p.id} checked={people.includes(p.id)} onChange={()=>toggle(setPeople,people,p.id)} className="accent-[#7956AF]"/><span className="min-w-0 flex-1 text-sm font-medium">{p.fullName}</span><span className="text-xs text-[var(--ev-muted)]">{p.role.replaceAll("_"," ")}</span></label>):<p className="p-3 text-sm text-[var(--ev-muted)]">No active employees match your search.</p>}</div><p className="mt-2 text-xs text-[var(--ev-muted)]">{people.length} selected individually · {groups.length} team groups. Duplicate recipients are automatically removed.</p></div>
    </>}
  </section>;
}
