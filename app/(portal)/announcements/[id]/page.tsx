import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireEmployee } from "@/lib/auth/require-employee";
import { ArrowLeft, ThumbsUp, ThumbsDown, Trash2 } from "lucide-react";
import { voteMemo, deleteMemo } from "../actions";
import MemoBrandHeader from "../MemoBrandHeader";

type Memo = {id:string;title:string;body:string;senderId:string|null;senderName:string;senderRole:string;publishedAt:Date};
type Count = {value:number; amount:bigint};
type Vote = {value:number};
type NamedVote = {employeeId:string;fullName:string;role:string;value:number;votedAt:Date};
export default async function MemoDetail({params}:{params:Promise<{id:string}>}) {
  await connection();
  const auth=await requireEmployee();
  const employee=await prisma.employeeProfile.findUnique({where:{authUserId:auth.id},select:{id:true,role:true,status:true}});
  if(!employee || employee.status!=="ACTIVE") notFound();
  const {id}=await params;
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();
  const rows=await prisma.$queryRaw<Memo[]>(Prisma.sql`
    SELECT "id", "title", "body", "senderId", "senderName", "senderRole", "publishedAt"
    FROM public."InternalMemo" WHERE "id"=${id}::uuid LIMIT 1
  `);
  const memo=rows[0];if(!memo)notFound();
  const [counts,votes,names]=await Promise.all([
    prisma.$queryRaw<Count[]>(Prisma.sql`SELECT "value",count(*)::bigint AS amount FROM public."InternalMemoVote" WHERE "memoId"=${id}::uuid GROUP BY "value"`),
    prisma.$queryRaw<Vote[]>(Prisma.sql`SELECT "value" FROM public."InternalMemoVote" WHERE "memoId"=${id}::uuid AND "employeeId"=${employee.id}::uuid LIMIT 1`),
    employee.role==="SUPER_ADMIN" ? prisma.$queryRaw<NamedVote[]>(Prisma.sql`
      SELECT v."employeeId",e."fullName",e."role"::text AS "role",v."value",v."votedAt"
      FROM public."InternalMemoVote" v JOIN public."EmployeeProfile" e ON e."id"=v."employeeId"
      WHERE v."memoId"=${id}::uuid ORDER BY v."votedAt" DESC
    `):Promise.resolve([] as NamedVote[]),
  ]);
  const up=Number(counts.find(c=>c.value===1)?.amount??BigInt(0));
  const down=Number(counts.find(c=>c.value===-1)?.amount??BigInt(0));
  const mine=votes[0]?.value??0;
  const when=new Intl.DateTimeFormat("en-KE",{dateStyle:"long",timeStyle:"short",timeZone:"Africa/Nairobi"}).format(memo.publishedAt);
  const mayDelete=employee.role==="SUPER_ADMIN" || memo.senderId===employee.id;
  return <main className="mx-auto w-full max-w-4xl px-4 py-7 text-[var(--ev-ink)] sm:px-7">
    <Link href="/announcements" className="inline-flex items-center gap-2 text-sm font-semibold text-[#1688B5] dark:text-[#83D7EF]"><ArrowLeft size={16}/> All internal memos</Link>
    <article className="mt-6 rounded-3xl border border-[var(--ev-border)] bg-[var(--ev-surface)] p-6 shadow-sm sm:p-10">
      <MemoBrandHeader/>
      <h1 className="mt-6 text-2xl font-bold leading-snug sm:text-3xl">{memo.title}</h1>
      <div className="mt-5 border-b border-[var(--ev-border)] pb-5 text-sm leading-7 text-[var(--ev-muted)]">
        <div>From <strong className="text-[var(--ev-ink)]">{memo.senderName}</strong> · {memo.senderRole.replaceAll("_"," ")}</div><time>{when}</time>
      </div>
      <div className="mt-7 whitespace-pre-wrap break-words text-[15px] leading-8">{memo.body}</div>
      <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-[var(--ev-border)] pt-6">
        <form action={voteMemo}><input type="hidden" name="id" value={id}/><input type="hidden" name="vote" value={mine===1?0:1}/><button type="submit" aria-pressed={mine===1} className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 font-semibold ${mine===1?"border-[#7956AF] bg-[#7956AF] text-white":"border-[var(--ev-border)] bg-[var(--ev-surface-2)]"}`}><ThumbsUp size={16}/> Upvote · {up}</button></form>
        <form action={voteMemo}><input type="hidden" name="id" value={id}/><input type="hidden" name="vote" value={mine===-1?0:-1}/><button type="submit" aria-pressed={mine===-1} className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 font-semibold ${mine===-1?"border-[#7956AF] bg-[#7956AF] text-white":"border-[var(--ev-border)] bg-[var(--ev-surface-2)]"}`}><ThumbsDown size={16}/> Downvote · {down}</button></form>
      </div>
      {mayDelete&&<form action={deleteMemo} className="mt-8 rounded-2xl border border-red-500/35 bg-red-500/5 p-5">
        <p className="text-sm font-bold">Permanently delete this memo</p>
        <p className="mt-1 text-xs leading-6 text-[var(--ev-muted)]">This removes it for every employee, including its votes and linked notifications. It cannot be restored from the portal.</p>
        <input type="hidden" name="id" value={id}/>
        <label className="mt-3 block text-sm">Type DELETE to confirm<input name="confirm" required pattern="DELETE" placeholder="DELETE" autoComplete="off" className="mt-2 block min-h-11 w-full max-w-xs rounded-lg border border-[var(--ev-border)] bg-[var(--ev-surface-2)] px-3"/></label>
        <button type="submit" className="mt-3 inline-flex items-center gap-2 rounded-lg bg-red-700 px-4 py-2.5 text-sm font-semibold text-white"><Trash2 size={16}/> Delete memo permanently</button>
      </form>}
    </article>
    {employee.role==="SUPER_ADMIN"&&<section className="mt-6 rounded-2xl border border-[var(--ev-border)] bg-[var(--ev-surface)] p-6">
      <h2 className="text-lg font-bold">Voter identities · Super Admin only</h2>
      <p className="mt-1 text-xs text-[var(--ev-muted)]">{up} upvotes · {down} downvotes</p>
      <div className="mt-4 space-y-2">{names.length?names.map(v=><div key={v.employeeId} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[var(--ev-surface-2)] p-3 text-sm"><div><strong>{v.fullName}</strong><span className="ml-2 text-xs text-[var(--ev-muted)]">{v.role.replaceAll("_"," ")}</span></div><span className={v.value===1?"font-semibold text-[#1688B5] dark:text-[#83D7EF]":"font-semibold text-[#7956AF] dark:text-[#C4A9F4]"}>{v.value===1?"Upvoted":"Downvoted"}</span></div>):<p className="text-sm text-[var(--ev-muted)]">No votes yet.</p>}</div>
    </section>}
  </main>;
}
