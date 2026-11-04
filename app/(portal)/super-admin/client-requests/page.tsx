import {Suspense} from "react";
import {connection} from "next/server";
import {Inbox} from "lucide-react";
import {requireEmployee} from "@/lib/auth/require-employee";
import {prisma} from "@/lib/db/prisma";
import {updateClientRequest} from "./actions";
import {PageShell, PageHeader, Pill, EmptyState, card, inputCls, textareaCls, btnPrimary, prettyStatus, dateFmt, type PillTone} from "../../ui";

const tone = (s: string): PillTone =>
  s === "ACCEPTED" ? "green" : s === "REJECTED" ? "rose" : s === "CLOSED" ? "slate" : s === "IN_DISCUSSION" ? "blue" : "amber";

async function ClientRequestQueue() {
  await connection();
  const user = await requireEmployee(["SUPER_ADMIN"]);
  if (user.role !== "SUPER_ADMIN") return null;
  const requests = await prisma.clientProjectRequest.findMany({
    include: {client: {select: {fullName: true, email: true, companyName: true}}},
    orderBy: {createdAt: "desc"},
    take: 100,
  });
  return (
    <PageShell>
      <PageHeader
        eyebrow="Super Admin"
        title="Client project requests"
        subtitle="Requests received through Work With Us. Update the status and leave a note the client can see."
        back={{href: "/portal/super-admin", label: "Dashboard"}}
        actions={<Pill tone="cyan">{requests.length} request{requests.length === 1 ? "" : "s"}</Pill>}
      />
      {!requests.length ? (
        <EmptyState icon={Inbox} title="No client requests yet" text="New requests from the public website will appear here." />
      ) : (
        <div className="grid gap-5">
          {requests.map((r) => (
            <article key={r.id} className={`${card} p-6`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold">{r.title}</h2>
                  <p className="mt-1 text-sm text-[var(--ev-muted)]">
                    {r.client.fullName} · {r.client.companyName || "Individual"} · {r.client.email}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-[var(--ev-muted)]">{r.service} · {dateFmt(r.createdAt)}</p>
                </div>
                <Pill tone={tone(r.status)}>{prettyStatus(r.status)}</Pill>
              </div>
              <p className="mt-4 whitespace-pre-wrap rounded-xl bg-[var(--ev-inset)] p-4 text-sm leading-7">{r.details}</p>
              <form action={updateClientRequest} className="mt-5 grid gap-4 border-t border-[var(--ev-border-soft)] pt-5 md:grid-cols-[220px_1fr]">
                <input type="hidden" name="id" value={r.id} />
                <label className="grid content-start gap-2 text-sm font-semibold">
                  Status
                  <select name="status" defaultValue={r.status} className={inputCls}>
                    <option value="PENDING_REVIEW">Pending review</option>
                    <option value="IN_DISCUSSION">In discussion</option>
                    <option value="ACCEPTED">Accepted</option>
                    <option value="CLOSED">Closed</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-semibold">
                  Update visible to client
                  <textarea name="adminNote" rows={3} maxLength={4000} defaultValue={r.adminNote || ""} className={textareaCls} />
                </label>
                <div className="md:col-span-2"><button className={btnPrimary}>Save update</button></div>
              </form>
            </article>
          ))}
        </div>
      )}
    </PageShell>
  );
}

export default function Page() {
  return <Suspense fallback={<p className="p-8">Loading client requests…</p>}><ClientRequestQueue /></Suspense>;
}
