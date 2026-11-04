"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";

const validEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export async function registerClient(form: FormData) {
  const fullName = String(form.get("fullName") ?? "").trim();
  const companyName = String(form.get("companyName") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const confirm = String(form.get("confirm") ?? "");
  if (fullName.length < 2 || fullName.length > 150 || companyName.length > 200 || !validEmail(email) || password.length < 12 || password.length > 128 || password !== confirm) {
    redirect("/clients/register?error=invalid");
  }

  // Prefer the configured public origin; Vercel's production URL is a safe fallback.
  // Never build an email verification link using untrusted request Host headers.
  const configuredSite = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  const rawSite = configuredSite || (vercelProduction ? `https://${vercelProduction}` : "");
  let siteOrigin: string | null = null;
  try {
    const parsed = new URL(rawSite);
    if (parsed.protocol === "https:" && !parsed.username && !parsed.password) {
      siteOrigin = parsed.origin;
    }
  } catch {
    // Invalid configuration should not crash a public registration page.
  }
  if (!siteOrigin) {
    console.error("Evaryn client registration: production site URL is not configured");
    redirect("/clients/register?error=configuration");
  }

  let signupFailed = false;
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${siteOrigin}/auth/confirm?next=clients`,
        data: { full_name: fullName, company_name: companyName, evaryn_account_type: "CLIENT" },
      },
    });
    if (error) {
      console.error("Evaryn client registration: Supabase rejected signup", error.code ?? "auth_error");
      signupFailed = true;
    }
  } catch (error) {
    // Catch network or missing-Supabase-config failures, not Next.js redirects.
    console.error("Evaryn client registration: unexpected signup failure", error instanceof Error ? error.name : "unknown");
    redirect("/clients/register?error=unavailable");
  }
  if (signupFailed) redirect("/clients/register?error=failed");
  redirect("/clients/verify-email");
}

export async function signInClient(form: FormData) {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!validEmail(email) || !password) redirect("/clients/login?error=invalid");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect("/clients/login?error=invalid");
  redirect("/client-portal");
}

export async function signOutClient() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/clients/login");
}

export async function ensureClientProfile() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/clients/login");
  if (!user.email_confirmed_at) redirect("/clients/verify-email");
  if (user.app_metadata?.role || user.user_metadata?.evaryn_account_type !== "CLIENT") redirect("/clients/unauthorized");
  const [employee, expert] = await Promise.all([
    prisma.employeeProfile.findUnique({ where: { authUserId: user.id }, select: { id: true } }),
    prisma.expertApplication.findUnique({ where: { authUserId: user.id }, select: { id: true } }),
  ]);
  if (employee || expert) redirect("/clients/unauthorized");
  const existing = await prisma.clientProfile.findUnique({ where: { authUserId: user.id } });
  if (existing) {
    if (existing.status !== "ACTIVE") redirect("/clients/unauthorized");
    return existing;
  }
  const name = String(user.user_metadata?.full_name ?? "").trim().slice(0, 150);
  const company = String(user.user_metadata?.company_name ?? "").trim().slice(0, 200);
  const email = user.email?.toLowerCase();
  if (!email || !validEmail(email) || name.length < 2) redirect("/clients/unauthorized");
  return prisma.clientProfile.upsert({
    where: { authUserId: user.id },
    update: {},
    create: { authUserId: user.id, email, fullName: name, companyName: company || null },
  });
}

export async function createClientRequest(form: FormData) {
  const client = await ensureClientProfile();
  const title = String(form.get("title") ?? "").trim();
  const service = String(form.get("service") ?? "").trim();
  const details = String(form.get("details") ?? "").trim();
  if (title.length < 5 || title.length > 180 || service.length < 2 || service.length > 100 || details.length < 30 || details.length > 10000) redirect("/client-portal/requests/new?error=invalid");
  // Basic server-side throttle to reduce duplicate submissions. No public client can choose another client's ID.
  const recent = await prisma.clientProjectRequest.count({ where: { clientId: client.id, createdAt: { gte: new Date(Date.now() - 60_000) } } });
  if (recent >= 2) redirect("/client-portal/requests/new?error=rate");
  const request = await prisma.clientProjectRequest.create({ data: { clientId: client.id, title, service, details } });
  revalidatePath("/client-portal");
  redirect(`/client-portal/requests/${request.id}?submitted=1`);
}
