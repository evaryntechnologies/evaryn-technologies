"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function registerApplicant(formData: FormData) {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (
    fullName.length < 2 ||
    fullName.length > 150 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    password.length < 12 ||
    password !== confirm
  ) {
    redirect("/portal/register?error=invalid");
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  });

  if (error) {
    redirect("/portal/register?error=failed");
  }

  // Signup does not grant portal permissions.
  redirect("/portal/register?result=check-email");
}