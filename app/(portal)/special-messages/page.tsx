import { connection } from "next/server";
import { MessagesSquare, Send } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { requireEmployee } from "@/lib/auth/require-employee";
import RecipientPicker from "@/components/special-messages/RecipientPicker";
import { startSpecialMessage } from "./actions";
import { loadThreads, ThreadList } from "./list";
import { Notice, PageFrame, PageTitle, SplitView, btn, field } from "@/app/(portal)/layouts";

export default async function SpecialMessagesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await connection();
  const auth = await requireEmployee();
  const current = await prisma.employeeProfile.findUnique({ where: { authUserId: auth.id }, select: { id: true } });
  if (!current) return <PageFrame><Notice tone="amber">Employee account not available.</Notice></PageFrame>;
  const search = String((await searchParams).q ?? "").trim().slice(0, 100);
  const [threads, employees] = await Promise.all([
    loadThreads(current.id, search),
    prisma.employeeProfile.findMany({ where: { status: "ACTIVE", id: { not: current.id } }, select: { id: true, fullName: true, role: true }, orderBy: { fullName: "asc" }, take: 1000 }),
  ]);

  return (
    <PageFrame>
      <PageTitle eyebrow="Communication" title="Special messages" description="General chat, private messages and group discussions." />
      <SplitView label="Special messages" hasDetail={false}
        list={<ThreadList threads={threads} search={search} />}
        detail={
          <>
            <div className="evx-msg-head">
              <p className="evx-eyebrow"><MessagesSquare size={12} aria-hidden="true" style={{ display: "inline", marginRight: 6, verticalAlign: "-1px" }} />New conversation</p>
              <h2>Start a discussion</h2>
              <p className="evx-meta">Pick colleagues, entire teams, or General. Everyone included can reply to the whole conversation.</p>
            </div>
            <form action={startSpecialMessage} className="evx-form" style={{ maxWidth: 720 }}>
              <label className="evx-field"><span>Subject</span><input name="subject" required minLength={3} maxLength={160} placeholder="What would you like to discuss?" className={field.input} /></label>
              <RecipientPicker employees={employees} />
              <label className="evx-field"><span>Your message</span><textarea name="body" required minLength={1} maxLength={6000} rows={6} placeholder="Write a clear message for your recipients…" className={field.textarea} /></label>
              <div><button className={btn.violet}><Send size={16} aria-hidden="true" />Send message</button></div>
            </form>
          </>
        } />
    </PageFrame>
  );
}
