import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, type LucideIcon } from "lucide-react";

/* ---------- tokens shared as class strings ---------- */
export const card =
  "rounded-2xl border border-[var(--ev-border-soft)] bg-[var(--ev-surface)] shadow-[var(--ev-shadow)]";

export const inputCls =
  "h-11 w-full rounded-xl border border-[var(--ev-border)] bg-[var(--ev-surface)] px-3.5 text-sm text-[var(--ev-ink)] outline-none transition focus:border-[var(--ev-cyan)] focus:ring-2 focus:ring-[var(--ev-cyan)]/30";

export const textareaCls =
  "w-full rounded-xl border border-[var(--ev-border)] bg-[var(--ev-surface)] px-3.5 py-3 text-sm text-[var(--ev-ink)] outline-none transition focus:border-[var(--ev-cyan)] focus:ring-2 focus:ring-[var(--ev-cyan)]/30";

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--ev-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--ev-on-primary)] transition hover:bg-[var(--ev-primary-hover)] disabled:cursor-not-allowed disabled:opacity-40";

export const btnGhost =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--ev-border)] bg-[var(--ev-surface)] px-5 py-2.5 text-sm font-semibold text-[var(--ev-ink)] transition hover:bg-[var(--ev-surface-2)] disabled:cursor-not-allowed disabled:opacity-40";

/* ---------- Back link ---------- */
export function BackLink({
  href = "/portal",
  label = "Dashboard",
}: {
  href?: string;
  label?: string;
}) {
  return (
    <div className="mb-5">
    <Link
      href={href}
      className="group inline-flex items-center gap-2 rounded-full border border-[var(--ev-border)] bg-[var(--ev-surface)] py-1.5 pl-2 pr-4 text-sm font-semibold text-[var(--ev-accent-text)] no-underline shadow-sm transition hover:border-[var(--ev-cyan)] hover:bg-[var(--ev-surface-2)]"
    >
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--ev-primary)] text-[var(--ev-on-primary)] transition group-hover:-translate-x-0.5">
        <ArrowLeft size={14} aria-hidden="true" />
      </span>
      {label}
    </Link>
    </div>
  );
}

/* ---------- Page frame + header ---------- */
export function PageShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[var(--ev-page)] px-4 py-6 text-[var(--ev-ink)] sm:px-8 sm:py-8">
      <div className="mx-auto w-full max-w-[1400px]">{children}</div>
    </main>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  back,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  back?: { href?: string; label?: string } | false;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-7">
      {back !== false && (
        <BackLink href={back?.href} label={back?.label} />
      )}
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="max-w-3xl">
          {eyebrow && (
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--ev-accent-text)]">
              {eyebrow}
            </p>
          )}
          <h1 className="mt-1.5 text-3xl font-bold tracking-tight sm:text-4xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-3 text-sm leading-7 text-[var(--ev-muted)]">
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
      </div>
    </header>
  );
}

/* ---------- Tabs (link based, server friendly) ---------- */
export function TabNav({
  tabs,
  label,
}: {
  tabs: { key: string; label: string; href: string; count?: number; active: boolean }[];
  label: string;
}) {
  return (
    <nav
      aria-label={label}
      className="flex flex-wrap gap-1.5 rounded-2xl border border-[var(--ev-border-soft)] bg-[var(--ev-surface)] p-1.5"
    >
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          aria-current={t.active ? "page" : undefined}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold no-underline transition ${
            t.active
              ? "bg-[var(--ev-primary)] text-[var(--ev-on-primary)]"
              : "text-[var(--ev-ink)] hover:bg-[var(--ev-surface-2)]"
          }`}
        >
          {t.label}
          {typeof t.count === "number" && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ${
                t.active ? "bg-white/25" : "bg-[var(--ev-inset)]"
              }`}
            >
              {t.count}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}

/* ---------- Status pills ---------- */
const pillTones = {
  cyan: "bg-cyan-500/15 text-[#0369a1] dark:text-[#7dd8ff]",
  green: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  amber: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  rose: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  slate: "bg-slate-500/15 text-slate-600 dark:text-slate-300",
  violet: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  blue: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
} as const;
export type PillTone = keyof typeof pillTones;

export function Pill({
  tone = "cyan",
  children,
}: {
  tone?: PillTone;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${pillTones[tone]}`}
    >
      {children}
    </span>
  );
}

export function statusTone(status: string): PillTone {
  const s = status.toUpperCase();
  if (s === "COMPLETED" || s === "PAID" || s === "APPROVED") return "green";
  if (s.startsWith("CANCEL") || s === "REJECTED") return "slate";
  if (s.includes("REWORK") || s.includes("REVISION") || s === "PENDING") return "amber";
  if (s.includes("QA")) return "violet";
  if (s.includes("REVIEW")) return "blue";
  if (s.includes("DELIVERED")) return "cyan";
  return "cyan";
}

export const prettyStatus = (s: string) =>
  s.replaceAll("_", " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

/* ---------- Empty state ---------- */
export function EmptyState({
  icon: Icon,
  title,
  text,
  action,
}: {
  icon: LucideIcon;
  title: string;
  text?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--ev-border)] bg-[var(--ev-surface)] p-10 text-center">
      <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--ev-inset)] text-[var(--ev-accent-text)]">
        <Icon size={26} aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-lg font-bold">{title}</h2>
      {text && (
        <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-[var(--ev-muted)]">
          {text}
        </p>
      )}
      {action && <div className="mt-5 flex justify-center gap-3">{action}</div>}
    </div>
  );
}

/* ---------- Small metric tile ---------- */
export function Metric({
  label,
  value,
  note,
  accent,
}: {
  label: string;
  value: string | number;
  note?: string;
  accent?: string;
}) {
  return (
    <div
      className={`${card} border-l-4 p-5`}
      style={{ borderLeftColor: accent ?? "var(--ev-cyan)" }}
    >
      <p className="text-sm font-semibold text-[var(--ev-muted)]">{label}</p>
      <p className="mt-2 text-3xl font-bold tabular-nums">{value}</p>
      {note && <p className="mt-1 text-xs text-[var(--ev-muted)]">{note}</p>}
    </div>
  );
}

export const moneyFmt = (n: unknown) =>
  "$" +
  Number(n ?? 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const dateFmt = (d: Date | string | null | undefined) =>
  d
    ? new Date(d).toLocaleDateString("en-KE", {
        timeZone: "Africa/Nairobi",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

export const dateTimeFmt = (d: Date | string | null | undefined) =>
  d
    ? new Date(d).toLocaleString("en-KE", {
        timeZone: "Africa/Nairobi",
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";
