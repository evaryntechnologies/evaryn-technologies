import ClientOrderChatThread from "@/components/client/ClientOrderChatThread";
import OrderMessageComposer from "@/components/client/OrderMessageComposer";
import { listClientMessages, listClientAttachments } from "@/lib/client-communication";
import { sendClientMessage, terminateClientRequest } from "../../actions";
import { notFound } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { formatDate } from "@/lib/client-orders";
import { ensureClientProfile } from "../../../clients/actions";

export default async function RequestDetails({ params }: { params: Promise<{ id: string }> }) {
  const client = await ensureClientProfile();
  const { id } = await params;
  const request = await prisma.clientProjectRequest.findFirst({ where: { id, clientId: client.id } }).catch(() => null);
  if (!request) notFound();
  const codes=await prisma.$queryRaw<{clientOrderCode:string|null}[]>(Prisma.sql`SELECT "clientOrderCode" FROM public."ClientProjectRequest" WHERE "id"=${id}::uuid AND "clientId"=${client.id}::uuid`);
  const orderCode=codes[0]?.clientOrderCode??"Legacy order";
  const [messages, attachments] = await Promise.all([listClientMessages(id), listClientAttachments(id)]);
  return (
    <main className="cp-page cp-narrow">
      <Link href="/client-portal" className="ev2-textlink" style={{ marginTop: 0 }}><ArrowLeft size={16} /> Back to overview</Link>
      <div className="cp-head"><div><h1 className="cp-title">{orderCode} — {request.title}</h1><p className="cp-sub">{request.service} · Submitted {formatDate(request.createdAt)}</p></div><span className="cp-pill cp-pill--blue">{request.status.replaceAll("_", " ").toLowerCase()}</span></div>
      <div className="cp-panel"><h2 className="cp-h2">Your request</h2><p className="cp-prose">{request.details}</p></div>
      <div className="cp-panel"><h2 className="cp-h2">Messages about this order</h2><p className="text-sm">You can contact Evaryn at any stage of this project.</p>
        <ClientOrderChatThread messages={messages} attachments={attachments} />
        <OrderMessageComposer requestId={id} />
      </div>
      {attachments.some(a=>!a.messageId) && <div className="cp-panel"><h2 className="cp-h2">Order attachments</h2><ul className="space-y-2">{attachments.filter(a=>!a.messageId).map(a => <li key={a.id}><a className="underline" href={`/api/client-order-attachments/${a.id}`}>{a.fileName}</a></li>)}</ul></div>}
      {request.status !== "CLOSED" && <div className="cp-panel"><h2 className="cp-h2">End this project or contract</h2><p className="text-sm">You may end the project at any stage. A reason is required. Any payments or work already completed will be reviewed according to your agreement.</p><form action={terminateClientRequest} className="mt-3 grid gap-3"><input type="hidden" name="requestId" value={id}/><label>Reason for ending this project<textarea required minLength={10} maxLength={3000} name="reason" rows={3} className="w-full rounded-lg border p-3 text-slate-900"/></label><button className="rounded-lg bg-rose-800 p-3 font-semibold text-white">End project</button></form></div>}
      {request.adminNote && <div className="cp-panel cp-quote"><strong>Update from Evaryn</strong><p className="cp-prose">{request.adminNote}</p></div>}
    </main>
  );
}
