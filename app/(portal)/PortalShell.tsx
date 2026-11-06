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
  if (role === "QA" || role === "ADMIN" || role === "SUPER_ADMIN")
    links.push({name:"Client Orders",href:"/portal/client-orders",icon:PanelsTopLeft}, {name:"Client Messages",href:"/portal/client-messages",icon:MessageSquare}, {name:"Order Register",href:"/portal/order-register",icon:Search});
  if (role === "ADMIN" || role === "SUPER_ADMIN")
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
      {name:"Post-QA Orders",href:"/portal/post-qa",icon:ShieldCheck},
      {name:"Client Decisions",href:"/portal/client-decisions",icon:MessageSquare},
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
    {name:"On Hold",href:"/portal/super-admin/on-hold",icon:Wallet},
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

// EVARYN_WORKSPACE_CLARITY_V1: one visible destination per feature; role-specific sections.
// The links originate from roleMenu, so existing role checks and destinations are retained.
// EVARYN_TASK_MANAGEMENT_SIDEBAR_V2: explicit role-aware Task Management navigation; no duplicate destinations.
// EVARYN_TASK_SIDEBAR_FINAL_V3: role-specific Task Management contains Task Hub and My Orders.
function groupedNavigation(role: Role): NavigationEntry[] {
  const source = roleMenu(role);
  const seen = new Set<string>();
  const groups: Record<string, MenuItem[]> = {
    "My Work": [],
    "Review & Quality": [],
    "Task Management": [],
    "Client Management": [],
    "People & Talent": [],
    "Finance & Payroll": [],
    "Communication": [],
    "Administration": [],
  };
  const icons: Record<string, typeof LayoutDashboard> = {
    "My Work": ClipboardList,
    "Review & Quality": ShieldCheck,
    "Task Management": ClipboardList,
    "Client Management": MessageSquare,
    "People & Talent": Users,
    "Finance & Payroll": Wallet,
    "Communication": Bell,
    "Administration": Settings2,
  };
  const dashboard = source.find(item => item.name === "Dashboard") ?? { name: "Dashboard", href: home[role], icon: LayoutDashboard };
  seen.add(dashboard.href.split("?")[0]);
  const canManageClients = role === "ADMIN" || role === "SUPER_ADMIN";
  const supplied: MenuItem[] = source.map(item => item.name === "All My Orders" ? {...item, name:"My Orders"} : item);
  // The legacy client-requests shortcut is consolidated here, rather than rendered above the sections.
  if (role === "SUPER_ADMIN") supplied.push({name:"Client Requests", href:"/portal/super-admin/client-requests", icon:ClipboardList});
  // Preserve all existing role-specific links, but show each destination only once.
  for (const item of supplied) {
    const path = item.href.split("?")[0];
    // All My Orders already includes progress, revision, completion and canceled tabs.
    if (item.href.includes("?tab=")) continue;
    // Keep a single dashboard link and avoid an extra Task Hub where admin Operations Hub is present.
    if (item.name === "Dashboard" || seen.has(path)) continue;
    if (item.name === "Notifications") continue; // persistent header bell
    if (item.name === "On Hold") continue; // superseded by Pay Team
    seen.add(path);
    const name = item.name.toLowerCase();
    const href = path.toLowerCase();
    let section: keyof typeof groups = "Administration";
    if (item.name === "Task Hub" || item.name === "My Orders") section = "Task Management";
    else if (canManageClients && /order register|post.qa|fines? & penalties|categories|reassignment requests|force reassign|task management|task summary|operations hub|task.management|task.summary|admin.fines|admin.reassignments|admin.force.reassign|super.admin.categories|order.register|post.qa/.test(name+" "+href)) section = "Task Management";
    else if (/client|delivery/.test(name+" "+href) && canManageClients) section = "Client Management";
    else if (/email|notification|memo|announcement|inquir/.test(name+" "+href)) section = "Communication";
    else if (/pay|earnings|financ|hours|time tracker|advance/.test(name+" "+href)) section = "Finance & Payroll";
    else if (/employee|recruit|expert application|people|hire/.test(name+" "+href)) section = "People & Talent";
    else if (/review|qa queue|quality|ratings|rubric/.test(name+" "+href)) section = "Review & Quality";
    else if (/operations|management|task summary|reassign|force|fine|dispute|categories|audit/.test(name+" "+href) && canManageClients) section = "Task Management";
    else if (/my orders|my work|task hub|tasker|marketplace|tasks/.test(name+" "+href)) section = "My Work";
    else if (/fine|dispute/.test(name+" "+href)) section = "Review & Quality";
    groups[section].push(item);
  }
  const taskManagementPriority = [
    "Task Hub", "My Orders", "Order Register", "Post-QA Orders",
    "Fines & Penalties", "Categories", "Reassignment Requests", "Force Reassign",
  ];
  groups["Task Management"].sort((a, b) => {
    const index = (label: string) => {
      const position = taskManagementPriority.indexOf(label);
      return position < 0 ? taskManagementPriority.length : position;
    };
    return index(a.name) - index(b.name);
  });
  const order = ["My Work", "Review & Quality", "Task Management", "Client Management", "People & Talent", "Finance & Payroll", "Communication", "Administration"];
  const items: NavigationEntry[] = [dashboard];
  for (const name of order) {
    if (!groups[name].length) continue;
    items.push({ name, icon: icons[name], items: groups[name] });
  }
  return items;
}

function isNavigationGroup(item:MenuItem | NavigationGroup): item is NavigationGroup {
  return "items" in item;
}
const authRoutes = ["/portal/login","/portal/register","/portal/change-password","/portal/unauthorized"];

export default function PortalShell({children,unreadNotifications=0,initialRole=null,initialFirstName=""}:{children:ReactNode;unreadNotifications?:number;initialRole?:Role|null;initialFirstName?:string}) {
  const pathname=usePathname();
  const params=useSearchParams();
  const [role,setRole]=useState<Role|null>(initialRole);
  const [firstName,setFirstName]=useState(initialFirstName);
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
