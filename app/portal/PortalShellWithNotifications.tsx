import { connection } from "next/server";
import PortalShell from "./PortalShell";
import { prisma } from "@/lib/db/prisma";
import { requireEmployee } from "@/lib/auth/require-employee";
import type { ReactNode } from "react";

export default async function PortalShellWithNotifications({children}:{children:ReactNode}) {
 await connection();
 const user = await requireEmployee();
 const profile = await prisma.employeeProfile.findUnique({where:{authUserId:user.id},select:{id:true}});
 const unreadNotifications = profile ? await prisma.portalNotification.count({where:{recipientId:profile.id,readAt:null}}) : 0;
 return <PortalShell unreadNotifications={unreadNotifications}>{children}</PortalShell>;
}
