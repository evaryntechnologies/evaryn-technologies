import Link from "next/link";
import { notFound } from "next/navigation";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@/generated/prisma/client";
import { listClientMessages,listClientAttachments } from "@/lib/client-communication";
import { replyToClient } from "../actions";
export default async function Conversation({params}:{params:Promise<{id:string}>}){
 await requireEmployee(["QA","ADMIN","SUPER_ADMIN"]);const {id}=await params;
 const order=await prisma.$queryRaw<{id:string;clientOrderCode:string|null;title:string;details:string;status:string;clientName:string;taskId:string|null;workerId:string|null}[]>(Prisma.sql`
 SELECT r."id",r."clientOrderCode",r."title",r."details",r."status"::text AS "status",c."fullName" AS "clientName",l."taskId",t."publicTaskId" AS "workerId"
 FROM public."ClientProjectRequest" r JOIN public."ClientProfile" c ON c."id"=r."clientId"
 LEFT JOIN public."ClientOrderLink" l ON l."requestId"=r."id" LEFT JOIN public."WorkTask" t ON t."id"=l."taskId"
 WHERE r."id"=${id}::uuid LIMIT 1`);
 if(!order[0])notFound();const o=order[0];
 const [messages,files]=await Promise.all([listClientMessages(id),listClientAttachments(id)]);
 return <main className="mx-auto max-w-4xl px-5 py-10"><Link className="text-cyan-500 underline" href="/portal/client-messages">Back to Client Messages</Link><h1 className="mt-4 text-3xl font-bold">{o.clientOrderCode??o.id.slice(0,8)} — {o.title}</h1><p className="mt-2 text-sm opacity-75">Client: {o.clientName} · {o.status.replaceAll('_',' ')} · Worker ID: {o.workerId??"Not created"}</p><p className="mt-5 whitespace-pre-wrap rounded-xl border p-4">{o.details}</p>
 {o.taskId&&<Link href={`/portal/admin/task-management/edit/${o.taskId}`} className="mt-3 inline-block text-cyan-500 underline">View production task</Link>}
 <section className="mt-8"><h2 className="text-xl font-bold">Conversation</h2><div className="mt-4 grid gap-3">{messages.map(m=><article key={m.id} className="rounded-xl border p-4"><strong>{m.senderKind==="CLIENT"?"Client":"Evaryn team"}</strong><span className="ml-2 text-xs opacity-70">{new Date(m.createdAt).toLocaleString()}</span><p className="mt-2 whitespace-pre-wrap">{m.body}</p></article>)}</div></section>
 {files.length>0&&<section className="mt-8"><h2 className="text-lg font-bold">Files</h2>{files.map(f=><p key={f.id}><a href={`/api/client-order-attachments/${f.id}`} className="text-cyan-500 underline">{f.fileName}</a></p>)}</section>}
 <form action={replyToClient} className="mt-8 grid gap-3"><input type="hidden" name="requestId" value={id}/><label>Reply to client<textarea name="message" required maxLength={5000} rows={5} className="mt-2 w-full rounded-xl border p-3 text-slate-900"/></label><button className="rounded-xl bg-[#7956AF] px-5 py-3 font-bold text-white">Send reply</button></form></main>;
}
