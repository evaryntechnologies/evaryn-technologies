import { Suspense } from "react";
import { connection } from "next/server";
import { Star } from "lucide-react";
import { Cell, Empty, ListTable, Notice, PageFrame, PageTitle, PayBar, Pill, Row, SectionHead, Stars, Strip } from "@/app/(portal)/layouts";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";

async function RatingsContent() {
  await connection();
  const user = await requireEmployee();
  const profile = await prisma.employeeProfile.findUnique({where:{authUserId:user.id}, select:{id:true,fullName:true,role:true}});
  if (!profile) return <PageFrame><Notice tone="amber">Your employee profile could not be found.</Notice></PageFrame>;

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
  const lowest = rated.length ? Math.min(...rated.map((o) => o.clientRating ?? 5)) : null;
  const fullyPaid = orders.filter((o) => o.clientPaidPercent !== null && Number(o.clientPaidPercent) >= 100).length;
  return (
    <PageFrame>
      <PageTitle
        eyebrow="Quality and feedback"
        title="Ratings and rubrics"
        description="Client feedback and payment status for the orders you took part in."
      />

      <Strip items={[
        { label: "Average client rating", value: avg === null ? "Not rated" : `${avg.toFixed(2)} / 5`, tone: "amber" },
        { label: "Rated orders", value: rated.length, tone: "cyan" },
        { label: "Lowest rating", value: lowest === null ? "—" : lowest.toFixed(1), tone: "rose" },
        { label: "Fully paid by client", value: fullyPaid, tone: "green" },
      ]} />

      <section aria-labelledby="rated-orders-heading">
        <SectionHead title="Order feedback" hint={`${orders.length} order${orders.length === 1 ? "" : "s"} you took part in`} />
        {orders.length === 0 ? (
          <Empty icon={Star} title="No ratings yet" text="Orders you take part in will appear here once they are recorded." />
        ) : (
          <ListTable label="Order feedback" cols="minmax(0,2.2fr) minmax(0,1.2fr) minmax(0,1.2fr)" headers={[{ text: "Order" }, { text: "Client rating" }, { text: "Client payment" }]}>
            {orders.map((o) => (
              <Row key={o.id}>
                <Cell><p className="evx-cell-title">{o.title}</p><p className="evx-id">{o.publicTaskId ?? "Order"}</p></Cell>
                <Cell label="Client rating"><Stars rating={o.clientRating} /></Cell>
                <Cell label="Client payment"><PayBar percent={o.clientPaidPercent === null ? null : Number(o.clientPaidPercent)} /></Cell>
              </Row>
            ))}
          </ListTable>
        )}
      </section>

      {user.role === "SUPER_ADMIN" && (
        <section aria-labelledby="employee-ratings-heading">
          <SectionHead title="Employees’ ratings" hint="Unique rated orders per employee, including taskers, reviewers, QA and admin participants." />
          {employees.length === 0 ? (
            <Empty icon={Star} title="No active employees found" />
          ) : (
            <ListTable label="Employee ratings" cols="minmax(0,2fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1.2fr)" headers={[{ text: "Employee" }, { text: "Role" }, { text: "Rated orders", end: true }, { text: "Average", end: true }]}>
              {employees.map((e) => {
                const summary = aggregates.get(e.id);
                const average = summary ? summary.total / summary.count : null;
                return (
                  <Row key={e.id}>
                    <Cell><p className="evx-cell-title">{e.fullName}</p></Cell>
                    <Cell label="Role"><Pill tone="violet" plain>{e.role.replaceAll("_", " ")}</Pill></Cell>
                    <Cell label="Rated orders" end><span className="evx-num" style={{ fontWeight: 700 }}>{summary?.count ?? 0}</span></Cell>
                    <Cell label="Average" end>{average === null ? <span className="evx-meta">Not rated</span> : <Stars rating={average} />}</Cell>
                  </Row>
                );
              })}
            </ListTable>
          )}
        </section>
      )}

      <p className="evx-footnote">The payment indicator shows the percentage paid by the client, not task progress. Green: 80–100%. Amber: above 50% to below 80%. Red: 50% or below.</p>
    </PageFrame>
  );
}

export default function RatingsPage() {
  return (
    <Suspense fallback={<div className="evx-page" aria-busy="true"><div className="evx-card evx-card-pad evx-muted">Loading ratings…</div></div>}>
      <RatingsContent />
    </Suspense>
  );
}
