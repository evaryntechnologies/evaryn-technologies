import "@/app/(portal)/compact-workspaces.css";
import "./order-register.css";
import Link from "next/link";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireEmployee } from "@/lib/auth/require-employee";
type Row={requestId:string;clientOrderCode:string|null;clientName:string;title:string;service:string;requestStatus:string;taskId:string|null;maskedId:string|null;category:string|null;taskStatus:string|null;price:string|null;tasker:string|null;qa:string|null;reviewer:string|null;createdAt:Date};
export default async function Register({searchParams}:{searchParams:Promise<{q?:string;category?:string;status?:string;tasker?:string;reviewer?:string;qa?:string;sort?:string;min?:string;max?:string}>}){
 await requireEmployee(["QA","ADMIN","SUPER_ADMIN"]);const p=await searchParams;
 const q=(p.q??"").trim().slice(0,120).toLowerCase();const category=(p.category??"").trim().slice(0,100);const status=(p.status??"").trim().slice(0,70);
 const tasker=(p.tasker??"").slice(0,150);const reviewer=(p.reviewer??"").slice(0,150);const qa=(p.qa??"").slice(0,150);
 const min=p.min&&Number.isFinite(Number(p.min))?Number(p.min):null;const max=p.max&&Number.isFinite(Number(p.max))?Number(p.max):null;
 const sort=["newest","oldest","cost-high","cost-low","title"].includes(p.sort??"")?p.sort:"newest";
 const rows=await prisma.$queryRaw<Row[]>(Prisma.sql`
 SELECT r."id" AS "requestId",r."clientOrderCode",c."fullName" AS "clientName",r."title",r."service",r."status"::text AS "requestStatus",
 t."id" AS "taskId",t."publicTaskId" AS "maskedId",t."category",t."status" AS "taskStatus",
 t."totalOrderCost"::text AS "price",worker."fullName" AS "tasker",qa."fullName" AS "qa",rev."fullName" AS "reviewer",r."createdAt"
 FROM public."ClientProjectRequest" r JOIN public."ClientProfile" c ON c."id"=r."clientId"
 LEFT JOIN public."ClientOrderLink" l ON l."requestId"=r."id"
 LEFT JOIN public."WorkTask" t ON t."id"=l."taskId"
 LEFT JOIN public."EmployeeProfile" worker ON worker."id"=t."assignedToId"
 LEFT JOIN public."EmployeeProfile" qa ON qa."id"=t."claimedQaId"
 LEFT JOIN public."EmployeeProfile" rev ON rev."id"=t."claimedReviewerId"
 ORDER BY r."createdAt" DESC LIMIT 1000`);
 const filtered=rows.filter(r=>{
 const searchable=[r.clientOrderCode,r.maskedId,r.title,r.service,r.clientName,r.tasker,r.qa,r.reviewer].join(" ").toLowerCase();
 const price=r.price===null?null:Number(r.price);
 return (!q||searchable.includes(q))&&(!category||r.service===category||r.category===category)&&(!status||r.taskStatus===status||r.requestStatus===status)&&(!tasker||r.tasker===tasker)&&(!reviewer||r.reviewer===reviewer)&&(!qa||r.qa===qa)&&(min===null||(price!==null&&price>=min))&&(max===null||(price!==null&&price<=max));
 }).sort((a,b)=>sort==="cost-high"?(Number(b.price??-1)-Number(a.price??-1)):sort==="cost-low"?(Number(a.price??Infinity)-Number(b.price??Infinity)):sort==="oldest"?(+new Date(a.createdAt)- +new Date(b.createdAt)):sort==="title"?a.title.localeCompare(b.title):(+new Date(b.createdAt)- +new Date(a.createdAt)));
 const categories=Array.from(new Set(rows.map(r=>r.service))).sort();const statuses=Array.from(new Set(rows.flatMap(r=>[r.taskStatus,r.requestStatus]).filter((x):x is string=>!!x))).sort();
 const taskers=Array.from(new Set(rows.map(r=>r.tasker).filter((x):x is string=>!!x))).sort();const reviewers=Array.from(new Set(rows.map(r=>r.reviewer).filter((x):x is string=>!!x))).sort();const qas=Array.from(new Set(rows.map(r=>r.qa).filter((x):x is string=>!!x))).sort();
 const cls="ev-order-input";
 const linkedCount=rows.filter(r=>r.taskId!==null).length;
 const needsTaskCount=rows.length-linkedCount;
 const money=(value:string|null)=>value===null?"Not priced":Number(value).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
 const statusTone=(value:string)=>{
  const v=value.toLowerCase().replace(/[_-]/g," ");
  if(/cancel|reject|fail|disput/.test(v)) return "risk";
  if(/complete|deliver|approv|paid|client/.test(v)) return "done";
  if(/revis|overdue|hold|pending/.test(v)) return "attention";
  if(/review|qa/.test(v)) return "review";
  return "active";
 };
 return <main className="ev-compact-workspace ev-order-register mx-auto max-w-7xl px-4 py-6 sm:px-7">
  <header className="ev-order-intro">
   <div className="ev-order-heading"><div><p className="ev-order-eyebrow">Operations / Order management</p><h1>Order Register</h1><p className="ev-order-subtitle">Search client orders, review assignments, and open the existing order records.</p></div><span className="ev-order-live">Client &amp; task overview</span></div>
   <div className="ev-order-metrics" aria-label="Order overview">
    <div className="ev-order-metric ev-order-metric-blue"><span>Recent orders</span><strong>{rows.length.toLocaleString()}</strong><small>Up to 1,000 most recent records</small></div>
    <div className="ev-order-metric ev-order-metric-cyan"><span>Matching filters</span><strong>{filtered.length.toLocaleString()}</strong><small>Results for your current search</small></div>
    <div className="ev-order-metric ev-order-metric-amethyst"><span>Linked to tasks</span><strong>{linkedCount.toLocaleString()}</strong><small>Orders with assigned task records</small></div>
    <div className="ev-order-metric ev-order-metric-emerald"><span>Awaiting task link</span><strong>{needsTaskCount.toLocaleString()}</strong><small>Orders not yet linked to a task</small></div>
   </div>
  </header>
  <details className="ev-order-filter-panel" open={!!(q||category||status||tasker||reviewer||qa||p.min||p.max||sort!=="newest")}>
   <summary><span>Search &amp; refine orders</span><span className="ev-order-filter-hint">Order code, people, status, cost, and more</span></summary>
   <form method="GET" className="ev-order-filter-grid">
    <label className="ev-order-field ev-order-field-wide"><span>Find an order</span><input name="q" defaultValue={q} placeholder="Order code, task ID, title, client, staff" className={cls}/></label>
    <label className="ev-order-field"><span>Category</span><select name="category" defaultValue={category} className={cls}><option value="">All categories</option>{categories.map(c=><option key={c}>{c}</option>)}</select></label>
    <label className="ev-order-field"><span>Status</span><select name="status" defaultValue={status} className={cls}><option value="">All statuses</option>{statuses.map(s=><option key={s}>{s}</option>)}</select></label>
    <label className="ev-order-field"><span>Tasker</span><select name="tasker" defaultValue={tasker} className={cls}><option value="">All taskers</option>{taskers.map(n=><option key={n}>{n}</option>)}</select></label>
    <label className="ev-order-field"><span>Reviewer</span><select name="reviewer" defaultValue={reviewer} className={cls}><option value="">All reviewers</option>{reviewers.map(n=><option key={n}>{n}</option>)}</select></label>
    <label className="ev-order-field"><span>QA</span><select name="qa" defaultValue={qa} className={cls}><option value="">All QA staff</option>{qas.map(n=><option key={n}>{n}</option>)}</select></label>
    <label className="ev-order-field"><span>Minimum price</span><input name="min" type="number" step="0.01" min="0" defaultValue={p.min} placeholder="0.00" className={cls}/></label>
    <label className="ev-order-field"><span>Maximum price</span><input name="max" type="number" step="0.01" min="0" defaultValue={p.max} placeholder="No maximum" className={cls}/></label>
    <label className="ev-order-field"><span>Sort by</span><select name="sort" defaultValue={sort} className={cls}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="cost-high">Highest price</option><option value="cost-low">Lowest price</option><option value="title">Title A–Z</option></select></label>
    <div className="ev-order-filter-actions"><button type="submit" className="ev-order-submit">Apply filters</button><Link className="ev-order-clear" href="/portal/order-register">Reset</Link></div>
   </form>
  </details>
  <section className="ev-order-list" aria-label="Order results">
   <div className="ev-order-list-header"><div><h2>Order records</h2><p>{filtered.length.toLocaleString()} matching {filtered.length===1?"order":"orders"}{rows.length===1000?" · limited to the 1,000 newest records":""}</p></div><span className="ev-order-scroll-note">Scroll horizontally for all details</span></div>
   <div className="ev-order-table-scroll" role="region" aria-label="Order register table" tabIndex={0}>
    <table className="ev-order-table"><thead><tr><th scope="col">Client order</th><th scope="col">Worker task ID</th><th scope="col">Order / category</th><th scope="col">Status</th><th scope="col">Tasker</th><th scope="col">Reviewer</th><th scope="col">QA</th><th scope="col">Price</th><th scope="col">Record</th></tr></thead>
    <tbody>{filtered.map(r=>{const currentStatus=r.taskStatus??r.requestStatus;return <tr key={r.requestId}>
     <td><span className="ev-order-code">{r.clientOrderCode??"Legacy order"}</span></td><td><span className="ev-order-task">{r.maskedId??"Not tasked"}</span></td><td><strong className="ev-order-title">{r.title}</strong><span className="ev-order-category">{r.service}</span></td>
     <td><span className={`ev-order-status ev-order-status-${statusTone(currentStatus)}`}>{currentStatus.replace(/_/g," ")}</span></td>
     <td>{r.tasker??<span className="ev-order-missing">Unassigned</span>}</td><td>{r.reviewer??<span className="ev-order-missing">Unassigned</span>}</td><td>{r.qa??<span className="ev-order-missing">Unassigned</span>}</td>
     <td className="ev-order-price">{money(r.price)}</td><td><Link className="ev-order-details" href={`/portal/client-messages/${r.requestId}`}>View details <span aria-hidden="true">↗</span></Link></td>
    </tr>})}</tbody></table>
    {filtered.length===0&&<div className="ev-order-empty"><strong>No matching orders</strong><p>Try broader search terms or clear your filters.</p><Link href="/portal/order-register">Clear all filters</Link></div>}
   </div>
  </section>
 </main>;
}
