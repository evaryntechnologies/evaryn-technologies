import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";
import { submitTask } from "./actions";

async function TaskContent({
  taskId,
  searchParams,
}: {
  taskId: string;
  searchParams: Promise<{ error?: string; submitted?: string }>;
}) {
  await connection();

  const user = await requireEmployee(["TASKER","REVIEWER","QA"]);

  const employee = await prisma.employeeProfile.findUnique({
    where: { authUserId: user.id },
    select: { id: true },
  });

  if (!employee) notFound();

  const task = await prisma.workTask.findFirst({
    where: { id: taskId, assignedToId: employee.id },
    include: {
      
      extraAttachments: { orderBy: { createdAt: "desc" }, select: { id: true, fileName: true } },
      submissions: {
        where: { employeeId: employee.id },
        orderBy: { submittedAt: "desc" },
        select: {
          id: true,
          content: true,
          status: true,
          submittedAt: true,
          reviews: {
            orderBy: { createdAt: "desc" },
            select: {
              stage: true,
              decision: true,
              feedback: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });

  if (!task) notFound();

  const params = await searchParams;
  const canSubmit = ["ASSIGNED", "REWORK_REQUIRED"].includes(task.status);

  return (
    <main className="min-h-screen bg-[#071327] px-5 py-9 text-white sm:px-10">
      <div className="w-full max-w-none">
        <Link href="/portal/tasker" className="text-sm font-semibold text-cyan-300 hover:underline">
          Back to My Tasks
        </Link>

        <Link href={`/portal/tasks/${task.id}/issues`} className="mt-5 mr-5 inline-block rounded-lg border border-amber-400/40 px-4 py-2 text-amber-200">Raise Issue</Link>
        <Link href={`/portal/tasks/${task.id}/discussion`} className="mt-5 inline-block text-cyan-300 underline">Task discussion and reassignment request</Link>
        <header className="mt-8">
          <p className="text-xs font-bold tracking-widest text-cyan-300">
            EVARYN TECHNOLOGIES LIMITED
          </p>
          <p className="mt-5 text-sm text-slate-300">{task.category ?? "Uncategorized"}</p>
          <h1 className="mt-2 text-3xl font-bold">{task.publicTaskId ?? task.id} · {task.title}</h1>
          <div className="mt-4 flex flex-wrap gap-3 text-xs">
            <span className="rounded-lg border border-white/20 px-3 py-2">
              {task.status.replaceAll("_", " ")}
            </span>
            <span className="rounded-lg border border-white/20 px-3 py-2">
              Priority: {task.priority}
            </span>
            {task.deadline && (
              <span className="rounded-lg border border-white/20 px-3 py-2">
                Submission deadline: {task.deadline.toLocaleString("en-KE", { timeZone: "Africa/Nairobi" })}
              </span>
            )}
          </div>
        </header>

        <section className="mt-8 rounded-2xl border border-white/10 bg-[#101F39] p-6 sm:p-8">
          <h2 className="text-xl font-bold">Task Details</h2>
          {task.attachmentKey && <p className="mt-4"><a className="text-cyan-300 underline" href={`/portal/attachments/${task.id}`}>Download reference: {task.attachmentName ?? "Attachment"}</a></p>}
          {task.extraAttachments.map(file => <p key={file.id} className="mt-3"><a className="text-cyan-300 underline" href={`/portal/attachments/${task.id}/extra/${file.id}`}>Additional file: {file.fileName}</a></p>)}
          {task.clientRevisionNote && task.status === "REWORK_REQUIRED" && <div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4"><strong className="text-amber-100">Client requested revision</strong><p className="mt-2 whitespace-pre-wrap text-sm text-amber-50">{task.clientRevisionNote}</p></div>}
          {task.clientPaidPercent != null && Number(task.clientPaidPercent) > 0 && Number(task.clientPaidPercent) < 100 && <p className="mt-3 rounded-lg border border-cyan-400/30 bg-cyan-400/10 p-3 text-sm text-cyan-100">Client paid partially: {Number(task.clientPaidPercent)}%. Eligible earnings are prorated to this percentage.</p>}
          <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-300">
            {task.description}
          </p>
          {task.instructions && (
            <>
              <h3 className="mt-7 font-semibold">Instructions</h3>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-300">
                {task.instructions}
              </p>
            </>
          )}
        </section>

        {params.submitted === "1" && (
          <p role="status" className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-4 text-sm text-emerald-200">
            Your work has been submitted for review.
          </p>
        )}

        {params.error && (
          <p role="alert" className="mt-6 rounded-xl border border-amber-500/30 bg-amber-950/30 p-4 text-sm text-amber-200">
            {params.error === "invalid"
              ? "Please provide at least 20 characters of work details."
              : "This task is not currently accepting submissions."}
          </p>
        )}

        <section className="mt-8 rounded-2xl border border-white/10 bg-[#101F39] p-6 sm:p-8">
          <h2 className="text-xl font-bold">
            {task.status === "REWORK_REQUIRED" ? "Submit Revised Work" : "Submit Work"}
          </h2>

          {canSubmit ? (
            <form action={submitTask} className="mt-6 space-y-5">
<label className="block text-sm font-semibold">Optional supporting attachment (any file format, maximum 10 MB)
<input type="file" name="attachment" className="mt-2 block w-full rounded-lg border border-cyan-400/30 p-3 text-sm" />
</label>
              <input type="hidden" name="taskId" value={task.id} />

              <label className="block text-sm font-medium">
                Work completed / submission details
                <textarea
                  name="content"
                  required
                  minLength={20}
                  maxLength={50000}
                  rows={10}
                  placeholder="Provide your completed work or detailed submission here..."
                  className="mt-2 w-full rounded-xl border border-slate-600 bg-[#071327] px-4 py-3 text-white"
                />
              </label>

              <button type="submit" className="rounded-xl bg-[#0052CC] px-6 py-3 font-semibold hover:bg-[#003F9E]">
                Submit for Review
              </button>
            </form>
          ) : (
            <p className="mt-4 text-sm text-slate-300">
              This task is currently in the {task.status.replaceAll("_", " ").toLowerCase()} stage.
              You can view your previous submissions below.
            </p>
          )}
        </section>

        <section className="mt-8 rounded-2xl border border-white/10 bg-[#101F39] p-6 sm:p-8">
          <h2 className="text-xl font-bold">Submission History</h2>
          {task.submissions.length === 0 ? (
            <p className="mt-4 text-sm text-slate-300">No submissions yet.</p>
          ) : (
            <div className="mt-6 space-y-4">
              {task.submissions.map((submission) => (
                <article key={submission.id} className="rounded-xl border border-white/10 bg-[#071327] p-5">
                  <div className="flex flex-wrap justify-between gap-2 text-xs text-slate-300">
                    <span>{submission.status.replaceAll("_", " ")}</span>
                    <span>{submission.submittedAt.toLocaleString("en-KE", { timeZone: "Africa/Nairobi" })}</span>
                  </div>

                  <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7">
                    {submission.content}
                  </p>

                  {submission.reviews.map((review, i) => (
                    <div key={i} className="mt-4 rounded-lg border border-cyan-400/20 p-4">
                      <p className="text-xs font-semibold text-cyan-300">
                        {review.stage}: {review.decision.replaceAll("_", " ")}
                      </p>
                      {review.feedback && (
                        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">{review.feedback}</p>
                      )}
                    </div>
                  ))}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

async function TaskPageContent({
  params,
  searchParams,
}: {
  params: Promise<{ taskId: string }>;
  searchParams: Promise<{ error?: string; submitted?: string }>;
}) {
  await connection();

  const { taskId } = await params;

  return (
    <TaskContent
      taskId={taskId}
      searchParams={searchParams}
    />
  );
}

export default function TaskSubmissionPage({
  params,
  searchParams,
}: {
  params: Promise<{ taskId: string }>;
  searchParams: Promise<{ error?: string; submitted?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#071327] p-8 text-slate-300">
          Loading task...
        </main>
      }
    >
      <TaskPageContent
        params={params}
        searchParams={searchParams}
      />
    </Suspense>
  );
}
