import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { requireEmployee } from "@/lib/auth/require-employee";
import { publishDelivery } from "../client-delivery/actions";
import { returnPostQAForRevision } from "./actions";

export const dynamic = "force-dynamic";

const field = "mt-2 w-full rounded-xl border border-[#89CDE7]/35 bg-[#F4FAFF] px-4 py-3 text-[#133A65] outline-none focus:ring-2 focus:ring-[#7956AF] dark:bg-[#152E51] dark:text-white";

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
      submissions: { where: { reviews: { some: { stage: "QA", decision: "APPROVED" } } }, select: { id: true, content: true, reviews: { where: { stage: "QA", decision: "APPROVED" }, orderBy: { createdAt: "desc" }, take: 1, select: { feedback: true } } }, orderBy: { submittedAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "asc" },
    take: 100,
  });

  return <main className="ev-layout-kanban min-h-screen bg-[#EFF7FD] px-4 py-10 font-sans text-[#123865] dark:bg-[#0B1E3B] dark:text-[#EFF8FF] sm:px-8">
    <div className="mx-auto max-w-6xl space-y-7">
      <header className="rounded-3xl border border-[#A6D5ED]/60 bg-[#E4F3FC] p-7 shadow-sm dark:border-[#36557A] dark:bg-[#122B50] sm:p-9">
        <p className="text-xs font-bold uppercase tracking-[.2em] text-[#7956AF] dark:text-[#C6B4EE]">Evaryn · Administrative quality control</p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-5"><div><h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Post-QA Orders</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-[#426384] dark:text-[#C4D8ED]">QA-approved work stays here until an Admin or Super Admin sends the final copy to the assigned client, or returns the order directly to its original tasker.</p></div><div className="rounded-2xl border border-[#86C9E6] bg-[#D4ECFA] px-6 py-4 text-center dark:border-[#426D9A] dark:bg-[#173C63]"><p className="text-3xl font-bold tabular-nums">{tasks.length}</p><p className="text-xs">Awaiting admin check</p></div></div>
      </header>
      {tasks.length === 0 ? <section className="rounded-2xl border border-[#ADD7ED] bg-[#F5FAFE] p-12 text-center dark:border-[#314B70] dark:bg-[#142D50]"><h2 className="text-xl font-bold">No post-QA orders pending</h2><p className="mt-2 text-sm opacity-75">New QA approvals will arrive here automatically.</p></section> : <div className="ev-layout-kanban-items grid gap-5 xl:grid-cols-2">{tasks.map(task => <article key={task.id} className="overflow-hidden rounded-2xl border border-[#B6D9ED] bg-[#F6FBFF] shadow-sm dark:border-[#35557D] dark:bg-[#142C4D]">
        <div className="border-b border-[#B6D9ED]/65 p-6 dark:border-[#35557D]"><div className="flex items-center justify-between gap-3"><span className="rounded-full bg-[#E1D9F6] px-3 py-1 text-xs font-bold text-[#634093] dark:bg-[#3B2C5D] dark:text-[#E1D0FF]">QA approved · Admin check</span><span className="text-xs opacity-65">{task.category ?? "General"}</span></div><h2 className="mt-4 text-xl font-bold">{task.title}</h2><p className="mt-2 text-xs opacity-75">Order {task.publicTaskId ?? task.id.slice(0, 8)}</p><p className="mt-2 text-sm opacity-75">Client: {task.clientAssignment?.client.fullName ?? "Unassigned"} · Tasker: {task.assignedTo?.fullName ?? "Not assigned"}</p>{!task.clientAssignment && <Link href="/portal/client-delivery" className="mt-2 inline-block text-xs font-bold text-[#7956AF] underline dark:text-[#D3BFFA]">Assign the order to its client before delivery</Link>}
        <details className="mt-4 rounded-xl border border-[#B6D9ED] p-4 dark:border-[#35557D]"><summary className="cursor-pointer text-sm font-bold">Review order details, final work & QA notes</summary><div className="mt-3 space-y-3 text-sm leading-6"><p><strong>Order description:</strong> {task.description}</p>{task.instructions && <p className="whitespace-pre-wrap"><strong>Instructions:</strong> {task.instructions}</p>}{task.submissions[0]?.content && <div className="rounded-lg bg-[#E8F4FC] p-3 dark:bg-[#1B3A5D]"><strong>Latest QA-approved submission</strong><p className="mt-1 whitespace-pre-wrap">{task.submissions[0].content}</p></div>}{task.submissions[0]?.reviews[0]?.feedback && <p className="whitespace-pre-wrap"><strong>QA feedback:</strong> {task.submissions[0].reviews[0].feedback}</p>}<Link href={`/portal/attachments/${task.id}`} className="font-semibold text-[#7956AF] underline dark:text-[#CFB9F5]">Open order attachments</Link></div></details></div>
        <div className="grid gap-5 p-6"><form action={publishDelivery} encType="multipart/form-data" className="space-y-3 rounded-xl border border-[#96D6EB] bg-[#E6F6FD] p-4 dark:border-[#376484] dark:bg-[#183B5B]"><h3 className="font-bold">Send final copy to client</h3><p className="text-xs opacity-75">Upload the approved final deliverable. This is the only step that makes it available to the client.</p><input type="hidden" name="taskId" value={task.id}/><label className="block text-sm font-semibold">Final file (up to 3 MB)<input required type="file" name="file" className={field}/></label><button disabled={!task.submissions.length || !task.clientAssignment} className="w-full rounded-xl bg-[#7956AF] px-5 py-3 font-bold text-white transition hover:bg-[#69449D] disabled:opacity-50">Send final copy</button></form>
        <form action={returnPostQAForRevision} className="space-y-3 rounded-xl border border-[#B6D9ED] p-4 dark:border-[#35557D]"><h3 className="font-bold">Return to original tasker</h3><p className="text-xs opacity-75">Reviewer and QA are checkers. Revisions always go to the assigned tasker.</p><input type="hidden" name="taskId" value={task.id}/><label className="block text-sm font-semibold">Revision instructions<textarea required minLength={10} maxLength={5000} rows={3} name="reason" className={field} placeholder="Describe the changes the tasker must make"/></label><button disabled={!task.assignedTo} className="w-full rounded-xl border border-[#7956AF] px-5 py-3 font-bold text-[#7956AF] transition hover:bg-[#7956AF] hover:text-white dark:text-[#CBB6F1] disabled:opacity-50">Return to revision</button></form></div></article>)}</div>}
      <p className="text-sm text-[#54718D] dark:text-[#BDD2EA]">Only administrators can perform these actions. <Link href="/portal/client-delivery" className="font-semibold underline">View client delivery records</Link></p>
    </div>
  </main>;
}
