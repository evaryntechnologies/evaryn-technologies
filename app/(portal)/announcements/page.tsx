import { connection } from "next/server";
import { BookOpen, Send } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { requireEmployee } from "@/lib/auth/require-employee";
import { publishAnnouncement } from "./actions";
import { loadMemos, MemoList } from "./list";
import { Notice, PageFrame, PageTitle, SplitPlaceholder, SplitView, btn, field } from "@/app/(portal)/layouts";

export default async function MemoArchive({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  await connection();
  const auth = await requireEmployee();
  const employee = await prisma.employeeProfile.findUnique({ where: { authUserId: auth.id }, select: { role: true, status: true } });
  if (!employee || employee.status !== "ACTIVE") return <PageFrame><Notice tone="amber">Access denied.</Notice></PageFrame>;
  const canPublish = ["QA", "ADMIN", "SUPER_ADMIN"].includes(employee.role);
  const params = await searchParams;
  const q = (params.q ?? "").trim().slice(0, 120);
  const page = Math.min(10000, Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1));
  const { memos, total } = await loadMemos(q, page);

  return (
    <PageFrame>
      <PageTitle eyebrow="Internal communications" title="Internal memos" description="A permanent library of team announcements and instructions. Notifications are alerts; published memos stay here until their author or the Super Admin deletes them." />
      <SplitView label="Internal memos" hasDetail={false}
        list={<MemoList memos={memos} total={total} q={q} page={page} canPublish={canPublish} />}
        detail={canPublish ? (
          <>
            <div className="evx-msg-head">
              <p className="evx-eyebrow">New memo</p>
              <h2>Compose a team memo</h2>
              <p className="evx-meta">Sent to all active employees and stored in the archive until its author or the Super Admin removes it.</p>
            </div>
            <form action={publishAnnouncement} className="evx-form" style={{ maxWidth: 720 }}>
              <label className="evx-field"><span>Subject</span><input name="title" required minLength={4} maxLength={140} className={field.input} placeholder="Important team announcement" /></label>
              <label className="evx-field"><span>Memo</span><textarea name="body" required minLength={10} maxLength={4000} rows={9} className={field.textarea} placeholder="Write the memo clearly…" /></label>
              <p className="evx-meta">Company-wide memo: do not include confidential individual payroll or personnel information.</p>
              <div><button type="submit" className={btn.violet}><Send size={16} aria-hidden="true" />Publish and notify employees</button></div>
            </form>
          </>
        ) : (
          <SplitPlaceholder icon={BookOpen} title="Select a memo" text="Choose a memo on the left to read it." />
        )} />
    </PageFrame>
  );
}
