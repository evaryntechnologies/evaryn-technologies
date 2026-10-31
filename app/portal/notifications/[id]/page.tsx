import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Check, ExternalLink } from "lucide-react";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";
import { markNotificationRead } from "../actions";
import { PageShell, PageHeader, Pill, card, btnGhost, btnPrimary, dateTimeFmt } from "@/app/portal/ui";

export default async function NotificationDetail({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const auth = await requireEmployee();
  const employee = await prisma.employeeProfile.findUnique({ where: { authUserId: auth.id }, select: { id: true } });
  if (!employee) notFound();
  const notification = await prisma.portalNotification.findFirst({ where: { id, recipientId: employee.id } });
  if (!notification) notFound();
  const related =
    notification.href?.startsWith("/portal/") && !notification.href.startsWith("//") ? notification.href : null;

  return (
    <PageShell>
      <div className="mx-auto max-w-3xl">
        <PageHeader back={{ href: "/portal/notifications", label: "All notifications" }} eyebrow="Notification" title={notification.title} subtitle={dateTimeFmt(notification.createdAt)} />
        <article className={`${card} p-6 sm:p-8`}>
          <div className="mb-4 flex items-center gap-2">
            {notification.readAt ? <Pill tone="slate">Read</Pill> : <Pill tone="cyan">New</Pill>}
          </div>
          <p className="whitespace-pre-wrap break-words leading-8">{notification.body}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            {!notification.readAt && (
              <form action={markNotificationRead}>
                <input type="hidden" name="id" value={notification.id} />
                <button className={btnPrimary}><Check size={15} aria-hidden="true" /> Mark as read</button>
              </form>
            )}
            {related && (
              <Link href={related} className={btnGhost}>
                <ExternalLink size={14} aria-hidden="true" /> Open related page
              </Link>
            )}
          </div>
          {related && (
            <p className="mt-4 text-xs text-[var(--ev-muted)]">Older notifications may reference pages that have since moved.</p>
          )}
        </article>
      </div>
    </PageShell>
  );
}
