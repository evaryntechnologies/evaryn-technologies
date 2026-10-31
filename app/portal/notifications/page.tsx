import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { Bell, Check, CheckCheck, ExternalLink } from "lucide-react";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";
import { markNotificationRead, markAllNotificationsRead } from "./actions";
import {
  PageShell,
  PageHeader,
  TabNav,
  EmptyState,
  card,
  btnGhost,
  dateTimeFmt,
} from "@/app/portal/ui";

type Group = "orders" | "payments" | "general" | "account";
const groups: { key: Group; label: string }[] = [
  { key: "orders", label: "Orders & messages" },
  { key: "payments", label: "Payments & earnings" },
  { key: "general", label: "General" },
  { key: "account", label: "Account & security" },
];
function bucket(title: string, href: string | null): Group {
  const value = (title + " " + (href ?? "")).toLowerCase();
  if (/password|account|security|suspend|sign.?in|access|profile/.test(value)) return "account";
  if (/payroll|payment|earning|salary|payout|advance/.test(value)) return "payments";
  if (/task|order|review|qa|dispute|deadline|reassign|message|discussion|attachment|fine/.test(value)) return "orders";
  return "general";
}

async function Content({ searchParams }: { searchParams: Promise<{ group?: string }> }) {
  await connection();
  const auth = await requireEmployee();
  const profile = await prisma.employeeProfile.findUnique({ where: { authUserId: auth.id }, select: { id: true } });
  const notifications = profile
    ? await prisma.portalNotification.findMany({ where: { recipientId: profile.id }, orderBy: { createdAt: "desc" }, take: 250 })
    : [];
  const requested = (await searchParams).group;
  const selected: Group = groups.some((g) => g.key === requested) ? (requested as Group) : "orders";
  const shown = notifications.filter((n) => bucket(n.title, n.href) === selected);
  const unreadTotal = notifications.filter((n) => !n.readAt).length;

  return (
    <>
      <PageHeader
        eyebrow="Inbox"
        title="Notifications"
        subtitle={unreadTotal ? `${unreadTotal} unread. Task updates, payments, announcements and account notices.` : "You are all caught up. Task updates, payments, announcements and account notices appear here."}
        actions={
          unreadTotal > 0 ? (
            <form action={markAllNotificationsRead}>
              <button className={btnGhost}><CheckCheck size={15} aria-hidden="true" /> Mark all as read</button>
            </form>
          ) : undefined
        }
      />

      <TabNav
        label="Notification categories"
        tabs={groups.map((g) => ({
          key: g.key,
          label: g.label,
          href: `?group=${g.key}`,
          count: notifications.filter((n) => bucket(n.title, n.href) === g.key && !n.readAt).length || undefined,
          active: selected === g.key,
        }))}
      />

      <section className="mt-6 space-y-3">
        {shown.length === 0 ? (
          <EmptyState icon={Bell} title="Nothing here" text="No notifications in this category." />
        ) : (
          shown.map((n) => (
            <article key={n.id} className={`${card} relative p-5 pl-7`}>
              {!n.readAt && <span aria-label="Unread" className="absolute left-3 top-6 h-2.5 w-2.5 rounded-full bg-[var(--ev-cyan)]" />}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h2 className="font-bold">{n.title}</h2>
                <time className="text-xs text-[var(--ev-muted)]">{dateTimeFmt(n.createdAt)}</time>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[var(--ev-muted)]">{n.body}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href={`/portal/notifications/${n.id}`} className={btnGhost}>
                  <ExternalLink size={14} aria-hidden="true" /> Open full notification
                </Link>
                {!n.readAt && (
                  <form action={markNotificationRead}>
                    <input type="hidden" name="id" value={n.id} />
                    <button className={btnGhost}><Check size={14} aria-hidden="true" /> Mark read</button>
                  </form>
                )}
              </div>
            </article>
          ))
        )}
      </section>
    </>
  );
}

export default function Page({ searchParams }: { searchParams: Promise<{ group?: string }> }) {
  return (
    <PageShell>
      <Suspense fallback={<div className={`${card} p-8 text-[var(--ev-muted)]`}>Loading notifications…</div>}>
        <Content searchParams={searchParams} />
      </Suspense>
    </PageShell>
  );
}
