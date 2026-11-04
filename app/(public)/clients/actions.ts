"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@/generated/prisma/client";
import { categoryPrefix, uploadClientRequestAttachments } from "@/lib/client-communication";

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

  // Create/check the ClientProfile while the action can return a useful error.
  // The portal itself remains protected by ensureClientProfile and requireClient.
  let result: "ok" | "invalid" | "verify" | "unauthorized" | "profile" | "unavailable" = "invalid";
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      result = error.code === "email_not_confirmed" ? "verify" : "invalid";
    } else {
      const user = data.user;
      if (!user) {
        result = "unavailable";
      } else if (!user.email_confirmed_at) {
        result = "verify";
      } else if (user.app_metadata?.role || user.user_metadata?.evaryn_account_type !== "CLIENT") {
        result = "unauthorized";
      } else {
        try {
          const [employee, expert] = await Promise.all([
            prisma.employeeProfile.findUnique({ where: { authUserId: user.id }, select: { id: true } }),
            prisma.expertApplication.findUnique({ where: { authUserId: user.id }, select: { id: true } }),
          ]);
          if (employee || expert) {
            result = "unauthorized";
          } else {
            const existing = await prisma.clientProfile.findUnique({ where: { authUserId: user.id } });
            if (existing) {
              result = existing.status === "ACTIVE" ? "ok" : "unauthorized";
            } else {
              const fullName = String(user.user_metadata?.full_name ?? "").trim().slice(0, 150);
              const companyName = String(user.user_metadata?.company_name ?? "").trim().slice(0, 200);
              const accountEmail = String(user.email ?? "").trim().toLowerCase();
              if (fullName.length < 2 || !validEmail(accountEmail)) {
                result = "unauthorized";
              } else {
                await prisma.clientProfile.upsert({
                  where: { authUserId: user.id },
                  update: {},
                  create: {
                    authUserId: user.id,
                    email: accountEmail,
                    fullName,
                    companyName: companyName || null,
                  },
                });
                result = "ok";
              }
            }
          }
        } catch (error) {
          console.error("Evaryn client login: profile initialization failed", error);
          result = "profile";
        }
      }
    }
  } catch (error) {
    console.error("Evaryn client login: authentication service failed", error instanceof Error ? error.name : "unknown");
    result = "unavailable";
  }

  // Redirect outside catch blocks: Next.js redirects throw internally.
  if (result !== "ok") redirect(`/clients/login?error=${result}`);
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
  const files = form.getAll("attachments").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > 5 || files.some(f => f.size > 10*1024*1024)) redirect("/client-portal/requests/new?error=invalid");
  const prefix = categoryPrefix(service);
  const request = await prisma.$transaction(async tx => {
    const result = await tx.$queryRaw<{nextNumber:number}[]>(Prisma.sql`
      INSERT INTO public."ClientOrderSequence" ("prefix", "nextNumber") VALUES (${prefix}, 1)
      ON CONFLICT ("prefix") DO UPDATE SET "nextNumber" = public."ClientOrderSequence"."nextNumber" + 1
      RETURNING "nextNumber"`);
    const orderCode = `${prefix}-${String(result[0].nextNumber).padStart(3,"0")}`;
    const r = await tx.clientProjectRequest.create({ data: { clientId: client.id, title, service, details } });
    await tx.$executeRaw(Prisma.sql`UPDATE public."ClientProjectRequest" SET "clientOrderCode" = ${orderCode} WHERE "id" = ${r.id}::uuid`);
    return r;
  });
  try {
    await uploadClientRequestAttachments(request.id, files);
  } catch (error) {
    console.error("Client attachment upload failed", error);
    redirect(`/client-portal/requests/${request.id}?upload=failed`);
  }
  revalidatePath("/client-portal");
  redirect(`/client-portal/requests/${request.id}?submitted=1`);
}
