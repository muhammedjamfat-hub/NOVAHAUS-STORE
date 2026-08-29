import { NextRequest, NextResponse } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase-middleware";

// Protects every /admin route (except /admin/login) at the network level.
// This is a real gate, not "hiding" the URL: unauthenticated or non-admin
// requests are redirected before any admin page or data ever renders.
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/admin")) return NextResponse.next();
  if (pathname === "/admin/login") return NextResponse.next();

  const { supabase, response } = createMiddlewareClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return NextResponse.redirect(new URL("/admin/login?error=not_admin", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
