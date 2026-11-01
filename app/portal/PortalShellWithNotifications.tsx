import { connection } from "next/server";
import PortalShell from "./PortalShell";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import type { ReactNode } from "react";

/**
 * Wraps every /portal page, including the public auth pages (login, register,
 * change-password, unauthorized). It must therefore NEVER redirect: signed-out
 * visitors would be sent to /portal/login, which renders this wrapper again, forever.
 * Each page still enforces access itself through requireEmployee().
 */
export default async function PortalShellWithNotifications({ children }: { children: ReactNode }) {
  await connection();
  let unreadNotifications = 0;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const profile = await prisma.employeeProfile.findUnique({
        where: { authUserId: user.id },
        select: { id: true },
      });
      if (profile) {
        unreadNotifications = await prisma.portalNotification.count({
          where: { recipientId: profile.id, readAt: null },
        });
      }
    }
  } catch {
    // A badge failure must never stop a page (or the login form) from loading.
    unreadNotifications = 0;
  }
  return <PortalShell unreadNotifications={unreadNotifications}>{children}</PortalShell>;
}
