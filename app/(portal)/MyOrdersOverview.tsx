import { Suspense } from "react";
import { connection } from "next/server";
import { BadgeCheck, CheckCircle2, ClipboardCheck, Layers, Loader2, RotateCcw, ShieldCheck, Timer, XCircle } from "lucide-react";
import { requireEmployee } from "@/lib/auth/require-employee";
import { getMyOrdersStats } from "@/lib/tasks/my-orders-stats";
import { Empty, Kpi, PageFrame, PageTitle, SectionHead, Stars, Tile, usd } from "./layouts";

const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

async function Content() {
  await connection();
  const user = await requireEmployee(["TASKER", "REVIEWER", "QA", "ADMIN", "SUPER_ADMIN"]);
  const s = await getMyOrdersStats(user.id);
  if (!s) return <PageFrame><Empty icon={Layers} title="Profile unavailable" text="Your employee profile is not active. Contact your administrator." /></PageFrame>;

  const o = s.orders;
  const checker = s.role !== "TASKER";
  const outcome = [
    { label: "Completed", n: o.completed, color: "var(--evx-green)" },
    { label: "In progress", n: o.progress, color: "var(--evx-cyan)" },
    { label: "In revision", n: o.revision, color: "var(--evx-amber)" },
    { label: "Cancelled", n: o.cancelled, color: "var(--evx-slate)" },
  ];

  return (
    <PageFrame>
      <PageTitle eyebrow="My orders" title="Your work at a glance" description="Order and review statistics for everything you have done at any level. Open new work from the Task Hub." />

      <section aria-labelledby="order-stats">
        <SectionHead title="Order statistics" hint="Counts match your dashboard." />
        <div className="evx-bento">
          <Kpi className="evx-s3" label="Total orders" value={o.total} icon={Layers} tone="blue" />
          <Kpi className="evx-s3" label="In progress" value={o.progress} icon={Loader2} tone="cyan" />
          <Kpi className="evx-s3" label="In revision" value={o.revision} icon={RotateCcw} tone="amber" accent={o.revision > 0} />
          <Kpi className="evx-s3" label="Completed" value={o.completed} icon={CheckCircle2} tone="green" note={`${pct(o.completed, o.total)}% of all orders`} />
          <Tile className="evx-s8" title="Order outcomes">
            {o.total === 0 ? <p className="evx-meta" style={{ padding: "12px 0" }}>No orders yet. Claim your first from the Task Hub.</p> : (
              <>
                <div style={{ display: "flex", height: 12, borderRadius: 999, overflow: "hidden", background: "var(--ev-inset)", marginTop: 8 }} role="img" aria-label={outcome.map((x) => `${x.label} ${x.n}`).join(", ")}>
                  {outcome.filter((x) => x.n > 0).map((x) => <i key={x.label} style={{ width: `${(x.n / o.total) * 100}%`, background: x.color }} />)}
                </div>
                <ul style={{ display: "flex", flexWrap: "wrap", gap: "8px 22px", listStyle: "none", margin: "14px 0 0", padding: 0 }}>
                  {outcome.map((x) => <li key={x.label} className="evx-meta" style={{ display: "flex", alignItems: "center", gap: 7 }}><i style={{ width: 9, height: 9, borderRadius: 3, background: x.color }} />{x.label} <strong className="evx-num" style={{ color: "var(--ev-ink)" }}>{x.n}</strong></li>)}
                </ul>
              </>
            )}
          </Tile>
          <Kpi className="evx-s4" label="Cancelled" value={o.cancelled} icon={XCircle} tone="slate" />
        </div>
      </section>

      <section aria-labelledby="review-stats">
        <SectionHead title="Review statistics" hint="Feedback on your own work, and the decisions you made on others’ work." />
        <div className="evx-bento">
          <Kpi className="evx-s3" label="Reviews on your work" value={s.received.total} icon={ClipboardCheck} tone="blue" />
          <Kpi className="evx-s3" label="Approved by reviewers" value={s.received.approved} icon={BadgeCheck} tone="green" note={`${pct(s.received.approved, s.received.total)}% approval rate`} />
          <Kpi className="evx-s3" label="Revisions requested" value={s.received.revisions} icon={RotateCcw} tone="amber" />
          <Tile className="evx-s3" title="Client rating">
            <p className="evx-kpi-value" style={{ marginTop: 6 }}>{s.clientRating.average === null ? "Not rated" : s.clientRating.average.toFixed(2)}</p>
            <div style={{ marginTop: 6 }}><Stars rating={s.clientRating.average} /></div>
            <p className="evx-kpi-note" style={{ marginTop: 6 }}>{s.clientRating.rated} rated order{s.clientRating.rated === 1 ? "" : "s"}</p>
          </Tile>
          {checker && (
            <>
              <Kpi className="evx-s3" label="Reviews you approved" value={s.performed.reviewerApproved} icon={ClipboardCheck} tone="cyan" />
              <Kpi className="evx-s3" label="Reviews sent back" value={s.performed.reviewerSentBack} icon={RotateCcw} tone="amber" />
              <Kpi className="evx-s3" label="QA checks passed" value={s.performed.qaApproved} icon={ShieldCheck} tone="violet" />
              <Kpi className="evx-s3" label="QA checks sent back" value={s.performed.qaSentBack} icon={RotateCcw} tone="amber" />
            </>
          )}
          {s.adminTime && (
            <Kpi className="evx-s12" label="Admin time tracked" value={`${s.adminTime.hours.toFixed(2)} hours`} icon={Timer} tone="violet" note={`${s.adminTime.sessions} session${s.adminTime.sessions === 1 ? "" : "s"} · accrued ${usd(s.adminTime.amount)} · approval and payment stay in payroll`} />
          )}
        </div>
      </section>
    </PageFrame>
  );
}

export default function MyOrdersOverview() {
  return <Suspense fallback={<div className="evx-page"><div className="evx-card evx-card-pad evx-muted">Loading your statistics…</div></div>}><Content /></Suspense>;
}
