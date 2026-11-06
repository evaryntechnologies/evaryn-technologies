import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireEmployee } from "@/lib/auth/require-employee";
import { ArrowLeft, BookOpen } from "lucide-react";

type Memo = { id:string; title:string; body:string; senderName:string; senderRole:string; publishedAt:Date };
export default async function MemoDetail({params}:{params:Promise<{id:string}>}) {
  await connection();
  const auth = await requireEmployee();
  const employee = await prisma.employeeProfile.findUnique({where:{authUserId:auth.id},select:{status:true}});
  if (!employee || employee.status !== "ACTIVE") notFound();
  const {id} = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();
  const rows = await prisma.$queryRaw<Memo[]>(Prisma.sql`SELECT "id", "title", "body", "senderName", "senderRole", "publishedAt" FROM public."InternalMemo" WHERE "id"=${id}::uuid LIMIT 1`);
  const memo = rows[0]; if (!memo) notFound();
  const when = new Intl.DateTimeFormat("en-KE",{dateStyle:"long",timeStyle:"short",timeZone:"Africa/Nairobi"}).format(memo.publishedAt);
  return <main className="mx-auto w-full max-w-4xl px-4 py-7 text-[var(--ev-ink)] sm:px-7"><Link href="/announcements" className="inline-flex items-center gap-2 text-sm font-semibold text-[#1688B5] dark:text-[#83D7EF]"><ArrowLeft size={16}/> All internal memos</Link><article className="mt-6 rounded-3xl border border-[var(--ev-border)] bg-[var(--ev-surface)] p-6 shadow-sm sm:p-10"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#7956AF] dark:text-[#C4A9F4]"><BookOpen size={17}/> Internal memo</p><h1 className="mt-4 text-2xl font-bold leading-snug sm:text-3xl">{memo.title}</h1><div className="mt-5 border-b border-[var(--ev-border)] pb-5 text-sm leading-7 text-[var(--ev-muted)]"><div>From <strong className="text-[var(--ev-ink)]">{memo.senderName}</strong> · {memo.senderRole.replaceAll("_"," ")}</div><time>{when}</time></div><div className="mt-7 whitespace-pre-wrap break-words text-[15px] leading-8">{memo.body}</div></article></main>;
}
