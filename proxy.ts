import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  // Override any client-supplied path header. The portal layout uses this
  // trusted routing hint to avoid running protected shell logic on login.
  request.headers.set("x-evaryn-portal-path", request.nextUrl.pathname);
  return updateSession(request);
}

export const config = {
  matcher: ["/portal/:path*"],
};
