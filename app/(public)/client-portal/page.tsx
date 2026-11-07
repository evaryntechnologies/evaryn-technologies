import Link from "next/link";
import { ArrowUpRight, Boxes, ClipboardCheck, PackageCheck, Plus, MessageCircle } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { listClientOrders, formatDate } from "@/lib/client-orders";
import { ensureClientProfile } from "../clients/actions";
import { OrderTracker, StagePill } from "./parts";

export default async function ClientHome() {
  const client = await ensureClientProfile();
  const [orders, requests] = await Promise.all([
    listClientOrders(client.id).catch(() => []),
    prisma.clientProjectRequest.findMany({ where: { clientId: client.id }, orderBy: { createdAt: "desc" }, take: 6 }),
  ]);
  const inStage = (...st: string[]) => orders.filter((o) => st.includes(o.stage)).length;
  const active = inStage("TASKING", "REVIEW", "QA", "READY");
  const toRate = orders.filter((o) => o.stage === "DELIVERED" && !o.ratedAt);
  const delivered = orders.filter((o) => o.stage === "DELIVERED" || o.stage === "COMPLETED").length;
  const recent = orders.filter((o) => o.stage !== "CANCELED").slice(0, 5);
  const inReview = inStage("REVIEW", "QA");
  const recentRequests = requests.slice(0, 3);

  return (
    <main className="cp-page">
      <div className="cp-head">
        <div>
          <h1 className="cp-title">Your workspace</h1>
          <p className="cp-sub">A clear view of what needs your attention, ongoing work, and recent updates.</p>
        </div>
        <Link href="/client-portal/requests/new" className="ev2-primary"><Plus size={17} /> New request</Link>
      </div>

      <section className="cp-stats cp-stats--compact" aria-label="Workspace summary">
        <Link href="/client-portal/orders" className="cp-stat cp-stat--link"><span className="cp-stat-icon"><Boxes size={20} /></span><div><b>{active}</b><span>Active orders</span></div></Link>
        <Link href="/client-portal/delivered/awaiting" className="cp-stat cp-stat--link"><span className="cp-stat-icon"><ClipboardCheck size={20} /></span><div><b>{toRate.length}</b><span>Need your decision</span></div></Link>
        <Link href="/client-portal/delivered" className="cp-stat cp-stat--link"><span className="cp-stat-icon"><PackageCheck size={20} /></span><div><b>{delivered}</b><span>Delivered</span></div></Link>
      </section>

      <section className="cp-focus" aria-label="Next steps">
        <div className="cp-focus-main">
          <span className="cp-eyebrow">Your next step</span>
          <h2>{toRate.length ? `${toRate.length} delivery ${toRate.length === 1 ? "needs" : "need"} your review` : inReview ? `${inReview} order${inReview === 1 ? " is" : "s are"} being reviewed` : active ? "Your work is progressing" : "Ready to get started?"}</h2>
          <p>{toRate.length ? "Confirm the delivery, request changes, or leave your rating." : active ? "Follow live progress without needing to check each stage separately." : "Send a new request and follow its progress here."}</p>
          <Link href={toRate.length ? "/client-portal/delivered/awaiting" : active ? "/client-portal/orders" : "/client-portal/requests/new"} className="ev2-primary">
            {toRate.length ? "Review deliveries" : active ? "Track my orders" : "Create a request"} <ArrowUpRight size={16} />
          </Link>
        </div>
        <div className="cp-focus-side">
          <MessageCircle size={19}/>
          <strong>Conversations & updates</strong>
          <span>Questions, discussions, and project activity stay with each request.</span>
          <Link href="/client-portal/notifications" className="ev2-textlink">View notifications <ArrowUpRight size={15}/></Link>
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
                  <div><p className="cp-order-id">{o.clientOrderCode ?? "Legacy order"}{o.category ? ` · ${o.category}` : ""}</p><h3>{o.title}</h3></div>
                  <StagePill stage={o.stage} revision={o.inRevision} />
                </div>
                <OrderTracker stage={o.stage} />
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="cp-panel" aria-labelledby="requests">
        <div className="cp-panel-head"><h2 id="requests" className="cp-h2">Recent requests</h2><Link className="ev2-textlink" href="/client-portal/requests/new">New request <ArrowUpRight size={15} /></Link></div>
        {requests.length === 0 ? <p className="cp-empty">You have not submitted a service request yet.</p> : (
          <div className="cp-rows">
            {recentRequests.map((r) => (
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
