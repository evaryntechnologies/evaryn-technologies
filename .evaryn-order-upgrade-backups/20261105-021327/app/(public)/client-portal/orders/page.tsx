import Link from "next/link";
import { Boxes } from "lucide-react";
import { listClientOrders, formatDate, type Stage } from "@/lib/client-orders";
import { ensureClientProfile } from "../../clients/actions";
import { OrderTracker, StagePill } from "../parts";

const FILTERS: { key: string; label: string; match: (s: Stage) => boolean }[] = [
  { key: "all", label: "All", match: () => true },
  { key: "tasking", label: "Tasking", match: (s) => s === "TASKING" },
  { key: "review", label: "Review", match: (s) => s === "REVIEW" },
  { key: "qa", label: "Quality assurance", match: (s) => s === "QA" || s === "READY" },
  { key: "done", label: "Delivered & completed", match: (s) => s === "DELIVERED" || s === "COMPLETED" },
];

export default async function ClientOrders({ searchParams }: { searchParams: Promise<{ stage?: string }> }) {
  const client = await ensureClientProfile();
  const { stage } = await searchParams;
  const orders = await listClientOrders(client.id).catch(() => []);
  const active = FILTERS.find((f) => f.key === stage) ?? FILTERS[0];
  const shown = orders.filter((o) => active.match(o.stage));

  return (
    <main className="cp-page">
      <div className="cp-head"><div><h1 className="cp-title">My orders</h1><p className="cp-sub">Live progress for every order you have placed with Evaryn.</p></div></div>
      <nav className="cp-filter" aria-label="Filter orders">
        {FILTERS.map((f) => (
          <Link key={f.key} href={f.key === "all" ? "/client-portal/orders" : `/client-portal/orders?stage=${f.key}`} aria-current={f.key === active.key ? "true" : undefined}>
            {f.label}<span>{orders.filter((o) => f.match(o.stage)).length}</span>
          </Link>
        ))}
      </nav>
      {shown.length === 0 ? (
        <div className="cp-panel cp-empty-card"><Boxes size={28} aria-hidden="true" /><p>No orders in this view yet.</p></div>
      ) : (
        <div className="cp-list">
          {shown.map((o) => (
            <article key={o.taskId} className="cp-order">
              <div className="cp-order-top">
                <div><p className="cp-order-id">{o.publicTaskId ?? o.taskId.slice(0, 8)}{o.category ? ` · ${o.category}` : ""}</p><h3>{o.title}</h3></div>
                <StagePill stage={o.stage} revision={o.inRevision} />
              </div>
              <OrderTracker stage={o.stage} />
              <dl className="cp-meta">
                <div><dt>Ordered</dt><dd>{formatDate(o.createdAt)}</dd></div>
                <div><dt>Last update</dt><dd>{formatDate(o.updatedAt)}</dd></div>
                {o.stage !== "DELIVERED" && o.stage !== "COMPLETED" && o.stage !== "CANCELED" && <div><dt>Target date</dt><dd>{formatDate(o.targetDate)}</dd></div>}
                {o.deliveredAt && <div><dt>Delivered</dt><dd>{formatDate(o.deliveredAt)}</dd></div>}
                {o.clientRating && <div><dt>Your rating</dt><dd>{"★".repeat(o.clientRating)}{"☆".repeat(5 - o.clientRating)}</dd></div>}
              </dl>
              {(o.stage === "DELIVERED" || o.stage === "COMPLETED") && <Link className="ev2-textlink" href="/client-portal/delivered">View delivery</Link>}
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
