import Link from "next/link";
import { ArrowUpRight, Boxes, ClipboardCheck, PackageCheck, Plus, Timer } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { listClientOrders, STAGES, formatDate } from "@/lib/client-orders";
import { ensureClientProfile } from "../clients/actions";
import { OrderTracker, StagePill } from "./parts";

export default async function ClientHome() {
  const client = await ensureClientProfile();
  const [orders, requests] = await Promise.all([
    listClientOrders(client.id).catch(() => []),
    prisma.clientProjectRequest.findMany({ where: { clientId: client.id }, orderBy: { createdAt: "desc" }, take: 6 }),
  ]);
  const inStage = (...st: string[]) => orders.filter((o) => st.includes(o.stage)).length;
  const active = { length: inStage("TASKING", "REVIEW", "QA", "READY") };
  const counts = [
    { ...STAGES[0], n: inStage("TASKING") },
    { ...STAGES[1], n: inStage("REVIEW") },
    { ...STAGES[2], n: inStage("QA", "READY") },
  ];
  const toRate = orders.filter((o) => o.stage === "DELIVERED" && !o.ratedAt);
  const delivered = orders.filter((o) => o.stage === "DELIVERED" || o.stage === "COMPLETED").length;
  const recent = orders.filter((o) => o.stage !== "CANCELED").slice(0, 4);

  return (
    <main className="cp-page">
      <div className="cp-head">
        <div>
          <h1 className="cp-title">Your orders at a glance</h1>
          <p className="cp-sub">Follow every order through tasking, review and quality assurance, then rate it when it arrives.</p>
        </div>
        <Link href="/client-portal/requests/new" className="ev2-primary"><Plus size={17} /> New request</Link>
      </div>

      <section className="cp-stats" aria-label="Summary">
        <div className="cp-stat"><span className="cp-stat-icon"><Boxes size={20} /></span><div><b>{active.length}</b><span>In progress</span></div></div>
        <div className="cp-stat"><span className="cp-stat-icon"><Timer size={20} /></span><div><b>{orders.filter((o) => o.stage === "REVIEW" || o.stage === "QA").length}</b><span>In review or QA</span></div></div>
        <div className="cp-stat"><span className="cp-stat-icon"><PackageCheck size={20} /></span><div><b>{delivered}</b><span>Delivered</span></div></div>
        <div className="cp-stat"><span className="cp-stat-icon"><ClipboardCheck size={20} /></span><div><b>{toRate.length}</b><span>Waiting for your rating</span></div></div>
      </section>

      {toRate.length > 0 && (
        <Link href="/client-portal/delivered" className="cp-callout">
          <PackageCheck size={22} aria-hidden="true" />
          <span><strong>{toRate.length} order{toRate.length === 1 ? " is" : "s are"} ready for you.</strong> Review the delivery and leave a rating.</span>
          <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
      )}

      <section className="cp-panel" aria-labelledby="pipeline">
        <h2 id="pipeline" className="cp-h2">Order pipeline</h2>
        <div className="cp-pipeline">
          {counts.slice(0, 3).map((c, i) => (
            <div key={c.key} className="cp-pipe">
              <span className="cp-pipe-n">{c.n}</span>
              <span className="cp-pipe-l">{c.label}</span>
              <span className="cp-pipe-h">{c.hint}</span>
              {i < 2 && <span className="cp-pipe-arrow" aria-hidden="true">→</span>}
            </div>
          ))}
          <div className="cp-pipe cp-pipe--done"><span className="cp-pipe-n">{delivered}</span><span className="cp-pipe-l">Delivered</span><span className="cp-pipe-h">Ready for you to review</span></div>
        </div>
      </section>

      <section className="cp-panel" aria-labelledby="recent">
        <div className="cp-panel-head"><h2 id="recent" className="cp-h2">Recent orders</h2><Link className="ev2-textlink" href="/client-portal/orders">All orders <ArrowUpRight size={15} /></Link></div>
        {recent.length === 0 ? (
          <p className="cp-empty">No orders are linked to your account yet. When Evaryn starts work on a request, you will see its progress here.</p>
        ) : (
          <div className="cp-list">
            {recent.map((o) => (
              <article key={o.taskId} className="cp-order">
                <div className="cp-order-top">
                  <div><p className="cp-order-id">{o.publicTaskId ?? o.taskId.slice(0, 8)}{o.category ? ` · ${o.category}` : ""}</p><h3>{o.title}</h3></div>
                  <StagePill stage={o.stage} revision={o.inRevision} />
                </div>
                <OrderTracker stage={o.stage} />
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="cp-panel" aria-labelledby="requests">
        <div className="cp-panel-head"><h2 id="requests" className="cp-h2">My service requests</h2><Link className="ev2-textlink" href="/client-portal/requests/new">New request <ArrowUpRight size={15} /></Link></div>
        {requests.length === 0 ? <p className="cp-empty">You have not submitted a service request yet.</p> : (
          <div className="cp-rows">
            {requests.map((r) => (
              <Link key={r.id} href={`/client-portal/requests/${r.id}`} className="cp-row">
                <span><strong>{r.title}</strong><small>{r.service} · {formatDate(r.createdAt)}</small></span>
                <span className="cp-pill cp-pill--blue">{r.status.replaceAll("_", " ").toLowerCase()}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
