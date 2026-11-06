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
  return (
    <main className="mx-auto w-full max-w-7xl min-w-0 space-y-8 px-2 pb-12 pt-3 font-sans sm:px-5 lg:px-8">
      <header className="flex flex-col gap-5 rounded-[28px] border border-[#92CDE4]/60 bg-[#E4F5FD]/85 px-6 py-7 shadow-sm dark:border-[#41658E] dark:bg-[#113455]/90 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-9">
        <div className="min-w-0 space-y-2">
          <p className="text-xs font-bold uppercase tracking-[.17em] text-[#35699B] dark:text-[#8FE4F4]">Quality &amp; feedback</p>
          <h1 className="text-2xl font-bold leading-tight tracking-tight text-[#122E54] dark:text-[#F3FBFF] sm:text-3xl">My Ratings &amp; Rubrics</h1>
          <p className="max-w-2xl text-sm leading-7 text-[#375C7B] dark:text-[#C7DEEF]">A clear view of client feedback for the orders you participated in.</p>
        </div>
        <div className="w-full shrink-0 rounded-2xl border border-[#B2D9E9] bg-[#F4FBFF] px-6 py-5 shadow-sm dark:border-[#4F6991] dark:bg-[#1C4268] sm:w-auto sm:min-w-[230px]">
          <p className="text-xs font-bold uppercase tracking-widest text-[#416381] dark:text-[#C4DDEC]">Average client rating</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-[#1A3C67] dark:text-[#F3FBFF]">{avg === null ? "Not rated" : `${avg.toFixed(2)} / 5`}</p>
          <p className="mt-2 text-sm text-[#456783] dark:text-[#C8DDEC]">{rated.length} rated {rated.length === 1 ? "order" : "orders"}</p>
        </div>
      </header>

      <section aria-labelledby="rated-orders-heading" className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3 px-1">
          <div>
            <h2 id="rated-orders-heading" className="text-xl font-bold text-[#173555] dark:text-[#F0F9FF]">Order feedback</h2>
            <p className="mt-1 text-sm leading-6 text-[#456783] dark:text-[#C4DDEA]">Your orders, client ratings, and recorded payment percentages.</p>
          </div>
          <span className="rounded-full border border-[#B7DDEC] bg-[#E8F7FC] px-4 py-1.5 text-xs font-semibold text-[#285D7F] dark:border-[#426A90] dark:bg-[#214567] dark:text-[#D5F4FC]">{orders.length} total {orders.length === 1 ? "order" : "orders"}</span>
        </div>
        <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
          {orders.map(o => (
            <article key={o.id} className="min-w-0 rounded-[22px] border border-[#B4D9EB] bg-[#EBF8FE]/95 p-5 shadow-[0_8px_28px_rgba(18,55,91,.06)] dark:border-[#3C638B] dark:bg-[#14375A]/95 sm:p-7">
              <div className="mb-6 flex min-w-0 items-start gap-4">
                <span className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#BEDDED] bg-[#D5EFFA] text-[#356DA0] dark:border-[#54749C] dark:bg-[#23496B] dark:text-[#8FE4F4]" aria-hidden="true"><Star size={21} strokeWidth={1.7}/></span>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="break-words text-base font-bold leading-7 text-[#163858] dark:text-[#F2FAFF] sm:text-lg">{o.title}</p>
                  <p className="break-all text-xs font-medium tracking-wide text-[#547692] dark:text-[#C0D9E9]">{o.publicTaskId ?? "Order"}</p>
                </div>
              </div>
              <div className="grid min-w-0 gap-3 sm:grid-cols-2">
                <div className="min-w-0 rounded-2xl border border-[#C4E1EE] bg-[#F5FCFF] px-5 py-5 dark:border-[#46678B] dark:bg-[#204365]">
                  <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[#4B6C87] dark:text-[#CEE4F1]">Client rating</p>
                  <Stars rating={o.clientRating}/>
                </div>
                <div className="min-w-0 rounded-2xl border border-[#C4E1EE] bg-[#F5FCFF] px-5 py-5 dark:border-[#46678B] dark:bg-[#204365]">
                  <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[#4B6C87] dark:text-[#CEE4F1]">Client payment</p>
                  <PaymentBar percent={o.clientPaidPercent === null ? null : Number(o.clientPaidPercent)}/>
                </div>
              </div>
            </article>
          ))}
          {orders.length === 0 && <div className="rounded-[22px] border border-dashed border-[#9ECFE5] bg-[#E6F6FD] px-7 py-12 text-center text-sm leading-7 text-[#345C7A] dark:border-[#52749B] dark:bg-[#173A5D] dark:text-[#D2E5F2] xl:col-span-2">No orders in which you participated have been recorded yet.</div>}
        </div>
      </section>

      {user.role === "SUPER_ADMIN" && (
        <section aria-labelledby="employee-ratings-heading" className="space-y-4">
          <div className="px-1">
            <h2 id="employee-ratings-heading" className="text-xl font-bold text-[#173555] dark:text-[#F1FAFF]">Employees’ ratings</h2>
            <p className="mt-1 max-w-3xl text-sm leading-7 text-[#456783] dark:text-[#C4DDEA]">Unique rated orders for each employee, including Taskers, Reviewers, QA and Admin participants.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
            {employees.map(e => {
              const summary = aggregates.get(e.id);
              return <article key={e.id} className="min-w-0 rounded-[22px] border border-[#B4D9EB] bg-[#EBF8FE]/95 p-6 shadow-[0_8px_28px_rgba(18,55,91,.05)] dark:border-[#3C638B] dark:bg-[#14375A]/95 sm:p-7">
                <div className="min-w-0 space-y-1 border-b border-[#B7D9E8] pb-5 dark:border-[#46688A]">
                  <h3 className="break-words text-base font-bold leading-7 text-[#163858] dark:text-[#F2FAFF]">{e.fullName}</h3>
                  <span className="inline-block rounded-full bg-[#E1EAFB] px-3 py-1 text-xs font-semibold text-[#65529B] dark:bg-[#352C64] dark:text-[#D8C6FA]">{e.role.replaceAll("_", " ")}</span>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-4">
                  <div className="min-w-0"><p className="text-xs leading-5 text-[#52748C] dark:text-[#C3DDED]">Rated orders</p><p className="mt-2 text-xl font-bold tabular-nums text-[#173B62] dark:text-[#F3FAFF]">{summary?.count ?? 0}</p></div>
                  <div className="min-w-0"><p className="text-xs leading-5 text-[#52748C] dark:text-[#C3DDED]">Average rating</p><p className="mt-2 text-lg font-bold tabular-nums text-[#173B62] dark:text-[#F3FAFF]">{summary ? `${(summary.total / summary.count).toFixed(2)} / 5` : "Not rated"}</p></div>
                </div>
              </article>;
            })}
            {employees.length === 0 && <div className="rounded-2xl border border-dashed border-[#9ECFE5] bg-[#E6F6FD] p-8 text-sm dark:border-[#52749B] dark:bg-[#173A5D]">No active employees found.</div>}
          </div>
        </section>
      )}

      <p className="rounded-xl border border-[#BEDCE9] bg-[#E8F5FB]/85 px-5 py-4 text-xs leading-6 text-[#496A83] dark:border-[#406487] dark:bg-[#1A3B5B] dark:text-[#C7DDEB]">The payment indicator shows the percentage paid by the client, not task progress. Green: 80–100%; yellow: above 50% to below 80%; red: 50% or below.</p>
    </main>
  );
}
export default function RatingsPage(){return <Suspense fallback={<section className="space-y-3" aria-busy="true"><h1 className="text-2xl font-semibold">My Ratings &amp; Rubrics</h1><p className="text-sm opacity-70">Loading ratings...</p></section>}><RatingsContent/></Suspense>}
