"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, ClipboardList, Star, Wallet, Bell, Menu, X, ShieldCheck } from "lucide-react";

export default function PortalSidebar({role}:{role:string}) {
 const [open,setOpen]=useState(false);
 const path=usePathname();
 const base=`/portal/${role.toLowerCase().replace("_","-")}`;
 const links=[{href:base,label:"Overview",Icon:LayoutDashboard},{href:role==="TASKER"?"/portal/tasker/my-tasks":role==="REVIEWER"?"/portal/reviewer/queue":role==="QA"?"/portal/qa/queue":base,label:"Task hub",Icon:ClipboardList},{href:"/portal/ratings",label:"Ratings",Icon:Star},{href:"/portal/earnings",label:"Finances",Icon:Wallet},{href:"/portal/notifications",label:"Notifications",Icon:Bell}];
 return <><button type="button" aria-label="Open navigation" onClick={()=>setOpen(true)} className="fixed left-3 top-3 z-40 rounded-xl border border-cyan-400/30 bg-[#102442] p-3 text-white lg:hidden"><Menu size={20}/></button>{open&&<button className="fixed inset-0 z-40 bg-black/60 lg:hidden" aria-label="Close navigation" onClick={()=>setOpen(false)}/>}
 <aside className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-white/10 bg-[#08162d] px-4 py-6 text-white shadow-2xl transition-transform duration-200 lg:w-[76px] lg:hover:w-64 lg:translate-x-0 lg:focus-within:w-64 group ${open?"translate-x-0":"-translate-x-full"}`}>
 <div className="mb-9 flex items-center justify-between px-2"><span className="whitespace-nowrap text-lg font-bold tracking-widest text-cyan-300 lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100">EVARYN</span><button onClick={()=>setOpen(false)} aria-label="Close navigation" className="lg:hidden"><X/></button></div>
 <nav aria-label="Employee navigation" className="space-y-2">{links.map(({href,label,Icon})=><Link onClick={()=>setOpen(false)} key={href+label} href={href} title={label} className={`flex items-center gap-4 rounded-xl px-3 py-3 text-sm font-semibold transition ${path===href?"bg-cyan-400/15 text-cyan-200":"text-slate-300 hover:bg-white/10 hover:text-white"}`}><Icon size={21} className="shrink-0"/><span className="whitespace-nowrap lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100">{label}</span></Link>)}</nav><div className="mt-8 border-t border-white/10 pt-4"><Link href={base} className="flex items-center gap-4 px-3 text-xs text-slate-400"><ShieldCheck size={20}/><span className="lg:opacity-0 lg:group-hover:opacity-100">{role.replace("_"," ")}</span></Link></div></aside></>;
}
