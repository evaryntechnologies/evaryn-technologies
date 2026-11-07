import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { ArrowLeft, Inbox, Mail } from "lucide-react";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";
import { updateInquiry } from "./actions";
import { PageFrame, PageTitle, Pill, SplitItem, SplitPlaceholder, SplitView, btn, fmtDateTime, pretty, type EvTone } from "@/app/(portal)/layouts";

const tone = (s: string): EvTone => (s === "NEW" ? "cyan" : s === "IN_DISCUSSION" ? "amber" : "slate");
const short = (d: Date) => d.toLocaleDateString("en-KE", { timeZone: "Africa/Nairobi", day: "numeric", month: "short" });

async function Content({ searchParams }: { searchParams: Promise<{ id?: string; status?: string }> }) {
  await connection();
  await requireEmployee(["SUPER_ADMIN"]);
  const sp = await searchParams;
  const [clients, custom] = await Promise.all([
    prisma.clientInquiry.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.customServiceRequest.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
  ]);
  const all = [
    ...clients.map((i) => ({ id: i.id, kind: "client", name: i.name, email: i.email, title: i.service, details: i.details, status: i.status as string, createdAt: i.createdAt })),
    ...custom.map((i) => ({ id: i.id, kind: "custom", name: i.name, email: i.email, title: i.requestTitle, details: i.details, status: i.status as string, createdAt: i.createdAt })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const filter = ["NEW", "IN_DISCUSSION", "CLOSED"].includes(sp.status ?? "") ? sp.status! : "";
  const items = filter ? all.filter((i) => i.status === filter) : all;
  const selected = all.find((i) => i.kind + ":" + i.id === sp.id);
  const href = (key: string) => `/portal/super-admin/inquiries?id=${encodeURIComponent(key)}${filter ? `&status=${filter}` : ""}`;
  const count = (s: string) => all.filter((i) => i.status === s).length;

  return (
    <PageFrame>
      <PageTitle eyebrow="Super Admin" title="Client inquiries" description="Website inquiries and custom service requests."
        actions={<><Pill tone="cyan">{count("NEW")} new</Pill><Pill tone="amber">{count("IN_DISCUSSION")} in discussion</Pill></>} />
      <SplitView label="Client inquiries" hasDetail={!!selected}
        list={
          <>
            <div className="evx-split-tools">
              <nav className="evx-tabs" aria-label="Filter by status" style={{ width: "100%" }}>
                {[["", "All"], ["NEW", "New"], ["IN_DISCUSSION", "Open"], ["CLOSED", "Closed"]].map(([v, l]) => (
                  <Link key={l} href={v ? `/portal/super-admin/inquiries?status=${v}` : "/portal/super-admin/inquiries"} className="evx-tab" aria-current={filter === v ? "page" : undefined} style={{ flex: 1, justifyContent: "center", padding: "6px 8px" }}>{l}</Link>
                ))}
              </nav>
            </div>
            <div className="evx-split-scroll">
              {items.length === 0 ? <p className="evx-meta" style={{ padding: 24, textAlign: "center" }}>No inquiries here.</p> : items.map((i) => (
                <SplitItem key={i.kind + i.id} href={href(i.kind + ":" + i.id)} active={selected?.id === i.id && selected.kind === i.kind} tone={tone(i.status)}
                  title={i.title} top={<Pill tone={tone(i.status)}>{pretty(i.status)}</Pill>} time={short(i.createdAt)} snippet={`${i.name} · ${i.details}`} />
              ))}
            </div>
          </>
        }
        detail={selected ? (
          <>
            <Link href="/portal/super-admin/inquiries" className="evx-back evx-only-mobile"><ArrowLeft size={15} aria-hidden="true" />All inquiries</Link>
            <div className="evx-msg-head">
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><Pill tone={tone(selected.status)}>{pretty(selected.status)}</Pill><Pill tone="slate" plain>{selected.kind === "custom" ? "Custom request" : "Service inquiry"}</Pill></div>
              <h1>{selected.title}</h1>
              <p className="evx-meta">{selected.name} · <a href={`mailto:${selected.email}`} style={{ color: "var(--ev-accent-text)" }}>{selected.email}</a> · received {fmtDateTime(selected.createdAt)}</p>
            </div>
            <p className="evx-prose" style={{ maxWidth: 70 + "ch" }}>{selected.details}</p>
            <form action={updateInquiry} className="evx-panel" style={{ maxWidth: 460 }}>
              <h3>Update status</h3>
              <input type="hidden" name="id" value={selected.id} /><input type="hidden" name="kind" value={selected.kind} />
              <div style={{ display: "flex", gap: 10 }}>
                <select name="status" defaultValue={selected.status} className="evx-select" aria-label="Inquiry status"><option value="NEW">New</option><option value="IN_DISCUSSION">In discussion</option><option value="CLOSED">Closed</option></select>
                <button className={btn.primary}>Save</button>
              </div>
              <a href={`mailto:${selected.email}?subject=${encodeURIComponent("Re: " + selected.title)}`} className={`${btn.ghost} ${btn.sm}`} style={{ justifySelf: "start" }}><Mail size={14} aria-hidden="true" />Reply by email</a>
            </form>
          </>
        ) : <SplitPlaceholder icon={Inbox} title="Select an inquiry" text="Choose an inquiry on the left to read it and update its status." />} />
    </PageFrame>
  );
}

export default function Page(p: { searchParams: Promise<{ id?: string; status?: string }> }) {
  return <Suspense fallback={<div className="evx-page"><div className="evx-card evx-card-pad evx-muted">Loading inquiries…</div></div>}><Content {...p} /></Suspense>;
}
