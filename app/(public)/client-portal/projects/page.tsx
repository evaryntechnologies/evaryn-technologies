import { prisma } from "@/lib/db/prisma";
import { ensureClientProfile } from "../../clients/actions";

export default async function ClientProjects() {
  const client = await ensureClientProfile();
  const access = await prisma.clientProjectAccess.findMany({
    where: { clientId: client.id },
    include: { workProject: { select: { id: true, title: true, description: true, status: true, createdAt: true } } },
    orderBy: { createdAt: "desc" }, take: 100,
  });
  return (
    <main className="cp-page">
      <div className="cp-head"><div><h1 className="cp-title">Projects</h1><p className="cp-sub">Only projects shared with your account appear here.</p></div></div>
      {access.length === 0 ? (
        <div className="cp-panel cp-empty-card"><p>No projects have been shared with your account yet.</p></div>
      ) : (
        <div className="cp-list">
          {access.map((a) => (
            <article key={a.id} className="cp-order">
              <div className="cp-order-top"><h3>{a.workProject.title}</h3><span className="cp-pill cp-pill--cyan">{a.workProject.status.toLowerCase()}</span></div>
              <p className="cp-prose">{a.workProject.description}</p>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
