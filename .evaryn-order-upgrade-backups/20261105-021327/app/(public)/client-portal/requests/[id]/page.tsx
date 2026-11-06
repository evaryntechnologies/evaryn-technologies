import { notFound } from "next/navigation";
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
  return (
    <main className="cp-page cp-narrow">
      <Link href="/client-portal" className="ev2-textlink" style={{ marginTop: 0 }}><ArrowLeft size={16} /> Back to overview</Link>
      <div className="cp-head"><div><h1 className="cp-title">{request.title}</h1><p className="cp-sub">{request.service} · Submitted {formatDate(request.createdAt)}</p></div><span className="cp-pill cp-pill--blue">{request.status.replaceAll("_", " ").toLowerCase()}</span></div>
      <div className="cp-panel"><h2 className="cp-h2">Your request</h2><p className="cp-prose">{request.details}</p></div>
      {request.adminNote && <div className="cp-panel cp-quote"><strong>Update from Evaryn</strong><p className="cp-prose">{request.adminNote}</p></div>}
    </main>
  );
}
