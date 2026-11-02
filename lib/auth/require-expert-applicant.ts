import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";

/** Pending applicants may access only their own application status, never employee resources. */
export async function requireExpertApplicant() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/experts/login");
  if (!user.email_confirmed_at) redirect("/experts/verify-email");

  const application = await prisma.expertApplication.findUnique({
    where: { authUserId: user.id },
    select: { id: true, fullName: true, email: true, status: true, createdAt: true, reviewedAt: true },
  });
  if (!application) redirect("/experts/unauthorized");
  return application;
}
