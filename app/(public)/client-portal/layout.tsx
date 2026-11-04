import "./client-portal.css";
import type { ReactNode } from "react";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { ensureClientProfile, signOutClient } from "../clients/actions";
import ClientNav from "./ClientNav";

export const dynamic = "force-dynamic";

export default async function ClientPortalLayout({ children }: { children: ReactNode }) {
  const client = await ensureClientProfile();
  // Orders delivered to this client that they have not rated yet (drives the badge on "Delivered").
  const awaiting = await prisma
    .$queryRaw<{ n: bigint }[]>(Prisma.sql`
      SELECT count(*)::bigint AS n FROM public."ClientOrderLink" l
      JOIN public."WorkTask" t ON t."id" = l."taskId"
      WHERE l."clientId" = ${client.id}::uuid AND l."deliveredAt" IS NOT NULL
        AND t."status" = 'DELIVERED_AWAITING_CLIENT' AND l."ratedAt" IS NULL`)
    .then((r) => Number(r[0]?.n ?? 0))
    .catch(() => 0);

  return (
    <div className="cp-shell">
      <header className="cp-banner">
        <div className="cp-welcome">
          <span className="cp-eyebrow">Client workspace</span>
          <p className="cp-name">{client.fullName}{client.companyName ? <span> · {client.companyName}</span> : null}</p>
        </div>
        <ClientNav awaiting={awaiting} />
        <form action={signOutClient}><button className="cp-signout">Sign out</button></form>
      </header>
      {children}
    </div>
  );
}
