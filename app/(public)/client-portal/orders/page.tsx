import Link from "next/link";
import { ArrowUpRight, Boxes, MessageSquareText, Plus, ClipboardList, ArrowRight } from "lucide-react";
import { listRequestTaskLinks } from "@/lib/client-communication";
import { prisma } from "@/lib/db/prisma";
import { listClientOrders, formatDate, type Stage } from "@/lib/client-orders";
import { ensureClientProfile } from "../../clients/actions";
import { OrderTracker, StagePill } from "../parts";
import "./orders.css";

const FILTERS: { key: string; label: string; match: (s: Stage) => boolean }[] = [
  { key: "all", label: "All", match: () => true },
  { key: "tasking", label: "In production", match: s => s === "TASKING" },
  { key: "review", label: "In review", match: s => s === "REVIEW" },
  { key: "qa", label: "Quality assurance", match: s => s === "QA" || s === "READY" },
  { key: "done", label: "Delivered", match: s => s === "DELIVERED" || s === "COMPLETED" },
];

export default async function ClientOrders({ searchParams }: { searchParams: Promise<{ stage?: string }> }) {
  const client = await ensureClientProfile();
  const { stage } = await searchParams;
  const [orders, linked, requests] = await Promise.all([
    listClientOrders(client.id).catch((error) => { console.error("Client orders could not be loaded", error); return []; }),
    listRequestTaskLinks(client.id),
    prisma.clientProjectRequest.findMany({
      where: { clientId: client.id },
      select: { id: true, title: true, service: true, status: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);
  const requestByTask = new Map(linked.map(l => [l.taskId, l.requestId]));
  const active = FILTERS.find(f => f.key === stage) ?? FILTERS[0];
  const shown = orders.filter(o => active.match(o.stage));

  return (
    <main className="cp-page ev-orders">
      <header className="ev-orders-hero">
        <div>
          <span className="ev-orders-eyebrow">CLIENT WORKSPACE / ORDERS</span>
          <h1>My orders</h1>
          <p>Follow production, review milestones, and contact Evaryn about your project at any stage.</p>
        </div>
        <Link href="/client-portal/requests/new" className="ev-orders-primary"><Plus size={17} /> New project request</Link>
      </header>

      <section className="ev-orders-summary" aria-label="Order summary">
        <div><span>Total active production orders</span><strong>{orders.filter(o => o.stage !== "CANCELED" && o.stage !== "COMPLETED" && o.stage !== "DELIVERED").length}</strong></div>
        <div><span>Submitted service requests</span><strong>{requests.length}</strong></div>
        <div><span>Delivered or completed</span><strong>{orders.filter(o => o.stage === "DELIVERED" || o.stage === "COMPLETED").length}</strong></div>
      </section>

      <section className="ev-orders-section" aria-labelledby="production-title">
        <div className="ev-orders-section-head">
          <div><h2 id="production-title">Production orders</h2><p>Orders already assigned to an Evaryn production task.</p></div>
          <span className="ev-orders-section-count">{orders.length} total</span>
        </div>
        <nav className="ev-orders-filters" aria-label="Filter production orders">
          {FILTERS.map(f => (
            <Link key={f.key} href={f.key === "all" ? "/client-portal/orders" : `/client-portal/orders?stage=${f.key}`} aria-current={f.key === active.key ? "page" : undefined}>
              {f.label}<span>{orders.filter(o => f.match(o.stage)).length}</span>
            </Link>
          ))}
        </nav>
        {shown.length === 0 ? (
          <div className="ev-orders-empty">
            <Boxes size={27} aria-hidden="true" />
            <div><strong>No production orders in this view</strong><p>Orders will appear here once your service request is connected to an internal task. You can still view and message Evaryn about your requests below.</p></div>
            <a href="#service-requests" className="ev-orders-secondary">See my requests <ArrowRight size={15}/></a>
          </div>
        ) : (
          <div className="ev-orders-cards">
            {shown.map(o => {
              const requestId = requestByTask.get(o.taskId);
              return (
                <article key={o.taskId} className="ev-orders-card">
                  <div className="ev-orders-card-top">
                    <div><span className="ev-orders-code">{o.clientOrderCode ?? "Existing order"}{o.category ? ` / ${o.category}` : ""}</span><h3>{o.title}</h3></div>
                    <StagePill stage={o.stage} revision={o.inRevision} />
                  </div>
                  <div className="ev-orders-tracker"><OrderTracker stage={o.stage}/></div>
                  <dl className="ev-orders-meta">
                    <div><dt>Ordered</dt><dd>{formatDate(o.createdAt)}</dd></div>
                    <div><dt>Last update</dt><dd>{formatDate(o.updatedAt)}</dd></div>
                    {o.stage !== "DELIVERED" && o.stage !== "COMPLETED" && o.stage !== "CANCELED" && <div><dt>Target date</dt><dd>{formatDate(o.targetDate)}</dd></div>}
                    {o.deliveredAt && <div><dt>Delivered</dt><dd>{formatDate(o.deliveredAt)}</dd></div>}
                  </dl>
                  <div className="ev-orders-actions">
                    {requestId ? (
                      <Link className="ev-orders-message" href={`/client-portal/requests/${requestId}`}><MessageSquareText size={17} /> View details &amp; message <ArrowUpRight size={15}/></Link>
                    ) : (
                      <span className="ev-orders-unlinked">Messaging available from your linked service request below</span>
                    )}
                    {(o.stage === "DELIVERED" || o.stage === "COMPLETED") && <Link className="ev-orders-secondary" href="/client-portal/delivered">View delivery <ArrowUpRight size={15}/></Link>}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="ev-orders-section" id="service-requests" aria-labelledby="requests-title">
        <div className="ev-orders-section-head">
          <div><h2 id="requests-title">My service requests &amp; messages</h2><p>Every submitted request remains accessible, even before production begins. Open any request to message the Evaryn team or request contract termination.</p></div>
          <span className="ev-orders-section-count">{requests.length} requests</span>
        </div>
        {requests.length === 0 ? (
          <div className="ev-orders-empty"><ClipboardList size={26}/><div><strong>No service requests yet</strong><p>Submit your first project to begin the conversation.</p></div><Link className="ev-orders-secondary" href="/client-portal/requests/new">Create request <ArrowRight size={15}/></Link></div>
        ) : (
          <div className="ev-orders-requests">
            {requests.map(request => (
              <article className="ev-orders-request" key={request.id}>
                <div className="ev-orders-request-copy"><span className="ev-orders-code">{request.service} · {formatDate(request.createdAt)}</span><h3>{request.title}</h3><p>{request.status.replaceAll("_", " ").toLowerCase()}</p></div>
                <Link className="ev-orders-message" href={`/client-portal/requests/${request.id}`}><MessageSquareText size={17}/> View &amp; message <ArrowUpRight size={15}/></Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
