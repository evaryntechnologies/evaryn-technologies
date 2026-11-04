import Link from "next/link";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireEmployee } from "@/lib/auth/require-employee";
type Item={id:string;clientOrderCode:string|null;title:string;status:string;fullName:string;lastMessage:string|null;lastMessageAt:Date|null;messageCount:bigint};
export default async function ClientMessages(){
 await requireEmployee(["QA","ADMIN","SUPER_ADMIN"]);
 const rows=await prisma.$queryRaw<Item[]>(Prisma.sql`
 SELECT r."id",r."clientOrderCode",r."title",r."status"::text AS "status",c."fullName",
 (SELECT m."body" FROM public."ClientOrderMessage" m WHERE m."requestId"=r."id" ORDER BY m."createdAt" DESC LIMIT 1) AS "lastMessage",
 (SELECT m."createdAt" FROM public."ClientOrderMessage" m WHERE m."requestId"=r."id" ORDER BY m."createdAt" DESC LIMIT 1) AS "lastMessageAt",
 (SELECT count(*) FROM public."ClientOrderMessage" m WHERE m."requestId"=r."id") AS "messageCount"
 FROM public."ClientProjectRequest" r JOIN public."ClientProfile" c ON c."id"=r."clientId"
 WHERE EXISTS(SELECT 1 FROM public."ClientOrderMessage" m WHERE m."requestId"=r."id")
 ORDER BY "lastMessageAt" DESC LIMIT 200`);
 return <main className="mx-auto max-w-6xl px-5 py-10"><h1 className="text-3xl font-bold">Client Messages</h1><p className="mt-2 text-sm opacity-75">Shared inbox for QA, Admin and Super Admin. Every conversation belongs to one order.</p>
 <div className="mt-6 grid gap-3">{rows.map(r=><Link key={r.id} href={`/portal/client-messages/${r.id}`} className="rounded-xl border border-sky-400/30 bg-[#0B2441] p-5 text-white hover:border-[#7956AF]"><div className="flex flex-wrap items-center justify-between gap-2"><strong>{r.clientOrderCode??r.id.slice(0,8)} — {r.title}</strong><span className="text-xs text-cyan-200">{r.status.replaceAll('_',' ')} · {String(r.messageCount)} messages</span></div><p className="mt-2 text-sm text-sky-100">{r.fullName}: {r.lastMessage?.slice(0,240)}</p></Link>)}{!rows.length&&<p>No client messages yet.</p>}</div></main>;
}
