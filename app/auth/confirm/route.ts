import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { EmailOtpType } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const next = url.searchParams.get("next");
  const type = url.searchParams.get("type");

  if (tokenHash && (type === "email" || type === "signup")) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as EmailOtpType,
    });

    if (!error) {
      return NextResponse.redirect(
        new URL(next === "clients" ? "/clients/login?verified=1" : next === "experts" ? "/experts/login?verified=1" : "/portal/login?verified=1", url.origin)
      );
    }
  }

  return NextResponse.redirect(
    new URL(next === "clients" ? "/clients/login?error=verification" : next === "experts" ? "/experts/login?error=verification" : "/portal/register?error=verification", url.origin)
  );
}