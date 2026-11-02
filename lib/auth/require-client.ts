import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";

/** Call from protected client server pages. API handlers must use their own 401/403 responses. */
export async function requireClient() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/clients/login");
  if (!user.email_confirmed_at) redirect("/clients/verify-email");

  const client = await prisma.clientProfile.findUnique({
    where: { authUserId: user.id },
    select: { id: true, authUserId: true, fullName: true, email: true, companyName: true, status: true },
  });
  if (!client || client.status !== "ACTIVE") redirect("/clients/unauthorized");
  return client;
}
