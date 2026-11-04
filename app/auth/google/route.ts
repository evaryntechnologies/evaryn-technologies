import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const area = request.nextUrl.searchParams.get("area");
  const intent = request.nextUrl.searchParams.get("intent");
  if ((area !== "clients" && area !== "experts") || (intent !== "login" && intent !== "register")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Never build OAuth redirect URLs from an untrusted Host header.
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://evaryninc.com";
  let origin: string;
  try {
    const u = new URL(configured);
    if (u.protocol !== "https:" || u.username || u.password) throw new Error("Invalid origin");
    origin = u.origin;
  } catch {
    return NextResponse.redirect("https://evaryninc.com/" + area + "/login?error=unavailable");
  }
  if (origin !== "https://evaryninc.com" && origin !== "https://www.evaryninc.com") {
    return NextResponse.redirect("https://evaryninc.com/" + area + "/login?error=unavailable");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback` },
  });
  if (error || !data.url) {
    return NextResponse.redirect(`${origin}/${area}/login?error=google`);
  }

  // HttpOnly cookie binds the selected portal to the callback (not to privileges).
  const response = NextResponse.redirect(data.url);
  response.cookies.set("evaryn_google_area", area, {
    httpOnly: true, secure: true, sameSite: "lax", path: "/auth", maxAge: 600,
  });
  return response;
}
