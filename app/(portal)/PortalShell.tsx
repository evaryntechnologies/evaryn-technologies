"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import BrandLogo from "@/components/brand/BrandLogo";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, LayoutDashboard, ClipboardList, PanelsTopLeft, Wallet, Bell, CreditCard, Users, ChevronDown, ShieldCheck, Clock3, Settings2, MessageSquare, ChevronRight, LogOut, Search, Star, Gavel, Compass, HandCoins, SlidersHorizontal, CornerDownLeft } from "lucide-react";
import ThemeSwitcher from "@/components/theme/ThemeSwitcher";
import RoleLogout from "./RoleLogout";
import { signOut } from "./actions";

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
  if (role === "QA" || role === "SUPER_ADMIN")
    links.push({name:"Client Actions",href:"/portal/qa/client-actions",icon:ClipboardList});
  if (role === "QA")
    links.push({name:"Fines",href:"/portal/admin/fines",icon:Settings2});
  if (role === "QA")
    links.push({name:"Disputes",href:"/portal/admin/disputes",icon:Gavel});
  if (role === "ADMIN" || role === "SUPER_ADMIN")
    links.push(
      {name:"Operations Hub",href:"/portal/admin/operations",icon:Compass},
      {name:"Disputes",href:"/portal/admin/disputes",icon:Gavel},
      {name:"Task Management",href:"/portal/admin/task-management",icon:ClipboardList},
      {name:"Task Summary",href:"/portal/admin/task-summary",icon:PanelsTopLeft},
      {name:"Force Reassign",href:"/portal/admin/force-reassign",icon:Settings2},
      {name:"Reassignment Requests",href:"/portal/admin/reassignments",icon:Settings2},
      {name:"Fines & Penalties",href:"/portal/admin/fines",icon:Settings2},
      {name:"Recruitment",href:"/portal/admin/recruitment",icon:Users},
      {name:"Payment Approvals",href:"/portal/admin/payment-approvals",icon:CreditCard},
    );
  if (role === "ADMIN") links.push(
    {name:"Review & QA Oversight",href:"/portal/admin/review-qa",icon:ShieldCheck},
    {name:"Employee Management",href:"/portal/admin/employees",icon:Users},
    {name:"Time Tracker",href:"/portal/admin/time-tracker",icon:Clock3},
  );
  if (role === "SUPER_ADMIN") links.push(
    {name:"Employees",href:"/portal/super-admin/employees",icon:Users},
    {name:"Payroll",href:"/portal/super-admin/payroll",icon:Wallet},
    {name:"Pay Team",href:"/portal/super-admin/payroll/pay-team",icon:HandCoins},
    {name:"Payment Adjustments",href:"/portal/super-admin/payment-adjustments",icon:SlidersHorizontal},
    {name:"Admin Hours",href:"/portal/super-admin/payroll/admin-hours",icon:Clock3},
    {name:"Categories",href:"/portal/super-admin/categories",icon:Settings2},
    {name:"Inquiries",href:"/portal/super-admin/inquiries",icon:MessageSquare},
    {name:"Client Requests",href:"/portal/super-admin/client-requests",icon:ClipboardList},
    {name:"Company Email",href:"/portal/super-admin/emails",icon:MessageSquare},
    {name:"Expert Applications",href:"/portal/super-admin/expert-applications",icon:Users},
    {name:"Audit Log",href:"/portal/super-admin/audit-log",icon:ShieldCheck},
  );
  links.push(...baseMenu.slice(1), {name:"Ratings & Rubrics",href:"/portal/ratings",icon:Star});
  return links;
}
// Navigation presentation only: authorization remains enforced by the destination routes.
type NavigationGroup = { name: string; icon: typeof LayoutDashboard; items: MenuItem[] };
type NavigationEntry = MenuItem | NavigationGroup;

function groupedNavigation(role: Role): NavigationEntry[] {
  const links = roleMenu(role);
  const used = new Set<string>();
  const single = (name: string): MenuItem | undefined => {
    const link = links.find(item => item.name === name && !used.has(item.href));
    if (link) used.add(link.href);
    return link;
  };
  const section = (name: string, icon: typeof LayoutDashboard, names: string[]): NavigationGroup | undefined => {
    const items = names.map(single).filter((item): item is MenuItem => Boolean(item));
    return items.length ? {name, icon, items} : undefined;
  };
  const navigation: (NavigationEntry | undefined)[] = [
    single("Dashboard"),
    single("All My Orders"),
    section("My Orders", ClipboardList, ["Task Hub", "In Progress", "In Revision", "Completed", "Canceled Orders"]),
  ];
  if (role === "SUPER_ADMIN") navigation.splice(1, 0, single("Client Requests"));
  if (role !== "TASKER") {
    navigation.push(section("Order Queues", ShieldCheck, ["Review Queue", "QA Queue", "Client Actions"]));
  }
  if (role === "SUPER_ADMIN" || role === "ADMIN") {
    navigation.push(
      section("Operations Hub", Compass, [
        "Operations Hub", "Task Management", "Task Summary", "Force Reassign",
        "Reassignment Requests", "Categories", "Review & QA Oversight",
        "Fines & Penalties", "Disputes", "Ratings & Rubrics",
      ]),
      section("People Management", Users, ["Employees", "Employee Management", "Recruitment"]),
      section("Finance & Payroll", Wallet, [
        "Payment Approvals", "Payment Adjustments", "Payroll", "Pay Team",
        "Admin Hours", "Time Tracker", "My Earnings", "Payment Method",
      ]),
    );
    if (role === "SUPER_ADMIN") {
      navigation.push(section("Administration", Settings2, ["Inquiries", "Company Email", "Expert Applications", "Audit Log"]));
    }
    // Team memos is a shared page, linked here without changing any role permissions.
    navigation.push({name:"Team Memos",href:"/portal/announcements",icon:MessageSquare});
  } else if (role === "QA") {
    navigation.push(section("Quality & Oversight", ShieldCheck, ["Fines", "Disputes", "Ratings & Rubrics"]));
    navigation.push({name:"Team Memos",href:"/portal/announcements",icon:MessageSquare});
  } else if (role === "REVIEWER") {
    navigation.push(section("Quality & Feedback", Star, ["Ratings & Rubrics"]));
    navigation.push({name:"Team Memos",href:"/portal/announcements",icon:MessageSquare});
  } else {
    navigation.push(section("Feedback", Star, ["Ratings & Rubrics"]));
  }
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    navigation.push(section("Finances", Wallet, ["My Earnings", "Payment Method"]));
  }
  // Notifications are available through the persistent header bell, not duplicated in the sidebar.
  const remaining = links.filter(item => !used.has(item.href) && item.name !== "Notifications");
  if (remaining.length) navigation.push({name:"More Workspace Tools",icon:PanelsTopLeft,items:remaining});
  return navigation.filter((item): item is NavigationEntry => Boolean(item));
}
function isNavigationGroup(item:MenuItem | NavigationGroup): item is NavigationGroup {
  return "items" in item;
}
const authRoutes = ["/portal/login","/portal/register","/portal/change-password","/portal/unauthorized"];

export default function PortalShell({children,unreadNotifications=0}:{children:ReactNode;unreadNotifications?:number}) {
  const pathname=usePathname();
  const params=useSearchParams();
  const [role,setRole]=useState<Role|null>(null);
  const [firstName,setFirstName]=useState("");
  const [open,setOpen]=useState(false);
  const [loading,setLoading]=useState(true);
  const [unread,setUnread]=useState(unreadNotifications);
  const [cmdOpen,setCmdOpen]=useState(false);
  const [query,setQuery]=useState("");
  const [cursor,setCursor]=useState(0);
  const router=useRouter();
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
  useEffect(()=>{
    if(isAuth) return;
    let alive=true;
    const refresh=async()=>{try{const r=await fetch("/api/portal/notifications/unread",{cache:"no-store"});if(r.ok){const d=await r.json();if(alive)setUnread(Number(d.count)||0);}}catch{/* keep previous badge while offline */}};
    void refresh();
    window.addEventListener("focus",refresh);
    const t=window.setInterval(refresh,45000);
    return ()=>{alive=false;window.removeEventListener("focus",refresh);window.clearInterval(t);};
  },[isAuth,pathname]);
  useEffect(()=>{
    const onKey=(e:KeyboardEvent)=>{
      if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){e.preventDefault();setCmdOpen(v=>!v);setQuery("");setCursor(0);}
      if(e.key==="Escape")setCmdOpen(false);
    };
    window.addEventListener("keydown",onKey);
    return ()=>window.removeEventListener("keydown",onKey);
  },[]);
  useEffect(()=>{setCmdOpen(false)},[pathname]);
  if(isAuth) return <>{children}</>;
  const navigation=role ? groupedNavigation(role) : [];
  const entries:MenuItem[]=navigation.flatMap(item=>isNavigationGroup(item)?item.items:[item]);
  const results=entries.filter(e=>e.name.toLowerCase().includes(query.trim().toLowerCase())).slice(0,9);
  const go=(href:string)=>{setCmdOpen(false);router.push(href);};
  const isActive=(href:string)=>{
    const [target,query]=href.split("?");
    if(pathname!==target)return false;
    if(!query)return !params.has("tab");
    return new URLSearchParams(query).get("tab")===params.get("tab");
  };
  return <div className="ev-workspace">
    <header className="ev-topbar">
      <button type="button" className="ev-menu-trigger" aria-label={open?"Close navigation":"Open navigation"} aria-controls="ev-main-sidebar" aria-expanded={open} onClick={()=>setOpen(v=>!v)}>{open?<X size={21}/>:<Menu size={21}/>}</button>
      <Link href={role?home[role]:"/portal"} className="ev-brand" aria-label="Evaryn dashboard"><BrandLogo priority className="ev-brand-image"/></Link>
      <span className="ev-top-title">{role?roleTitle[role]:"Workspace"}</span>
      <div className="ev-top-actions">
        <button type="button" className="ev-search" onClick={()=>{setCmdOpen(true);setQuery("");setCursor(0);}} aria-label="Search pages (Ctrl K)"><Search size={15} aria-hidden="true"/><span>Jump to…</span><kbd>Ctrl K</kbd></button>
        <ThemeSwitcher/>
        <Link href="/portal/notifications" aria-label={unread>0?`Notifications, ${unread} unread`:"Notifications"} title="Notifications" className="ev-top-icon ev-bell"><Bell size={18}/>{unread>0&&<span className="ev-badge">{unread>99?"99+":unread}</span>}</Link>
        {firstName&&<span className="ev-user" title={firstName}><span className="ev-avatar" aria-hidden="true">{firstName.charAt(0).toUpperCase()}</span><span className="ev-user-name">{firstName}</span></span>}
        <form action={signOut}><button type="submit" className="ev-logout" aria-label="Log out" title="Log out"><LogOut size={16} aria-hidden="true"/><span>Log out</span></button></form>
      </div>
    </header>
    {open && <button className="ev-backdrop" type="button" aria-label="Close sidebar" onClick={()=>setOpen(false)}/>}
    <aside id="ev-main-sidebar" className={`ev-sidebar ${open?"ev-sidebar-open":""}`} aria-label="Employee workspace navigation" aria-hidden={!open}>
      <div className="ev-sidebar-card"><span className="ev-avatar ev-avatar-lg" aria-hidden="true">{firstName?firstName.charAt(0).toUpperCase():"E"}</span><div><strong>{firstName||"Welcome"}</strong><small>{role?roleTitle[role]:"Workspace"}</small></div></div>
      <div className="ev-sidebar-heading"><span>NAVIGATE</span></div>
      <nav className="ev-sidebar-links" aria-label="Your available pages">
        {navigation.map(item=>{
          const Icon=item.icon;
          if(isNavigationGroup(item)){
            const active=item.items.some(child=>isActive(child.href));
            return <details key={item.name} className="ev-nav-group" open={active}>
              <summary className={`ev-nav-link ev-nav-group-trigger ${active?"ev-nav-group-active":""}`}><Icon size={17}/><span>{item.name}</span><ChevronDown size={15} className="ev-nav-chevron ev-nav-group-arrow"/></summary>
              <div className="ev-nav-group-items">{item.items.map(child=>{
                const ChildIcon=child.icon;
                return <Link tabIndex={open?0:-1} key={child.href} href={child.href} aria-current={isActive(child.href)?"page":undefined} className={`ev-nav-link ev-nav-sub-link ${isActive(child.href)?"ev-nav-active":""}`}><ChildIcon size={15}/><span>{child.name}</span>{isActive(child.href)&&<ChevronRight size={13} className="ev-nav-chevron"/>}</Link>;
              })}</div>
            </details>;
          }
          return <Link tabIndex={open?0:-1} key={item.href} href={item.href} aria-current={isActive(item.href)?"page":undefined} className={`ev-nav-link ${isActive(item.href)?"ev-nav-active":""}`}><Icon size={17}/><span>{item.name}</span>{isActive(item.href)&&<ChevronRight size={14} className="ev-nav-chevron"/>}</Link>;
        })}
        {!role && <div className="ev-menu-pending">{loading?"Loading your navigation…":"Please sign in to access your workspace."}</div>}
      </nav>
      <div className="ev-sidebar-footer"><RoleLogout/></div>
    </aside>
    {cmdOpen&&<div className="ev-cmd-backdrop" onClick={()=>setCmdOpen(false)}>
      <div className="ev-cmd" role="dialog" aria-modal="true" aria-label="Jump to a page" onClick={e=>e.stopPropagation()}>
        <div className="ev-cmd-input"><Search size={17} aria-hidden="true"/><input autoFocus value={query} onChange={e=>{setQuery(e.target.value);setCursor(0);}} placeholder="Jump to a page, e.g. Payroll, QA Queue, Earnings" aria-label="Search pages" onKeyDown={e=>{
          if(e.key==="ArrowDown"){e.preventDefault();setCursor(c=>Math.min(c+1,Math.max(results.length-1,0)));}
          if(e.key==="ArrowUp"){e.preventDefault();setCursor(c=>Math.max(c-1,0));}
          if(e.key==="Enter"&&results[cursor]){e.preventDefault();go(results[cursor].href);}
        }}/><button type="button" onClick={()=>setCmdOpen(false)} aria-label="Close search">Esc</button></div>
        <ul className="ev-cmd-list">{results.length===0?<li className="ev-cmd-empty">No matching pages.</li>:results.map((r,i)=>{const Icon=r.icon;return <li key={r.href}><button type="button" className={i===cursor?"ev-cmd-active":""} onMouseEnter={()=>setCursor(i)} onClick={()=>go(r.href)}><Icon size={16} aria-hidden="true"/><span>{r.name}</span>{i===cursor&&<CornerDownLeft size={14} aria-hidden="true"/>}</button></li>;})}</ul>
      </div>
    </div>}
    <div className="ev-workspace-main">{children}</div>
  </div>;
}
