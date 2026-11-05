import { Fragment } from "react";
import { prisma } from "@/lib/db/prisma";
import { PackageCheck, CheckCircle2 } from "lucide-react";
import { listClientOrders, deliverableFor, formatDate } from "@/lib/client-orders";
import { ensureClientProfile } from "../../clients/actions";
import { rateDelivery } from "../actions";
import { StagePill } from "../parts";

export default async function Delivered({ searchParams }: { searchParams: Promise<{ thanks?: string; error?: string }> }) {
  const client = await ensureClientProfile();
  const p = await searchParams;
  const all = await listClientOrders(client.id).catch(() => []);
  const delivered = all.filter((o) => (o.stage === "DELIVERED" || o.stage === "COMPLETED") && o.deliveredAt);
  const items = await Promise.all(delivered.map(async (o) => ({ o, work: await deliverableFor(o.taskId).catch(() => null) })));
  const deliveryFiles = await prisma.clientDelivery.findMany({ where: { clientId: client.id }, select: { id: true, taskId: true }, orderBy: { publishedAt: "desc" } });
  const fileByTask = new Map(deliveryFiles.map(d => [d.taskId, d.id]));
  const waiting = items.filter(({ o }) => o.stage === "DELIVERED" && !o.ratedAt).length;

  return (
    <main className="cp-page">
      <div className="cp-head"><div><h1 className="cp-title">Delivered orders</h1><p className="cp-sub">Work that has passed our quality checks and been sent to you. Rate each delivery: your rating goes to everyone who worked on it.</p></div></div>
      {p.thanks && <p role="status" className="cp-flash cp-flash--ok"><CheckCircle2 size={18} aria-hidden="true" /> Thank you. Your rating has been shared with the team.</p>}
      {p.error && <p role="alert" className="cp-flash cp-flash--err">We could not save that rating. Please choose 1 to 5 stars and try again.</p>}
      {waiting > 0 && <p className="cp-note cp-note--lg">{waiting} delivery{waiting === 1 ? " is" : "ies are"} waiting for your rating.</p>}

      {items.length === 0 ? (
        <div className="cp-panel cp-empty-card"><PackageCheck size={28} aria-hidden="true" /><p>Nothing has been delivered yet. Finished orders will appear here.</p></div>
      ) : (
        <div className="cp-list">
          {items.map(({ o, work }) => {
            const locked = o.stage === "COMPLETED";
            return (
              <article key={o.taskId} className="cp-order cp-delivery">
                <div className="cp-order-top">
                  <div><p className="cp-order-id">{o.publicTaskId ?? o.taskId.slice(0, 8)}{o.category ? ` · ${o.category}` : ""} · Delivered {formatDate(o.deliveredAt)}</p><h3>{o.title}</h3></div>
                  <StagePill stage={o.stage} />
                </div>
                {o.deliveryNote && <div className="cp-quote"><strong>Note from Evaryn</strong><p>{o.deliveryNote}</p></div>}
                {!work?.content && <div className="cp-note">No written submission was included with this delivery. Open order details for attached files.</div>}
                {work?.content && (
                  <details className="cp-work">
                    <summary>View delivered work</summary>
                    <div className="cp-work-body">{work.content}</div>
                  </details>
                )}
                {fileByTask.has(o.taskId) && <a className="inline-flex rounded-xl bg-[#7956AF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#674698]" href={`/client-portal/delivered/${fileByTask.get(o.taskId)}`}>View delivery and attachments</a>}
                <form action={rateDelivery} className="cp-rate-form">
                  <input type="hidden" name="taskId" value={o.taskId} />
                  <fieldset disabled={locked}>
                    <legend>{locked ? "Your rating" : o.ratedAt ? "Update your rating" : "How did we do?"}</legend>
                    <div className="cp-rate" role="radiogroup">
                      {[5, 4, 3, 2, 1].map((n) => (
                        <Fragment key={n}>
                          <input type="radio" id={`r-${o.taskId}-${n}`} name="rating" value={n} defaultChecked={o.clientRating === n} required />
                          <label htmlFor={`r-${o.taskId}-${n}`} title={`${n} star${n === 1 ? "" : "s"}`}><span aria-hidden="true">★</span><span className="sr-only">{n} stars</span></label>
                        </Fragment>
                      ))}
                    </div>
                    {!locked && <label className="cp-feedback">Comments for the team (optional)
                      <textarea name="feedback" rows={3} maxLength={2000} defaultValue={o.clientFeedback ?? ""} placeholder="What went well? What could be better?" />
                    </label>}
                    {locked && o.clientFeedback && <p className="cp-note">“{o.clientFeedback}”</p>}
                  </fieldset>
                  {!locked && <button className="ev2-primary">{o.ratedAt ? "Update rating" : "Submit rating"}</button>}
                </form>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
