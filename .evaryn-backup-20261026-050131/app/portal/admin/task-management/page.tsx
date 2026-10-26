import { connection } from "next/server";
import { Suspense } from "react";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";
import { createProject, assignTask } from "./actions";

const inputClass =
  "mt-2 w-full rounded-xl border border-slate-600 bg-[#071327] px-4 py-3 text-white";

async function AdminTaskContent() {
  await connection();
  const user = await requireEmployee(["ADMIN", "SUPER_ADMIN"]);

  const administrator = await prisma.employeeProfile.findUnique({
    where: { authUserId: user.id },
    select: { role: true, status: true },
  });

  if (
    !administrator ||
    administrator.status !== "ACTIVE" ||
    !["ADMIN", "SUPER_ADMIN"].includes(administrator.role)
  ) {
    return (
      <p className="rounded-xl border border-amber-400/30 p-6 text-amber-200">
        Your administrator profile is not active.
      </p>
    );
  }

  const [projects, workers, tasks] = await Promise.all([
    prisma.workProject.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, title: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.employeeProfile.findMany({
      where: { role: "TASKER", status: "ACTIVE" },
      select: { id: true, fullName: true, email: true },
      orderBy: { fullName: "asc" },
      take: 200,
    }),
    prisma.workTask.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        assignedTo: { select: { fullName: true } },
        project: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-9">
        <p className="text-sm font-semibold tracking-widest text-cyan-300">
          EVARYN TECHNOLOGIES
        </p>
        <h1 className="mt-3 text-3xl font-bold">
          Task Management
        </h1>
        <p className="mt-3 text-slate-300">
          Create projects and assign work to authorized employees.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-[#101F39] p-6">
          <h2 className="text-xl font-bold">Create Project</h2>

          <form action={async (data: FormData) => { "use server"; await createProject(data); }} className="mt-5 space-y-5">
            <label className="block text-sm font-medium">
              Project title
              <input
                name="title"
                required
                minLength={3}
                maxLength={160}
                className={inputClass}
              />
            </label>

            <label className="block text-sm font-medium">
              Project description
              <textarea
                name="description"
                required
                minLength={10}
                maxLength={10000}
                rows={5}
                className={inputClass}
              />
            </label>

            <button
              type="submit"
              className="rounded-xl bg-[#0052CC] px-6 py-3 font-semibold hover:bg-[#003F9E]"
            >
              Create Project
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#101F39] p-6">
          <h2 className="text-xl font-bold">Assign Task</h2>

          <form action={async (data: FormData) => { "use server"; await assignTask(data); }} className="mt-5 space-y-5">
            <label className="block text-sm font-medium">
              Project
              <select name="projectId" required defaultValue="" className={inputClass}>
                <option value="">Select project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-medium">
              Assigned employee
              <select name="assignedToId" required defaultValue="" className={inputClass}>
                <option value="">Select Tasker</option>
                {workers.map((worker) => (
                  <option key={worker.id} value={worker.id}>
                    {worker.fullName} ({worker.email})
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-medium">
              Task title
              <input name="title" required minLength={3} maxLength={160} className={inputClass} />
            </label>

            <label className="block text-sm font-medium">
              Instructions
              <textarea name="description" required minLength={10} maxLength={10000} rows={4} className={inputClass} />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium">
                Priority
                <select name="priority" defaultValue="NORMAL" className={inputClass}>
                  <option value="LOW">Low</option>
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </label>

              <label className="block text-sm font-medium">
                Deadline
                <input type="date" name="deadline" className={inputClass} />
              </label>
            </div>

            <button
              type="submit"
              disabled={projects.length === 0 || workers.length === 0}
              className="rounded-xl bg-[#0052CC] px-6 py-3 font-semibold hover:bg-[#003F9E] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Assign Task
            </button>

            {(projects.length === 0 || workers.length === 0) && (
              <p className="text-sm text-amber-200">
                Create a project and activate at least one Tasker before assigning work.
              </p>
            )}
          </form>
        </section>
      </div>

      <section className="mt-8 rounded-2xl border border-white/10 bg-[#101F39] p-6">
        <h2 className="text-xl font-bold">Recent Assignments</h2>

        {tasks.length === 0 ? (
          <p className="mt-5 text-sm text-slate-300">
            No tasks have been assigned yet.
          </p>
        ) : (
          <div className="mt-5 space-y-3">
            {tasks.map((task) => (
              <article
                key={task.id}
                className="rounded-xl border border-white/10 p-4"
              >
                <h3 className="font-semibold">{task.title}</h3>
                <p className="mt-2 text-sm text-slate-300">
                  {task.project.title} Ã‚Â· {task.assignedTo.fullName}
                </p>
                <p className="mt-2 text-xs text-cyan-300">
                  {task.status} Ã‚Â· {task.priority}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default function AdminTaskManagementPage() {
  return (
    <main className="min-h-screen bg-[#071327] px-5 py-10 text-white sm:px-10">
      <Suspense fallback={<p>Loading task management...</p>}>
        <AdminTaskContent />
      </Suspense>
    </main>
  );
}