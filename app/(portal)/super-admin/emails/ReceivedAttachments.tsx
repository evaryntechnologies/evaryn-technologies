import { prisma } from "@/lib/db/prisma";
import { listIncomingAttachments } from "@/lib/evaryn-email/inbound-repair";

type InboundRow = { id: string };
export default async function ReceivedAttachments({ emailId }: { emailId: string }) {
  // The parent page has already enforced Super Admin permissions.
  const rows = await prisma.$queryRaw<InboundRow[]>`select id from public."EvarynEmail" where id=${emailId} and direction='INBOUND' limit 1`;
  if (!rows.length) return null;
  try {
    const attachments = await listIncomingAttachments(emailId);
    if (!attachments.length) return null;
    return <div className="mt-4 rounded-lg border border-cyan-400/20 bg-[#0C2948] p-3">
      <p className="mb-2 text-sm font-semibold text-cyan-200">Attachments ({attachments.length})</p>
      <ul className="space-y-2">{attachments.map(file =>
        <li key={file.id}><a className="break-all text-sm text-cyan-300 underline hover:text-white" href={`/api/portal/company-email/attachment/${encodeURIComponent(emailId)}/${encodeURIComponent(file.id)}`} target="_blank" rel="noopener noreferrer">📎 {file.filename || "Attachment"}</a>{typeof file.size === "number" && <span className="ml-2 text-xs text-slate-400">({Math.ceil(file.size / 1024)} KB)</span>}</li>
      )}</ul>
    </div>;
  } catch (error) {
    console.error("Evaryn attachment list failed", { emailId, error });
    return <p className="mt-3 text-sm text-amber-200">Attachments could not be loaded from Resend. Check the API key and Vercel logs.</p>;
  }
}
