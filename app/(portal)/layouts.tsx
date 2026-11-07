import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, AlertTriangle, Info, type LucideIcon } from "lucide-react";

/**
 * Evaryn workspace layout kit.
 * Server-safe building blocks for the Bento, Kanban, Timeline, Split and List layouts.
 * All colour comes from CSS tokens (see layout-system.css), so nothing here is theme specific.
 */
export type EvTone = "cyan" | "blue" | "violet" | "green" | "amber" | "rose" | "slate";
const t = (tone?: EvTone) => (tone ? ` evx-t-${tone}` : "");
const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ");

/* ------------------------------------------------------------ page frame */
export function PageFrame({ children, className }: { children: ReactNode; className?: string }) {
  return <main className={cx("evx-page", className)}>{children}</main>;
}

export function PageTitle({
  eyebrow, title, description, back, actions,
}: {
  eyebrow?: string; title: string; description?: ReactNode;
  back?: { href: string; label: string }; actions?: ReactNode;
}) {
  return (
    <header>
      {back && <Link href={back.href} className="evx-back"><ArrowLeft size={15} aria-hidden="true" />{back.label}</Link>}
      <div className="evx-head">
        <div className="evx-head-text">
          {eyebrow && <p className="evx-eyebrow">{eyebrow}</p>}
          <h1 className="evx-title">{title}</h1>
          {description && <p className="evx-lede">{description}</p>}
        </div>
        {actions && <div className="evx-actions">{actions}</div>}
      </div>
    </header>
  );
}

export function SectionHead({ title, hint, aside }: { title: string; hint?: string; aside?: ReactNode }) {
  return (
    <div className="evx-section-head">
      <div><h2 className="evx-section-title">{title}</h2>{hint && <p className="evx-section-hint">{hint}</p>}</div>
      {aside}
    </div>
  );
}

/* ------------------------------------------------------------- primitives */
export function Pill({ tone = "slate", children, plain }: { tone?: EvTone; children: ReactNode; plain?: boolean }) {
  return <span className={cx("evx-pill", plain && "evx-pill-plain", t(tone))}>{children}</span>;
}

export function Notice({ tone = "cyan", children }: { tone?: "cyan" | "green" | "amber" | "rose"; children: ReactNode }) {
  const Icon = tone === "green" ? CheckCircle2 : tone === "cyan" ? Info : AlertTriangle;
  return (
    <div role={tone === "amber" || tone === "rose" ? "alert" : "status"} className={cx("evx-notice", t(tone))}>
      <Icon size={17} aria-hidden="true" /><div>{children}</div>
    </div>
  );
}

export function Empty({ icon: Icon, title, text, action }: { icon: LucideIcon; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="evx-empty">
      <Icon size={28} aria-hidden="true" /><h2>{title}</h2>{text && <p>{text}</p>}
      {action && <div className="evx-actions" style={{ marginTop: 10, justifyContent: "center" }}>{action}</div>}
    </div>
  );
}

export const btn = {
  primary: "evx-btn evx-btn-primary", violet: "evx-btn evx-btn-violet", ghost: "evx-btn evx-btn-ghost",
  warn: "evx-btn evx-btn-warn", sm: "evx-btn-sm", block: "evx-btn-block",
};
export const field = { input: "evx-input", select: "evx-select", textarea: "evx-textarea" };

/* ----------------------------------------------------------------- tabs */
export function Tabs({ tabs, label }: { tabs: { key: string; label: string; href: string; count?: number; active: boolean; icon?: LucideIcon }[]; label: string }) {
  return (
    <nav className="evx-tabs" aria-label={label}>
      {tabs.map(({ key, label: text, href, count, active, icon: Icon }) => (
        <Link key={key} href={href} className="evx-tab" aria-current={active ? "page" : undefined}>
          {Icon && <Icon size={15} aria-hidden="true" />}{text}
          {typeof count === "number" && <span className="evx-tab-count">{count}</span>}
        </Link>
      ))}
    </nav>
  );
}

/* ---------------------------------------------------------------- bento */
export function Bento({ children, label }: { children: ReactNode; label?: string }) {
  return <section className="evx-bento" aria-label={label}>{children}</section>;
}

export function Lead({
  icon: Icon, kicker, title, subtitle, figure, actions, className,
}: {
  icon: LucideIcon; kicker: string; title: string; subtitle: string;
  figure?: { label: string; value: string; note?: string };
  actions?: ReactNode; className?: string;
}) {
  return (
    <div className={cx("evx-lead ev-hero", className)}>
      <div>
        <span className="evx-lead-kicker"><Icon size={14} aria-hidden="true" />{kicker}</span>
        <h1>{title}</h1>
        <p className="evx-lead-sub">{subtitle}</p>
      </div>
      {figure && (
        <div className="evx-lead-figure"><small>{figure.label}</small><strong>{figure.value}</strong>{figure.note && <span>{figure.note}</span>}</div>
      )}
      {actions && <div className="evx-lead-actions">{actions}</div>}
    </div>
  );
}

export function LeadLink({ href, children, primary }: { href: string; children: ReactNode; primary?: boolean }) {
  return <Link href={href} className={cx("evx-btn", primary ? "evx-btn-primary" : "evx-btn-ghost")}>{children}</Link>;
}

export function Kpi({
  label, value, note, icon: Icon, tone = "cyan", href, cta, accent, className,
}: {
  label: string; value: string | number; note?: string; icon?: LucideIcon; tone?: EvTone;
  href?: string; cta?: string; accent?: boolean; className?: string;
}) {
  const body = (
    <>
      <div className="evx-kpi-top">
        <p className="evx-kpi-label">{label}</p>
        {Icon && <span className="evx-chip" aria-hidden="true"><Icon size={17} /></span>}
      </div>
      <p className="evx-kpi-value">{value}</p>
      {note && <p className="evx-kpi-note">{note}</p>}
      {href && cta && <span className="evx-kpi-cta">{cta}<ArrowRight size={13} aria-hidden="true" /></span>}
    </>
  );
  const cls = cx("evx-card evx-kpi", accent && "evx-accent", t(tone), className);
  return href ? <Link href={href} className={cx(cls, "evx-link-card")}>{body}</Link> : <div className={cls}>{body}</div>;
}

export function Strip({ items, className }: {
  items: { label: string; value: number | string; tone?: EvTone; href?: string }[]; className?: string;
}) {
  return (
    <div className={cx("evx-card evx-strip", className)} style={{ "--n": items.length } as CSSProperties}>
      {items.map((i) => {
        const inner = (<><span className="evx-strip-value">{i.value}</span><span className="evx-strip-label">{i.label}</span></>);
        const cls = cx("evx-strip-item", t(i.tone));
        return i.href ? <Link key={i.label} href={i.href} className={cls}>{inner}</Link> : <div key={i.label} className={cls}>{inner}</div>;
      })}
    </div>
  );
}

export function Tile({ title, aside, children, className }: { title?: string; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cx("evx-card evx-card-pad", className)}>
      {(title || aside) && <div className="evx-section-head" style={{ marginBottom: 6 }}>{title && <h2 className="evx-section-title">{title}</h2>}{aside}</div>}
      {children}
    </div>
  );
}

export function QuickLink({ href, icon: Icon, title, text, tone = "cyan", badge }: {
  href: string; icon: LucideIcon; title: string; text: string; tone?: EvTone; badge?: number;
}) {
  return (
    <Link href={href} className={cx("evx-link", t(tone))}>
      <span className="evx-chip" aria-hidden="true"><Icon size={17} /></span>
      <span><strong>{title}</strong><span className="evx-link-text">{text}</span></span>
      {typeof badge === "number" && badge > 0 && <span className={cx("evx-count", t("rose"))}>{badge}</span>}
    </Link>
  );
}

/* --------------------------------------------------------------- kanban */
export function Kanban({ columns, children, label }: { columns: number; children: ReactNode; label: string }) {
  return <div className="evx-kanban" style={{ "--cols": columns } as CSSProperties} role="group" aria-label={label}>{children}</div>;
}

export function KanbanColumn({ title, count, tone = "cyan", empty = "Nothing here", children }: {
  title: string; count: number; tone?: EvTone; empty?: string; children?: ReactNode;
}) {
  return (
    <section className={cx("evx-col", t(tone))} aria-label={title}>
      <div className="evx-col-head"><h2 className="evx-col-title">{title}</h2><span className="evx-col-count">{count}</span></div>
      <div className="evx-col-body">{count === 0 ? <p className="evx-col-empty">{empty}</p> : children}</div>
    </section>
  );
}

export function KanbanCard({ tone = "cyan", children }: { tone?: EvTone; children: ReactNode }) {
  return <article className={cx("evx-kcard", t(tone))}>{children}</article>;
}

/* ------------------------------------------------------------- timeline */
export type TimelineEntry = { key: string; at: Date; tone?: EvTone; node: ReactNode };

const dayKey = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Africa/Nairobi" });
const dayLabel = (d: Date) => {
  const today = dayKey(new Date());
  const yesterday = dayKey(new Date(Date.now() - 86_400_000));
  const k = dayKey(d);
  if (k === today) return "Today";
  if (k === yesterday) return "Yesterday";
  return d.toLocaleDateString("en-KE", { timeZone: "Africa/Nairobi", weekday: "long", day: "numeric", month: "long", year: "numeric" });
};

/** Newest-first entries, grouped under day headings. */
export function Timeline({ entries, label }: { entries: TimelineEntry[]; label: string }) {
  const out: ReactNode[] = [];
  let current = "";
  for (const e of entries) {
    const k = dayKey(e.at);
    if (k !== current) {
      current = k;
      out.push(<li key={"day-" + k} className="evx-tl-day" aria-hidden="true">{dayLabel(e.at)}</li>);
    }
    const time = e.at.toLocaleTimeString("en-KE", { timeZone: "Africa/Nairobi", hour: "2-digit", minute: "2-digit" });
    out.push(
      <li key={e.key} className={cx("evx-tl-item", t(e.tone))}>
        <div className="evx-tl-time">{time}<small>{e.at.toLocaleDateString("en-KE", { timeZone: "Africa/Nairobi", day: "numeric", month: "short" })}</small></div>
        <span className="evx-tl-node" aria-hidden="true" />
        <div className="evx-tl-card">{e.node}</div>
      </li>
    );
  }
  return <ol className="evx-tl" aria-label={label}>{out}</ol>;
}

/* ----------------------------------------------------------- split view */
export function SplitView({ list, detail, hasDetail, label }: { list: ReactNode; detail: ReactNode; hasDetail: boolean; label: string }) {
  return (
    <div className={cx("evx-split", hasDetail ? "evx-split-has-detail" : "evx-split-no-detail")} role="group" aria-label={label}>
      <aside className="evx-split-list">{list}</aside>
      <section className="evx-split-detail">{detail}</section>
    </div>
  );
}

export function SplitItem({ href, active, title, top, snippet, time, tone }: {
  href: string; active?: boolean; title: string; top?: ReactNode; snippet?: string | null; time?: string; tone?: EvTone;
}) {
  return (
    <Link href={href} className={cx("evx-li", t(tone))} aria-current={active ? "true" : undefined}>
      <div className="evx-li-top">{top ?? <span />}{time && <time className="evx-li-time">{time}</time>}</div>
      <h3 className="evx-li-title">{title}</h3>
      {snippet && <p className="evx-li-snippet">{snippet}</p>}
    </Link>
  );
}

export function SplitPlaceholder({ icon: Icon, title, text, children }: { icon: LucideIcon; title: string; text: string; children?: ReactNode }) {
  return (
    <div className="evx-split-placeholder"><Icon size={34} aria-hidden="true" /><h2>{title}</h2><p>{text}</p>{children}</div>
  );
}

/* ----------------------------------------------------------------- list */
export function ListTable({ cols, headers, children, label }: { cols: string; headers: { text: string; end?: boolean }[]; children: ReactNode; label: string }) {
  return (
    <div className="evx-list" style={{ "--cols": cols } as CSSProperties} role="table" aria-label={label}>
      <div className="evx-list-head" role="row">{headers.map((h) => <span key={h.text} role="columnheader" className={h.end ? "evx-cell-end" : undefined}>{h.text}</span>)}</div>
      {children}
    </div>
  );
}

export function Cell({ label, end, children }: { label?: string; end?: boolean; children: ReactNode }) {
  return <div role="cell" className={cx("evx-cell", end && "evx-cell-end")}>{label && <span className="evx-cell-label">{label}</span>}{children}</div>;
}

export function Row({ children }: { children: ReactNode }) {
  return <div role="row" className="evx-list-row">{children}</div>;
}

/** A list row that expands in place to reveal forms or detail. */
export function ExpandRow({ summary, children, defaultOpen }: { summary: ReactNode; children: ReactNode; defaultOpen?: boolean }) {
  return (
    <details className="evx-expand" open={defaultOpen}>
      <summary><div role="row" className="evx-list-row">{summary}<span className="evx-expand-chevron" aria-hidden="true" /></div></summary>
      <div className="evx-expand-body">{children}</div>
    </details>
  );
}

/* ---------------------------------------------------------------- stars */
export function Stars({ rating }: { rating: number | null }) {
  if (rating === null) return <span className="evx-meta">Not rated</span>;
  const v = Math.max(0, Math.min(5, rating));
  return (
    <span className="evx-stars" aria-label={`${v.toFixed(1)} out of five stars`}>
      <span className="evx-stars-row" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((n) => (
          <svg key={n} width="16" height="16" viewBox="0 0 24 24" fill={n <= Math.round(v) ? "#f59e0b" : "none"} stroke={n <= Math.round(v) ? "#f59e0b" : "#94a3b8"} strokeWidth="1.6" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
        ))}
      </span>
      <span className="evx-num" style={{ fontSize: 13, fontWeight: 700 }}>{v.toFixed(1)}</span>
    </span>
  );
}

export function PayBar({ percent }: { percent: number | null }) {
  if (percent === null || !Number.isFinite(percent)) return <span className="evx-meta">Not recorded</span>;
  const v = Math.max(0, Math.min(100, percent));
  const color = v >= 80 ? "var(--evx-green)" : v > 50 ? "var(--evx-amber)" : "var(--evx-rose)";
  return (
    <div className="evx-paybar">
      <span className="evx-num" style={{ fontSize: 13, fontWeight: 700 }}>{v.toFixed(0)}% paid</span>
      <div className="evx-paybar-track" role="progressbar" aria-label="Client payment percentage" aria-valuemin={0} aria-valuemax={100} aria-valuenow={v}><i style={{ width: `${v}%`, background: color }} /></div>
    </div>
  );
}

/* -------------------------------------------------------------- helpers */
export const fmtDateTime = (d: Date | string | null | undefined) =>
  d ? new Date(d).toLocaleString("en-KE", { timeZone: "Africa/Nairobi", dateStyle: "medium", timeStyle: "short" }) : "Not set";
export const fmtDate = (d: Date | string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("en-KE", { timeZone: "Africa/Nairobi", day: "numeric", month: "short", year: "numeric" }) : "Not set";
export const usd = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const pretty = (s: string) => s.replaceAll("_", " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
export function statusTone(status: string): EvTone {
  const s = status.toUpperCase();
  if (s === "COMPLETED" || s === "PAID" || s === "APPROVED" || s === "POST_QA_APPROVED") return "green";
  if (s.startsWith("CANCEL") || s === "REJECTED") return "rose";
  if (s.includes("REWORK") || s.includes("REVISION")) return "amber";
  if (s.includes("QA")) return "violet";
  if (s.includes("REVIEW")) return "blue";
  if (s === "ASSIGNED" || s === "IN_PROGRESS" || s === "OPEN" || s === "NEW") return "cyan";
  return "slate";
}
export const waitAgo = (d: Date) => {
  const mins = Math.max(1, Math.round((Date.now() - d.getTime()) / 60000));
  if (mins < 60) return `${mins} min`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr`;
  const days = Math.round(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"}`;
};
export const hoursSince = (d: Date) => (Date.now() - d.getTime()) / 3_600_000;
