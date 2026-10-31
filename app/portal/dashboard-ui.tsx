import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, type LucideIcon } from "lucide-react";

export const money = (n: number) =>
  "$" +
  n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const when = (d: Date | null) =>
  d
    ? d.toLocaleString("en-KE", {
        timeZone: "Africa/Nairobi",
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "No deadline";

/** Semantic tones used for icon chips. */
export const tones = {
  cyan: "#00b0f8",
  blue: "#2f7bf0",
  green: "#10b981",
  amber: "#f59e0b",
  slate: "#64748b",
  rose: "#f43f5e",
  violet: "#8b5cf6",
  teal: "#14b8a6",
  gold: "#f5b301",
} as const;
export type Tone = keyof typeof tones;

const card =
  "rounded-2xl border border-[var(--ev-border-soft)] bg-[var(--ev-surface)] shadow-[var(--ev-shadow)]";

function Chip({ icon: Icon, tone }: { icon: LucideIcon; tone: Tone }) {
  const c = tones[tone];
  return (
    <span
      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
      style={{
        background: `color-mix(in srgb, ${c} 18%, transparent)`,
        color: c,
      }}
    >
      <Icon size={21} aria-hidden="true" />
    </span>
  );
}

/** Branded banner at the top of every dashboard. */
export function Hero({
  icon: Icon,
  eyebrow,
  title,
  subtitle,
  accent,
  children,
  aside,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  subtitle: string;
  accent: string;
  children?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section
      className="relative isolate overflow-hidden rounded-3xl p-6 text-white sm:p-9"
      style={{
        background:
          "linear-gradient(135deg,var(--ev-hero-from),var(--ev-hero-via) 55%,var(--ev-hero-to))",
        boxShadow: "var(--ev-shadow)",
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[url('/watermarks/evaryn-watermark.svg')] bg-[position:right_-40px_center] bg-no-repeat opacity-[0.12]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-1.5"
        style={{ background: accent }}
      />
      <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div>
          <span
            className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest"
            style={{
              background: "rgba(255,255,255,.14)",
              border: "1px solid rgba(255,255,255,.28)",
              color: "#ffffff",
            }}
          >
            <Icon size={14} style={{ color: accent }} aria-hidden="true" />
            {eyebrow}
          </span>
          <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-7 text-white/80">
            {subtitle}
          </p>
          {children && <div className="mt-6 flex flex-wrap gap-3">{children}</div>}
        </div>
        {aside && <div>{aside}</div>}
      </div>
    </section>
  );
}

/** Frosted panel used inside a Hero for the key number. */
export function HeroFigure({
  label,
  value,
  note,
  href,
  cta,
}: {
  label: string;
  value: string;
  note?: string;
  href?: string;
  cta?: string;
}) {
  return (
    <div
      className="rounded-2xl p-6 text-white"
      style={{
        background: "rgba(255,255,255,.13)",
        border: "1px solid rgba(255,255,255,.26)",
        backdropFilter: "blur(6px)",
      }}
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-white/75">
        {label}
      </p>
      <p className="mt-3 text-4xl font-bold tabular-nums sm:text-5xl">{value}</p>
      {note && <p className="mt-2 text-sm text-white/75">{note}</p>}
      {href && cta && (
        <Link
          href={href}
          className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white underline decoration-white/40 underline-offset-4 hover:decoration-white"
        >
          {cta} <ArrowRight size={15} aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

/** Primary / secondary buttons for use inside the Hero. */
export function HeroButton({
  href,
  children,
  primary,
}: {
  href: string;
  children: ReactNode;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition ${
        primary
          ? "bg-white text-[#003a8a] hover:bg-[#d6f1fe]"
          : "border border-white/45 text-white hover:bg-white/15"
      }`}
    >
      {children}
    </Link>
  );
}

export function SectionTitle({
  title,
  hint,
}: {
  title: string;
  hint?: string;
}) {
  return (
    <div className="mb-4 mt-10">
      <h2 className="text-lg font-bold tracking-tight text-[var(--ev-ink)]">
        {title}
      </h2>
      {hint && <p className="mt-1 text-sm text-[var(--ev-muted)]">{hint}</p>}
    </div>
  );
}

/** Large metric card. */
export function StatCard({
  label,
  value,
  icon,
  tone,
  href,
  cta = "View",
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone: Tone;
  href?: string;
  cta?: string;
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-[var(--ev-muted)]">{label}</p>
        <Chip icon={icon} tone={tone} />
      </div>
      <p className="mt-4 text-4xl font-bold tabular-nums text-[var(--ev-ink)]">
        {value}
      </p>
      {href && (
        <p className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[var(--ev-accent-text)]">
          {cta} <ArrowRight size={13} aria-hidden="true" />
        </p>
      )}
    </>
  );
  const cls = `${card} block border-l-4 p-5 transition`;
  const style = { borderLeftColor: tones[tone] };
  return href ? (
    <Link
      href={href}
      className={`${cls} hover:-translate-y-0.5 hover:bg-[var(--ev-surface-2)]`}
      style={style}
    >
      {body}
    </Link>
  ) : (
    <div className={cls} style={style}>
      {body}
    </div>
  );
}

/** Small inline metric, used in dense strips. */
export function MiniStat({
  label,
  value,
  tone,
  href,
}: {
  label: string;
  value: number | string;
  tone: Tone;
  href?: string;
}) {
  const inner = (
    <>
      <span
        className="mb-2 block h-1 w-8 rounded-full"
        style={{ background: tones[tone] }}
      />
      <p className="text-2xl font-bold tabular-nums text-[var(--ev-ink)]">
        {value}
      </p>
      <p className="mt-0.5 text-xs font-semibold text-[var(--ev-muted)]">
        {label}
      </p>
    </>
  );
  const cls = `${card} p-4`;
  return href ? (
    <Link href={href} className={`${cls} transition hover:bg-[var(--ev-surface-2)]`}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

/** Action link tile with an optional "needs attention" badge. */
export function ActionTile({
  title,
  description,
  href,
  icon,
  tone = "blue",
  badge,
}: {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  tone?: Tone;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className={`${card} group relative flex items-start gap-4 p-5 transition hover:-translate-y-0.5 hover:bg-[var(--ev-surface-2)]`}
    >
      <Chip icon={icon} tone={tone} />
      <div className="min-w-0 flex-1">
        <h3 className="font-bold text-[var(--ev-ink)]">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-[var(--ev-muted)]">
          {description}
        </p>
      </div>
      {typeof badge === "number" && badge > 0 && (
        <span className="absolute right-4 top-4 inline-flex min-w-7 items-center justify-center rounded-full bg-rose-500 px-2 py-0.5 text-xs font-bold text-white">
          {badge}
        </span>
      )}
      <ArrowRight
        size={17}
        aria-hidden="true"
        className="mt-1 shrink-0 text-[var(--ev-accent-text)] opacity-0 transition group-hover:opacity-100"
      />
    </Link>
  );
}

export function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`${card} p-6 ${className}`}>{children}</div>;
}
