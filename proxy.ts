import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  // Trust only the real request path, not a client-provided header.
  request.headers.set(
    "x-evaryn-portal-path",
    request.nextUrl.pathname
  );

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!api/|_next/|.*\\..*).*)",
  ],
};
