"use client";
import { useEffect, useState } from "react";
export default function LiveAdminTracker(){
  const [data,setData]=useState<{activeSeconds:number,accrued:number}|null>(null);
  useEffect(()=>{
    let live=true;
    const load=async()=>{try{const r=await fetch("/api/portal/admin/activity",{cache:"no-store"});if(r.ok){const j=await r.json();if(live)setData(j);}}catch{}};
    void load();const id=window.setInterval(()=>void load(),15000);
    return()=>{live=false;window.clearInterval(id);};
  },[]);
  return <section aria-live="polite" className="mt-5 grid gap-3 sm:grid-cols-2">
    <div className="rounded-xl bg-[#101F39] p-5"><p className="text-sm text-slate-300">Recorded active time (lifetime)</p><strong className="mt-2 block text-2xl">{data?`${(data.activeSeconds/3600).toFixed(2)} hours`:"Loading…"}</strong></div>
    <div className="rounded-xl bg-[#101F39] p-5"><p className="text-sm text-slate-300">Accrued activity pay (lifetime)</p><strong className="mt-2 block text-2xl">{data?data.accrued.toFixed(2):"Loading…"}</strong></div>
  </section>;
}
