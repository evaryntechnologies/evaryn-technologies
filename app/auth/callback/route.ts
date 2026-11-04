import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  const areaCookie = request.cookies.get("evaryn_google_area")?.value;
  const area = areaCookie === "experts" ? "experts" : areaCookie === "clients" ? "clients" : null;
  const origin = "https://evaryninc.com";

  function finish(path: string) {
    const response = NextResponse.redirect(`${origin}${path}`);
    response.cookies.set("evaryn_google_area", "", {
      path: "/auth", httpOnly: true, secure: true, sameSite: "lax", maxAge: 0,
    });
    return response;
  }

  if (!area) return finish("/clients/login?error=google");
  const code = request.nextUrl.searchParams.get("code");
  if (!code || request.nextUrl.searchParams.has("error")) {
    return finish(`/${area}/login?error=google`);
  }

  try {
    const supabase = await createClient();
    const flowId = request.nextUrl.searchParams.get("sb_flow_id");
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
      code, flowId ? { flowId } : undefined
    );
    if (exchangeError) return finish(`/${area}/login?error=google`);
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user || !user.email || !user.email_confirmed_at) {
      await supabase.auth.signOut();
      return finish(`/${area}/login?error=google`);
    }

    const [employee, client, expert] = await Promise.all([
      prisma.employeeProfile.findUnique({ where: { authUserId: user.id }, select: { status: true, role: true } }),
      prisma.clientProfile.findUnique({ where: { authUserId: user.id } }),
      prisma.expertApplication.findUnique({ where: { authUserId: user.id }, select: { id: true } }),
    ]);

    // Database records and server-owned app_metadata determine privileged access.
    // Google sign-in must not authorize a staff account through a client login.
    if (area === "clients") {
      if (employee || expert || user.app_metadata?.role ||
          (user.user_metadata?.evaryn_account_type && user.user_metadata.evaryn_account_type !== "CLIENT") ||
          (client && client.status !== "ACTIVE")) {
        await supabase.auth.signOut();
        return finish("/clients/login?error=unauthorized");
      }
      if (!client) {
        const fullName = String(user.user_metadata?.full_name || user.user_metadata?.name || user.email.split("@")[0]).trim().slice(0, 150);
        if (fullName.length < 2) return finish("/clients/login?error=profile");
        await prisma.clientProfile.upsert({
          where: { authUserId: user.id }, update: {},
          create: { authUserId: user.id, email: user.email.toLowerCase(), fullName, companyName: null },
        });
      }
      if (user.user_metadata?.evaryn_account_type !== "CLIENT") {
        const { error } = await supabase.auth.updateUser({ data: { evaryn_account_type: "CLIENT" } });
        if (error) return finish("/clients/login?error=profile");
      }
      return finish("/client-portal");
    }

    // Expert accounts cannot be created over an existing client identity.
    if (client || (user.user_metadata?.evaryn_account_type && user.user_metadata.evaryn_account_type !== "EXPERT")) {
      await supabase.auth.signOut();
      return finish("/experts/login?error=unauthorized");
    }
    // Preserve the existing expert-to-employee transition after approval.
    if (employee || user.app_metadata?.role) {
      if (employee?.status === "ACTIVE" && user.app_metadata?.role === employee.role) return finish("/portal");
      await supabase.auth.signOut();
      return finish("/experts/login?error=unauthorized");
    }
    if (user.user_metadata?.evaryn_account_type !== "EXPERT") {
      const { error } = await supabase.auth.updateUser({
        data: { evaryn_account_type: "EXPERT" },
      });
      if (error) return finish("/experts/login?error=google");
    }
    // No expert application or approval is created automatically.
    return finish("/experts/application");
  } catch (error) {
    console.error("Evaryn Google OAuth callback failed", error instanceof Error ? error.name : "unknown");
    return finish(`/${area}/login?error=google`);
  }
}
