"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, LayoutDashboard, ClipboardList, PanelsTopLeft, Wallet, Bell, CreditCard, UserRound, Users, ShieldCheck, Clock3, Settings2, MessageSquare, ChevronRight, LogOut } from "lucide-react";
import ThemeSwitcher from "@/components/theme/ThemeSwitcher";
import RoleLogout from "./RoleLogout";

type Role = "TASKER" | "REVIEWER" | "QA" | "ADMIN" | "SUPER_ADMIN";
type MenuItem = { name: string; href: string; icon: typeof LayoutDashboard };
const home: Record<Role,string> = {
  TASKER: "/portal/tasker", REVIEWER: "/portal/reviewer", QA: "/portal/qa",
  ADMIN: "/portal/admin", SUPER_ADMIN: "/portal/super-admin"
};
const roleTitle: Record<Role,string> = {
  TASKER:"Tasker", REVIEWER:"Reviewer", QA:"Quality assurance", ADMIN:"Administrator", SUPER_ADMIN:"Super Administrator"
};
const baseMenu: MenuItem[] = [
  { name:"Task Hub", href:"/portal/task-hub", icon:ClipboardList },
  { name:"My Earnings", href:"/portal/earnings", icon:Wallet },
  { name:"Notifications", href:"/portal/notifications", icon:Bell },
  { name:"Payment Method", href:"/portal/payment-method", icon:CreditCard },
];
const workMenu = (role:Role):MenuItem[] => {
  const base = role === "TASKER" ? "/portal/tasker/my-tasks" : "/portal/my-work";
  return [
    {name:"All My Orders",href:base,icon:PanelsTopLeft},
    {name:"In Progress",href:base+"?tab=progress",icon:Clock3},
    {name:"In Revision",href:base+"?tab=revision",icon:Settings2},
    {name:"Completed",href:base+"?tab=completed",icon:ShieldCheck},
    {name:"Canceled Orders",href:base+"?tab=cancelled",icon:ClipboardList},
  ];
};
function roleMenu(role:Role): MenuItem[] {
  const links:MenuItem[] = [{name:"Dashboard",href:home[role],icon:LayoutDashboard},baseMenu[0],...workMenu(role)];
  if (role === "REVIEWER" || role === "QA" || role === "ADMIN" || role === "SUPER_ADMIN")
    links.push({name:"Review Queue",href:"/portal/reviewer/queue",icon:ShieldCheck});
  if (role === "QA" || role === "ADMIN" || role === "SUPER_ADMIN")
    links.push({name:"QA Queue",href:"/portal/qa/queue",icon:ShieldCheck});
  if (role === "ADMIN" || role === "SUPER_ADMIN")
    links.push(
      {name:"Task Management",href:"/portal/admin/task-management",icon:ClipboardList},
      {name:"Task Summary",href:"/portal/admin/task-summary",icon:PanelsTopLeft},
      {name:"Force Reassign",href:"/portal/admin/force-reassign",icon:Settings2},
      {name:"Recruitment",href:"/portal/admin/recruitment",icon:Users},
      {name:"Payment Approvals",href:"/portal/admin/payment-approvals",icon:CreditCard},
    );
  if (role === "ADMIN") links.push({name:"Time Tracker",href:"/portal/admin/time-tracker",icon:Clock3});
  if (role === "SUPER_ADMIN") links.push(
    {name:"Employees",href:"/portal/super-admin/employees",icon:Users},
    {name:"Payroll",href:"/portal/super-admin/payroll",icon:Wallet},
    {name:"Admin Hours",href:"/portal/super-admin/payroll/admin-hours",icon:Clock3},
    {name:"Categories",href:"/portal/super-admin/categories",icon:Settings2},
    {name:"Inquiries",href:"/portal/super-admin/inquiries",icon:MessageSquare},
    {name:"Audit Log",href:"/portal/super-admin/audit-log",icon:ShieldCheck},
  );
  links.push(...baseMenu.slice(1));
  return links;
}
const authRoutes = ["/portal/login","/portal/register","/portal/change-password","/portal/unauthorized"];

export default function PortalShell({children}:{children:ReactNode}) {
  const pathname=usePathname();
  const params=useSearchParams();
  const [role,setRole]=useState<Role|null>(null);
  const [firstName,setFirstName]=useState("");
  const [open,setOpen]=useState(false);
  const [loading,setLoading]=useState(true);
  const isAuth = !pathname || pathname === "/portal" || authRoutes.some(p=>pathname.startsWith(p));
  useEffect(()=>{
    if(isAuth) return;
    let alive=true;
    fetch("/api/portal/workspace",{cache:"no-store",credentials:"same-origin"})
      .then(async r=>r.ok?await r.json():null)
      .then(data=>{if(alive && data && data.role in home){setRole(data.role as Role);setFirstName(String(data.firstName??""));}})
      .catch(()=>{})
      .finally(()=>{if(alive)setLoading(false)});
    return ()=>{alive=false};
  },[isAuth]);
  useEffect(()=>{setOpen(false)},[pathname,params]);
  useEffect(()=>{
    if(!open)return;
    const close=(e:KeyboardEvent)=>{if(e.key==="Escape")setOpen(false)};
    window.addEventListener("keydown",close);
    return ()=>window.removeEventListener("keydown",close);
  },[open]);
  if(isAuth) return <>{children}</>;
  const entries=role?roleMenu(role):[];
  const isActive=(href:string)=>{
    const [target,query]=href.split("?");
    if(pathname!==target)return false;
    if(!query)return !params.has("tab");
    return new URLSearchParams(query).get("tab")===params.get("tab");
  };
  return <div className="ev-workspace">
    <header className="ev-topbar">
      <button type="button" className="ev-menu-trigger" aria-label={open?"Close navigation":"Open navigation"} aria-controls="ev-main-sidebar" aria-expanded={open} onClick={()=>setOpen(v=>!v)}>{open?<X size={21}/>:<Menu size={21}/>}</button>
      <Link href={role?home[role]:"/portal"} className="ev-brand" aria-label="Evaryn dashboard"><Image src="/brand/evaryn-full-trimmed.png" alt="Evaryn Technologies Limited" width={158} height={52} priority className="ev-brand-image"/></Link>
      <span className="ev-top-title">{role?roleTitle[role]:"Workspace"}</span>
      <div className="ev-top-actions"><ThemeSwitcher/><Link href="/portal/notifications" aria-label="Notifications" className="ev-top-icon"><Bell size={18}/></Link></div>
    </header>
    {open && <button className="ev-backdrop" type="button" aria-label="Close sidebar" onClick={()=>setOpen(false)}/>}
    <aside id="ev-main-sidebar" className={`ev-sidebar ${open?"ev-sidebar-open":""}`} aria-label="Employee workspace navigation" aria-hidden={!open}>
      <div className="ev-sidebar-heading"><span>WORKSPACE</span>{firstName&&<small>{firstName}</small>}</div>
      <nav className="ev-sidebar-links" aria-label="Your available pages">
        {entries.map(({href,name,icon:Icon})=><Link tabIndex={open?0:-1} key={href} href={href} aria-current={isActive(href)?"page":undefined} className={`ev-nav-link ${isActive(href)?"ev-nav-active":""}`}><Icon size={17}/><span>{name}</span>{isActive(href)&&<ChevronRight size={14} className="ev-nav-chevron"/>}</Link>)}
        {!role && <div className="ev-menu-pending">{loading?"Loading your navigation…":"Please sign in to access your workspace."}</div>}
      </nav>
      <div className="ev-sidebar-footer"><RoleLogout/></div>
    </aside>
    <div className="ev-workspace-main">{children}</div>
  </div>;
}
