"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
type Role="TASKER"|"REVIEWER"|"QA"|"ADMIN";
export default function WorkTabs({role}:{role:Role}){
 const pathname=usePathname(); const params=useSearchParams();
 const base=role==="TASKER"?"/portal/tasker/my-tasks":"/portal/my-work";
 const tabs=[
  {label:"Dashboard",href:`/portal/${role.toLowerCase()}`},
  {label:"Task Hub",href:"/portal/task-hub"},
  {label:"All My Orders",href:base},
  {label:"In Progress",href:`${base}?tab=progress`},
  {label:"In Revision",href:`${base}?tab=revision`},
  {label:"Completed",href:`${base}?tab=completed`},
  {label:"Canceled Orders",href:`${base}?tab=cancelled`},
 ];
 return <nav aria-label="My work navigation" className="flex w-full flex-wrap gap-2 border-y border-white/10 bg-[#0B1B34] px-5 py-3 sm:px-10">
 {tabs.map(t=>{const active=pathname===t.href.split("?")[0] && ((t.href.includes("?tab="))?params.get("tab")===t.href.split("?tab=")[1]:!params.get("tab"));return <Link key={t.label} href={t.href} aria-current={active?"page":undefined} className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors sm:text-sm ${active?"border-cyan-400 bg-[#0052CC] text-white":"border-white/15 text-cyan-100 hover:bg-white/10"}`}>{t.label}</Link>})}
 </nav>;
}
