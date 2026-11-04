import { Suspense } from "react";
import { connection } from "next/server";
import { Send, Link2, PackageCheck, Users } from "lucide-react";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireEmployee } from "@/lib/auth/require-employee";
import { PageShell, PageHeader, Pill, EmptyState, Metric, card, inputCls, textareaCls, btnPrimary, btnGhost, dateTimeFmt } from "@/app/(portal)/ui";
import { listAvailableClientRequests } from "@/lib/client-communication";
import { linkOrderToClient, sendToClient } from "./actions";

type Row = {
  id: string; publicTaskId: string | null; title: string; category: string | null; status: string;
  updatedAt: Date; clientId: string | null; deliveredAt: Date | null; clientRating: number | null;
};

async function Content() {
  await connection();
  await requireEmployee(["QA", "ADMIN", "SUPER_ADMIN"]);
  const [rows, clients, availableRequests] = await Promise.all([
    prisma.$queryRaw<Row[]>(Prisma.sql`
      SELECT t."id", t."publicTaskId", t."title", t."category", t."status", t."updatedAt", t."clientRating",
             l."clientId", l."deliveredAt"
      FROM public."WorkTask" t
      LEFT JOIN public."ClientOrderLink" l ON l."taskId" = t."id"
      WHERE t."status" NOT IN ('DRAFT','DELETED','CANCELED','CANCELLED')
      ORDER BY t."updatedAt" DESC LIMIT 400`),
    prisma.clientProfile.findMany({
      where: { status: "ACTIVE" }, orderBy: { fullName: "asc" },
      select: { id: true, fullName: true, companyName: true, email: true },
    }),
    listAvailableClientRequests(),
  ]);
  const label = new Map(clients.map((c) => [c.id, `${c.fullName}${c.companyName ? ` · ${c.companyName}` : ""}`]));
  const ready = rows.filter((r) => r.status === "DELIVERED_AWAITING_CLIENT" && !r.deliveredAt);
  const withClient = rows.filter((r) => r.status === "DELIVERED_AWAITING_CLIENT" && r.deliveredAt);
  const linkable = rows.filter((r) => !["DELIVERED_AWAITING_CLIENT", "COMPLETED"].includes(r.status)).slice(0, 150);

  const clientSelect = (name: string, value: string | null, required = false) => (
    <select name={name} defaultValue={value ?? ""} required={required} className={inputCls}>
      <option value="">{required ? "Choose a client…" : "Not linked"}</option>
      {clients.map((c) => <option key={c.id} value={c.id}>{c.fullName}{c.companyName ? ` · ${c.companyName}` : ""} ({c.email})</option>)}
    </select>
  );

  return (
    <>
      <PageHeader
        eyebrow="Client operations"
        title="Client orders & delivery"
        subtitle="Link orders to the client who requested them so the client can follow progress, then send QA-approved orders to the client's Delivered page."
      />
      <section className="mb-8 grid gap-4 sm:grid-cols-3">
        <Metric label="Ready to send" value={ready.length} accent="#7a4fc0" note="Passed QA, not yet with the client" />
        <Metric label="With the client" value={withClient.length} accent="#00b0f8" note="Delivered, awaiting their response" />
        <Metric label="Active clients" value={clients.length} accent="#0a47a8" />
      </section>

      <h2 className="mb-3 flex items-center gap-2 text-xl font-bold"><Send size={20} aria-hidden="true" /> Ready to send</h2>
      {ready.length === 0 ? (
        <EmptyState icon={PackageCheck} title="Nothing waiting" text="Orders appear here as soon as QA approves them." />
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {ready.map((r) => (
            <article key={r.id} className={`${card} p-5`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[var(--ev-muted)]">{r.publicTaskId ?? r.id.slice(0, 8)} · {r.category ?? "General"}</p>
                  <h3 className="mt-1 text-lg font-bold leading-snug">{r.title}</h3>
                </div>
                <Pill tone="violet">Passed QA</Pill>
              </div>
              <form action={sendToClient} className="mt-4 grid gap-3">
                <input type="hidden" name="taskId" value={r.id} />
                <label className="grid gap-1.5 text-sm font-semibold">Client {clientSelect("clientId", r.clientId, true)}</label>
                <label className="grid gap-1.5 text-sm font-semibold">Delivery note for the client (optional)
                  <textarea name="note" rows={3} maxLength={3000} placeholder="Anything the client should know about this delivery" className={textareaCls} />
                </label>
                <div><button className={btnPrimary}><Send size={16} aria-hidden="true" /> Send to client</button></div>
              </form>
            </article>
          ))}
        </div>
      )}

      <h2 className="mb-3 mt-12 flex items-center gap-2 text-xl font-bold"><Users size={20} aria-hidden="true" /> With the client</h2>
      {withClient.length === 0 ? (
        <EmptyState icon={PackageCheck} title="No deliveries awaiting a response" text="Delivered orders show here until the client's outcome is recorded in Client Actions." />
      ) : (
        <div className={`${card} divide-y divide-[var(--ev-border-soft)] overflow-hidden`}>
          {withClient.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div className="min-w-0">
                <p className="font-semibold">{r.title}</p>
                <p className="text-xs text-[var(--ev-muted)]">{r.publicTaskId ?? r.id.slice(0, 8)} · {r.clientId ? label.get(r.clientId) ?? "Client" : "Client"} · sent {r.deliveredAt ? dateTimeFmt(r.deliveredAt) : ""}</p>
              </div>
              <div className="flex items-center gap-2">
                {r.clientRating ? <Pill tone="green">Rated {r.clientRating}/5</Pill> : <Pill tone="amber">Not rated yet</Pill>}
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 className="mb-1 mt-12 flex items-center gap-2 text-xl font-bold"><Link2 size={20} aria-hidden="true" /> Link orders to clients</h2>
      <p className="mb-3 text-sm text-[var(--ev-muted)]">Once linked, the client sees the order's stage (Tasking, Review, QA) on their dashboard. Linking can be changed until the order is delivered.</p>
      {linkable.length === 0 ? (
        <EmptyState icon={Link2} title="No active orders" text="Orders in progress appear here." />
      ) : (
        <div className={`${card} divide-y divide-[var(--ev-border-soft)] overflow-hidden`}>
          {linkable.map((r) => (
            <form key={r.id} action={linkOrderToClient} className="grid items-center gap-3 px-5 py-4 lg:grid-cols-[1fr_minmax(240px,340px)_auto]">
              <input type="hidden" name="taskId" value={r.id} />
              <div className="min-w-0">
                <p className="font-semibold">{r.title}</p>
                <p className="text-xs text-[var(--ev-muted)]">{r.publicTaskId ?? r.id.slice(0, 8)} · {r.category ?? "General"} · {r.status.replaceAll("_", " ").toLowerCase()}</p>
              </div>
              {clientSelect("clientId", r.clientId)}
              <label className="text-xs">Link to original client request (optional)<select name="requestId" defaultValue="" className={inputCls}><option value="">No request selected</option>{availableRequests.map(req=><option key={req.id} value={req.id}>{req.clientOrderCode} — {req.title}</option>)}</select></label>
              <button className={btnGhost}>Save</button>
            </form>
          ))}
        </div>
      )}
    </>
  );
}

export default function Page() {
  return (
    <PageShell>
      <Suspense fallback={<div className={`${card} p-8 text-[var(--ev-muted)]`}>Loading client orders…</div>}>
        <Content />
      </Suspense>
    </PageShell>
  );
}
