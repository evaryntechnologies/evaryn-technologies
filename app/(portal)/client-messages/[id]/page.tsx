import ClientOrderChatThread from "@/components/client/ClientOrderChatThread";
import OrderMessageComposer from "@/components/client/OrderMessageComposer";
import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Paperclip } from "lucide-react";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@/generated/prisma/client";
import { listClientMessages, listClientAttachments } from "@/lib/client-communication";
import { loadClientThreads, ClientThreadList } from "../list";
import { PageFrame, PageTitle, Pill, SplitView, btn, pretty } from "@/app/(portal)/layouts";

export default async function Conversation({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  await requireEmployee(["QA", "ADMIN", "SUPER_ADMIN"]);
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const order = await prisma.$queryRaw<{ id: string; clientOrderCode: string | null; title: string; details: string; status: string; clientName: string; taskId: string | null; workerId: string | null }[]>(Prisma.sql`
    SELECT r."id",r."clientOrderCode",r."title",r."details",r."status"::text AS "status",c."fullName" AS "clientName",l."taskId",t."publicTaskId" AS "workerId"
    FROM public."ClientProjectRequest" r JOIN public."ClientProfile" c ON c."id"=r."clientId"
    LEFT JOIN public."ClientOrderLink" l ON l."requestId"=r."id" LEFT JOIN public."WorkTask" t ON t."id"=l."taskId"
    WHERE r."id"=${id}::uuid LIMIT 1`);
  if (!order[0]) notFound();
  const o = order[0];
  const [messages, files, rows] = await Promise.all([listClientMessages(id), listClientAttachments(id), loadClientThreads("")]);
  const loose = files.filter((f) => !f.messageId);

  return (
    <PageFrame>
      <PageTitle eyebrow="Client management" title="Client messages" description="Shared inbox for QA, Admin and Super Admin. Every conversation belongs to one order." />
      <SplitView label="Client messages" hasDetail
        list={<ClientThreadList rows={rows} activeId={id} q="" />}
        detail={
          <>
            <Link href="/portal/client-messages" className="evx-back evx-only-mobile"><ArrowLeft size={15} aria-hidden="true" />All conversations</Link>
            <div className="evx-msg-head">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}><Pill tone="blue">{pretty(o.status)}</Pill><span className="evx-id">{o.clientOrderCode ?? o.id.slice(0, 8)}</span></div>
              <h1>{o.title}</h1>
              <p className="evx-meta">Client: {o.clientName} · Worker ID: {o.workerId ?? "Not created"}</p>
              {o.taskId && <div><Link href={`/portal/admin/task-management/edit/${o.taskId}`} className={`${btn.ghost} ${btn.sm}`}><ExternalLink size={13} aria-hidden="true" />View production task</Link></div>}
            </div>
            <details className="evx-more" style={{ border: "1px solid var(--evx-line)", borderRadius: 12, padding: 14 }}>
              <summary>Order brief</summary>
              <p className="evx-prose" style={{ marginTop: 10, fontSize: 14, lineHeight: 1.75 }}>{o.details}</p>
            </details>
            {loose.length > 0 && (
              <div className="evx-block"><h4>Order files</h4>
                <div style={{ display: "grid", gap: 6 }}>{loose.map((f) => <a key={f.id} href={`/api/client-order-attachments/${f.id}`} className="evx-kpi-cta" style={{ padding: 0, wordBreak: "break-all" }}><Paperclip size={13} aria-hidden="true" />{f.fileName}</a>)}</div>
              </div>
            )}
            <section aria-label="Conversation">
              <h2 className="evx-section-title">Conversation</h2>
              <ClientOrderChatThread messages={messages} attachments={files} />
              <OrderMessageComposer requestId={id} staff />
            </section>
          </>
        } />
    </PageFrame>
  );
}
