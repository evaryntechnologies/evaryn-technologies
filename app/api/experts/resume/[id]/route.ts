import { NextResponse } from "next/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";
export const dynamic = "force-dynamic";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireEmployee(["SUPER_ADMIN"]);
  const actor = await prisma.employeeProfile.findUnique({ where: { authUserId: user.id }, select: { role: true, status: true } });
  if (!actor || actor.status !== "ACTIVE" || actor.role !== "SUPER_ADMIN") return new Response("Forbidden", { status: 403 });
  const { id } = await params;
  if (!/^[a-f0-9-]{36}$/i.test(id)) return new Response("Invalid application", { status: 400 });
  const application = await prisma.expertApplication.findUnique({ where: { id }, select: { cvStorageKey: true } });
  if (!application?.cvStorageKey?.startsWith("expert-resumes/")) return new Response("Résumé not found", { status: 404 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !secret) return new Response("Storage unavailable", { status: 503 });
  const admin = createAdmin(url, secret, { auth: { autoRefreshToken: false, persistSession: false } });
  const signed = await admin.storage.from("task-attachments").createSignedUrl(application.cvStorageKey, 60, { download: "Evaryn-Expert-Resume" });
  if (signed.error || !signed.data?.signedUrl) return new Response("File unavailable", { status: 404 });
  return NextResponse.redirect(signed.data.signedUrl, { headers: { "Cache-Control": "private, no-store" } });
}
