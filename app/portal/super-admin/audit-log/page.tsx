import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";

type AuditRow = {
  id: string;
  actorAuthUserId: string;
  action: string;
  entityType: string;
  entityId: string | null;
  details: unknown;
  createdAt: Date;
  actorName: string | null;
  actorEmail: string | null;
};

async function AuditContent() {
  await connection();

  const admin = await requireEmployee(["SUPER_ADMIN"]);

  if (admin.role !== "SUPER_ADMIN") {
    return <p>Super Admin access required.</p>;
  }

  const events = await prisma.$queryRaw<AuditRow[]>`
    SELECT
      a."id",
      a."actorAuthUserId",
      a."action",
      a."entityType",
      a."entityId",
      a."details",
      a."createdAt",
      e."fullName" AS "actorName",
      e."email" AS "actorEmail"
    FROM public."AdminAuditLog" a
    LEFT JOIN public."EmployeeProfile" e
      ON e."authUserId" = a."actorAuthUserId"
    ORDER BY a."createdAt" DESC, a."id" DESC
    LIMIT 100
  `;

  return (
    <main className="min-h-screen bg-[#071327] px-5 py-9 text-white sm:px-10">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/portal/super-admin"
          className="text-sm font-semibold text-cyan-300 hover:underline"
        >
          Back to Super Admin
        </Link>

        <header className="mt-8">
          <p className="text-xs font-bold tracking-widest text-cyan-300">
            EVARYN TECHNOLOGIES LIMITED
          </p>

          <h1 className="mt-4 text-3xl font-bold">
            Administrative Audit Log
          </h1>

          <p className="mt-3 text-sm leading-7 text-slate-300">
            Review recorded administrative activity and account changes.
          </p>
        </header>

        <section className="mt-8 rounded-2xl border border-white/10 bg-[#101F39] p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold">Recent Activity</h2>
            <span className="text-xs text-slate-400">
              Showing {events.length} events
            </span>
          </div>

          {events.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-white/20 p-8 text-center">
              <h3 className="font-semibold">
                No Audit Events Recorded
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-300">
                Audit events will appear after administrative
                actions are connected to the logging system.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {events.map((event) => {
                const hasDetails =
                  event.details !== null &&
                  typeof event.details === "object" &&
                  Object.keys(event.details).length > 0;

                return (
                  <article
                    key={event.id}
                    className="rounded-xl border border-white/10 bg-[#071327] p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-cyan-300">
                          {event.action.replaceAll("_", " ")}
                        </h3>

                        <p className="mt-2 break-words text-sm text-slate-300">
                          {event.entityType}
                          {event.entityId ? ` — ${event.entityId}` : ""}
                        </p>
                      </div>

                      <time className="text-xs text-slate-400">
                        {new Date(event.createdAt).toLocaleString("en-KE", {
                          timeZone: "Africa/Nairobi",
                        })}
                      </time>
                    </div>

                    <p className="mt-4 text-xs text-slate-300">
                      Performed by:{" "}
                      {event.actorName ?? "Unknown employee"}
                      {event.actorEmail
                        ? ` (${event.actorEmail})`
                        : ""}
                    </p>

                    {hasDetails ? (
                      <pre className="mt-4 overflow-x-auto rounded-lg border border-white/10 p-3 text-xs text-slate-300">
                        {JSON.stringify(event.details, null, 2)}
                      </pre>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default function AuditLogPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#071327] p-8 text-slate-300">
          Loading audit log...
        </main>
      }
    >
      <AuditContent />
    </Suspense>
  );
}