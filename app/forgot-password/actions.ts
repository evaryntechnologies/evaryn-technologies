"use server";

import { createClient } from "@/lib/supabase/server";

type AccountArea = "staff" | "clients" | "experts";

type RecoveryResult = { ok: true } | { ok: false; message: string };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function sendPasswordRecovery(formData: FormData): Promise<RecoveryResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const rawArea = String(formData.get("area") ?? "staff");
  const area: AccountArea = rawArea === "clients" || rawArea === "experts" ? rawArea : "staff";

  if (email.length > 254 || !emailPattern.test(email)) {
    return { ok: false, message: "Enter a valid email address." };
  }

  // Only trusted deployment configuration may determine the email link destination.
  const siteValue = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  const configured = siteValue || (vercelHost ? `https://${vercelHost}` : "");
  let origin: string;
  try {
    const url = new URL(configured);
    if (url.protocol !== "https:" || url.username || url.password) throw new Error("Invalid site URL");
    origin = url.origin;
  } catch {
    console.error("Password recovery: set NEXT_PUBLIC_SITE_URL to your verified HTTPS production origin");
    return { ok: false, message: "Password recovery is temporarily unavailable. Please contact support." };
  }

  try {
    const supabase = await createClient();
    const redirectTo = `${origin}/reset-password?for=${area}`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) {
      // Do not reveal account existence or Supabase account-specific errors.
      console.error("Password recovery request:", error.code ?? "auth_error");
      if (error.status === 429) {
        return { ok: false, message: "Too many requests. Please try again later." };
      }
      return { ok: false, message: "Unable to process your request right now. Please try again later." };
    }
  } catch (error) {
    console.error("Password recovery service error:", error instanceof Error ? error.name : "unknown");
    return { ok: false, message: "Password recovery is temporarily unavailable. Please try again later." };
  }

  // Same result whether the address exists or not.
  return { ok: true };
}
