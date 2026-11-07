import { Suspense } from "react";
import { connection } from "next/server";
import { ScrollText } from "lucide-react";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";
import { Empty, Notice, PageFrame, PageTitle, Pill, Timeline, type EvTone, type TimelineEntry } from "@/app/(portal)/layouts";

type AuditRow = {
  id: string; actorAuthUserId: string; action: string; entityType: string; entityId: string | null;
  details: unknown; createdAt: Date; actorName: string | null; actorEmail: string | null;
};

/** Colour the node by the kind of change, so risky actions stand out when scanning. */
function toneFor(action: string): EvTone {
  const a = action.toUpperCase();
  if (/(DELETE|REMOVE|SUSPEND|REJECT|CANCEL|REVOKE|FORCE)/.test(a)) return "rose";
  if (/(APPROVE|PAID|PAYMENT|PAYOUT|SETTLE|VERIFY|CREATE|HIRE|RESTORE)/.test(a)) return "green";
  if (/(UPDATE|EDIT|CHANGE|ADJUST|REASSIGN|PUBLISH)/.test(a)) return "amber";
  return "cyan";
}

async function AuditContent() {
  await connection();
  const admin = await requireEmployee(["SUPER_ADMIN"]);
  if (admin.role !== "SUPER_ADMIN") return <PageFrame><Notice tone="amber">Super Admin access required.</Notice></PageFrame>;

  const events = await prisma.$queryRaw<AuditRow[]>`
    SELECT a."id", a."actorAuthUserId", a."action", a."entityType", a."entityId", a."details", a."createdAt",
           e."fullName" AS "actorName", e."email" AS "actorEmail"
    FROM public."AdminAuditLog" a
    LEFT JOIN public."EmployeeProfile" e ON e."authUserId" = a."actorAuthUserId"
    ORDER BY a."createdAt" DESC, a."id" DESC
    LIMIT 100
  `;

  const entries: TimelineEntry[] = events.map((event) => {
    const tone = toneFor(event.action);
    const hasDetails = event.details !== null && typeof event.details === "object" && Object.keys(event.details as object).length > 0;
    return {
      key: event.id,
      at: new Date(event.createdAt),
      tone,
      node: (
        <>
          <div className="evx-tl-head">
            <div style={{ minWidth: 0 }}>
              <h3 className="evx-tl-title">{event.action.replaceAll("_", " ")}</h3>
              <p className="evx-tl-sub">{event.entityType}{event.entityId ? ` · ${event.entityId}` : ""}</p>
            </div>
            <Pill tone={tone} plain>{event.entityType}</Pill>
          </div>
          <p className="evx-tl-sub" style={{ marginTop: 8 }}>By <strong>{event.actorName ?? "Unknown employee"}</strong>{event.actorEmail ? ` (${event.actorEmail})` : ""}</p>
          {hasDetails && (
            <details className="evx-more" style={{ border: 0, paddingTop: 8 }}>
              <summary>Technical details</summary>
              <pre className="evx-tl-pre">{JSON.stringify(event.details, null, 2)}</pre>
            </details>
          )}
        </>
      ),
    };
  });

  return (
    <PageFrame>
      <PageTitle
        eyebrow="Super Admin"
        title="Audit log"
        description="Recorded administrative activity and account changes, newest first."
        back={{ href: "/portal/super-admin", label: "Dashboard" }}
        actions={<Pill tone="slate" plain>Latest {events.length} events</Pill>}
      />
      {events.length === 0 ? (
        <Empty icon={ScrollText} title="No audit events recorded" text="Events will appear after administrative actions are connected to the logging system." />
      ) : (
        <Timeline entries={entries} label="Administrative audit timeline" />
      )}
    </PageFrame>
  );
}

export default function AuditLogPage() {
  return (
    <Suspense fallback={<div className="evx-page"><div className="evx-card evx-card-pad evx-muted">Loading audit log…</div></div>}>
      <AuditContent />
    </Suspense>
  );
}
