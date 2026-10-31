import { Suspense } from "react";
import { connection } from "next/server";
import { Star } from "lucide-react";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";

const panel = "rounded-2xl border border-cyan-500/25 bg-cyan-100/65 text-[#103956] dark:border-cyan-300/15 dark:bg-[#102B4F] dark:text-[#EBF8FF]";

function Stars({ rating }: { rating: number | null }) {
  if (rating === null) return <span className="text-xs opacity-70">Not rated</span>;
  const value = Math.max(0, Math.min(5, rating));
  return <div className="flex flex-wrap items-center gap-2" aria-label={`${value.toFixed(1)} out of five stars`}>
    <span className="flex items-center gap-0.5" aria-hidden="true">{[1,2,3,4,5].map(n => <Star key={n} size={17} className={n <= Math.round(value) ? "text-amber-500" : "text-slate-400/65"} fill={n <= Math.round(value) ? "#FBBF24" : "#94A3B8"} strokeWidth={1.2}/>)}</span>
    <span className="text-xs font-semibold">{value.toFixed(1)}/5</span>
  </div>;
}
function PaymentBar({ percent }: {percent: number | null}) {
  if (percent === null || !Number.isFinite(percent)) return <span className="text-xs opacity-70">Payment not recorded</span>;
  const value = Math.max(0, Math.min(100, percent));
  const color = value >= 80 ? "bg-emerald-500" : value > 50 ? "bg-amber-400" : "bg-rose-500";
  return <div className="w-full space-y-1.5"><span className="text-xs font-semibold">{value.toFixed(0)}% paid</span><div role="progressbar" aria-label="Client payment percentage" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value} className="h-2.5 overflow-hidden rounded-full bg-cyan-800/15 dark:bg-cyan-100/15"><div className={`h-full rounded-full ${color}`} style={{width: `${value}%`}}/></div></div>;
}

async function RatingsContent() {
  await connection();
  const user = await requireEmployee();
  const profile = await prisma.employeeProfile.findUnique({where:{authUserId:user.id}, select:{id:true,fullName:true,role:true}});
  if (!profile) return <p className={panel + " p-5"}>Your employee profile could not be found.</p>;

  // Query unique orders, not review events. An employee participates as a tasker,
  // reviewer, or QA across any submission/review history for the order.
  const participantWhere = { OR: [
    { submissions: { some: { employeeId: profile.id } } },
    { submissions: { some: { reviews: { some: { reviewerId: profile.id } } } } },
  ] };
  const orders = await prisma.workTask.findMany({
    where: participantWhere,
    select: {id:true,title:true,publicTaskId:true,clientRating:true,clientPaidPercent:true,clientActionAt:true},
    orderBy:{updatedAt:"desc"},
  });
  const rated = orders.filter(o => o.clientRating !== null);
  const avg = rated.length ? rated.reduce((total,o) => total + (o.clientRating ?? 0),0)/rated.length : null;

  const employees = user.role === "SUPER_ADMIN" ? await prisma.employeeProfile.findMany({
    where: {status:"ACTIVE", role:{in:["TASKER","REVIEWER","QA","ADMIN"]}},
    select: {id:true,fullName:true,role:true}, orderBy:{fullName:"asc"}
  }) : [];
  // Each rated order contributes once to every actual participant, regardless of
  // how many times it was submitted, reviewed, or revised.
  const ratedOrders = user.role === "SUPER_ADMIN" ? await prisma.workTask.findMany({
    where: {clientRating:{not:null}},
    select:{id:true,clientRating:true,submissions:{select:{employeeId:true,reviews:{select:{reviewerId:true}}}}},
  }) : [];
  const aggregates = new Map<string,{count:number,total:number}>();
  for (const order of ratedOrders) {
    const participants = new Set<string>();
    for (const submission of order.submissions) {
      participants.add(submission.employeeId);
      for (const review of submission.reviews) participants.add(review.reviewerId);
    }
    for (const id of participants) {
      const previous=aggregates.get(id) ?? {count:0,total:0};
      aggregates.set(id,{count:previous.count+1,total:previous.total+(order.clientRating ?? 0)});
    }
  }
  return <section className="min-w-0 space-y-5">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="text-xs font-bold uppercase tracking-widest text-cyan-700 dark:text-cyan-300">Quality &amp; Feedback</p><h1 className="mt-1 text-2xl font-semibold">My Ratings &amp; Rubrics</h1><p className="mt-1 text-sm opacity-75">Client ratings for the orders you worked on.</p></div>
      <div className={panel + " min-w-40 px-5 py-3"}><p className="text-xs font-semibold uppercase tracking-wide opacity-75">Average Rating</p><p className="mt-1 text-2xl font-bold">{avg === null ? "Not rated" : `${avg.toFixed(2)} / 5`}</p><p className="text-xs opacity-75">{rated.length} rated {rated.length === 1 ? "order" : "orders"}</p></div>
    </header>
    <div className={panel + " overflow-hidden"}>
      <div className="hidden gap-4 border-b border-cyan-500/20 bg-cyan-200/65 px-4 py-3 text-xs font-bold uppercase tracking-wide dark:bg-[#163B66] md:grid md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)]"><span>Order Details</span><span>Order Rating</span><span>% of Completion</span></div>
      {orders.map(o => <article key={o.id} className="grid min-w-0 gap-4 border-b border-cyan-500/20 px-4 py-3 last:border-b-0 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)] md:items-center">
        <div className="min-w-0"><p className="break-words text-sm font-semibold">{o.title}</p><p className="text-xs opacity-70">{o.publicTaskId ?? "Order"}</p></div>
        <div><p className="mb-1 text-[11px] font-semibold uppercase opacity-60 md:hidden">Order Rating</p><Stars rating={o.clientRating}/></div>
        <div><p className="mb-1 text-[11px] font-semibold uppercase opacity-60 md:hidden">% of Completion</p><PaymentBar percent={o.clientPaidPercent === null ? null : Number(o.clientPaidPercent)}/></div>
      </article>)}
      {orders.length === 0 && <p className="p-6 text-sm opacity-75">No orders in which you participated have been recorded yet.</p>}
    </div>
    {user.role === "SUPER_ADMIN" && <section className="space-y-3"><div><h2 className="text-xl font-semibold">Employees’ Ratings &amp; Rubrics</h2><p className="text-sm opacity-70">Unique rated orders per employee, including Taskers, Reviewers, QA and Admin participants.</p></div>
      <div className={panel + " overflow-hidden"}><div className="grid grid-cols-[minmax(0,1fr)_70px_100px] gap-3 border-b border-cyan-500/20 bg-cyan-200/65 px-4 py-3 text-xs font-bold dark:bg-[#163B66] sm:grid-cols-[minmax(0,1fr)_140px_160px]"><span>Employee</span><span>Rated Orders</span><span>Average Rating</span></div>
      {employees.map(e=>{const s=aggregates.get(e.id);return <div key={e.id} className="grid grid-cols-[minmax(0,1fr)_70px_100px] items-center gap-3 border-b border-cyan-500/20 px-4 py-3 text-sm last:border-0 sm:grid-cols-[minmax(0,1fr)_140px_160px]"><div className="min-w-0"><p className="break-words font-semibold">{e.fullName}</p><p className="text-xs opacity-65">{e.role.replaceAll("_"," ")}</p></div><span>{s?.count ?? 0}</span><span className="font-semibold">{s ? `${(s.total/s.count).toFixed(2)} / 5` : "Not rated"}</span></div>})}
      {employees.length === 0 && <p className="p-5 text-sm opacity-70">No active employees found.</p>}</div>
    </section>}
    <p className="text-xs opacity-65">Payment bar shows client payment, not task progress. Green: 80–100%. Yellow: above 50% to below 80%. Red: 50% or below.</p>
  </section>;
}
export default function RatingsPage(){return <Suspense fallback={<section className="space-y-3" aria-busy="true"><h1 className="text-2xl font-semibold">My Ratings &amp; Rubrics</h1><p className="text-sm opacity-70">Loading ratings...</p></section>}><RatingsContent/></Suspense>}
