import Link from "next/link";
import { PackageCheck } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { requireEmployee } from "@/lib/auth/require-employee";
import { publishDelivery } from "../client-delivery/actions";
import { returnPostQAForRevision } from "./actions";
import { Empty, Kanban, KanbanCard, KanbanColumn, PageFrame, PageTitle, Pill, btn, field, fmtDate } from "@/app/(portal)/layouts";

export const dynamic = "force-dynamic";

export default async function PostQAOrdersPage() {
  const user = await requireEmployee(["ADMIN", "SUPER_ADMIN"]);
  const actor = await prisma.employeeProfile.findUnique({ where: { authUserId: user.id }, select: { role: true, status: true } });
  if (!actor || actor.status !== "ACTIVE" || !["ADMIN", "SUPER_ADMIN"].includes(actor.role)) throw new Error("Unauthorized");

  const tasks = await prisma.workTask.findMany({
    where: { status: "POST_QA_APPROVED" },
    select: {
      id: true, publicTaskId: true, title: true, description: true, instructions: true, category: true, updatedAt: true,
      assignedTo: { select: { fullName: true } },
      clientAssignment: { select: { client: { select: { fullName: true, email: true } } } },
      submissions: {
        where: { reviews: { some: { stage: "QA", decision: "APPROVED" } } },
        select: { id: true, content: true, reviews: { where: { stage: "QA", decision: "APPROVED" }, orderBy: { createdAt: "desc" }, take: 1, select: { feedback: true } } },
        orderBy: { submittedAt: "desc" }, take: 1,
      },
    },
    orderBy: { updatedAt: "asc" },
    take: 100,
  });

  const ready = tasks.filter((t) => t.clientAssignment && t.submissions.length > 0);
  const blocked = tasks.filter((t) => !(t.clientAssignment && t.submissions.length > 0));

  const card = (task: (typeof tasks)[number], tone: "violet" | "amber") => (
    <KanbanCard key={task.id} tone={tone}>
      <div className="evx-kcard-top"><Pill tone="violet">QA approved</Pill><span className="evx-id">{task.publicTaskId ?? task.id.slice(0, 8)}</span></div>
      <h3 className="evx-kcard-title">{task.title}</h3>
      <p className="evx-meta">{task.category ?? "General"} · tasker {task.assignedTo?.fullName ?? "not assigned"}</p>
      <p className="evx-meta">Client: {task.clientAssignment?.client.fullName ?? "Not assigned"} · approved {fmtDate(task.updatedAt)}</p>
      {!task.clientAssignment && <Link href="/portal/client-delivery" className="evx-kpi-cta" style={{ padding: 0 }}>Assign the order to its client before delivery</Link>}

      <details className="evx-more">
        <summary>Order details and QA notes</summary>
        <div className="evx-more-body">
          <div className="evx-block"><h4>Order description</h4><p>{task.description}</p></div>
          {task.instructions && <div className="evx-block"><h4>Instructions</h4><p>{task.instructions}</p></div>}
          {task.submissions[0]?.content && <div className="evx-block"><h4>Latest QA-approved submission</h4><p>{task.submissions[0].content}</p></div>}
          {task.submissions[0]?.reviews[0]?.feedback && <div className="evx-block"><h4>QA feedback</h4><p>{task.submissions[0].reviews[0].feedback}</p></div>}
          <Link href={`/portal/attachments/${task.id}`} className="evx-kpi-cta" style={{ padding: 0 }}>Open order attachments</Link>
        </div>
      </details>

      <details className="evx-more">
        <summary>Send final copy to client</summary>
        <form action={publishDelivery} encType="multipart/form-data" className="evx-more-body evx-form">
          <p className="evx-meta">Upload the approved final deliverable. This is the only step that makes it available to the client.</p>
          <input type="hidden" name="taskId" value={task.id} />
          <label className="evx-field"><span>Final file (up to 3 MB)</span><input required type="file" name="file" className={field.input} /></label>
          <button disabled={!task.submissions.length || !task.clientAssignment} className={`${btn.violet} ${btn.block}`}>Send final copy</button>
        </form>
      </details>

      <details className="evx-more">
        <summary>Return to original tasker</summary>
        <form action={returnPostQAForRevision} className="evx-more-body evx-form">
          <p className="evx-meta">Reviewer and QA are checkers. Revisions always go to the assigned tasker.</p>
          <input type="hidden" name="taskId" value={task.id} />
          <label className="evx-field"><span>Revision instructions</span><textarea required minLength={10} maxLength={5000} rows={3} name="reason" className={field.textarea} placeholder="Describe the changes the tasker must make" /></label>
          <button disabled={!task.assignedTo} className={`${btn.warn} ${btn.block}`}>Return to revision</button>
        </form>
      </details>
    </KanbanCard>
  );

  return (
    <PageFrame>
      <PageTitle
        eyebrow="Administrative quality control"
        title="Post-QA orders"
        description="QA-approved work waits here until an Admin sends the final copy to the assigned client, or returns the order to its original tasker."
        actions={<><Pill tone="violet">{tasks.length} awaiting admin check</Pill><Link href="/portal/client-delivery" className={btn.ghost}>Client delivery records</Link></>}
      />
      {tasks.length === 0 ? (
        <Empty icon={PackageCheck} title="No post-QA orders pending" text="New QA approvals will arrive here automatically." />
      ) : (
        <Kanban columns={2} label="Post-QA orders by delivery readiness">
          <KanbanColumn title="Ready to deliver" count={ready.length} tone="violet" empty="No order is ready for delivery.">{ready.map((t) => card(t, "violet"))}</KanbanColumn>
          <KanbanColumn title="Needs a client assigned" count={blocked.length} tone="amber" empty="Every order has a client.">{blocked.map((t) => card(t, "amber"))}</KanbanColumn>
        </Kanban>
      )}
      <p className="evx-footnote">Only administrators can perform these actions.</p>
    </PageFrame>
  );
}
