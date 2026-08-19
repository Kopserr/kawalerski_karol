import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const LOGIN_PATH = "/admin";
const DASHBOARD_PATH = "/admin/dashboard";

/** Protects the whole /admin/* tree (BRIEF §8: "middleware chroni cały
 * /admin/*"). Without Supabase configured there's no session to check —
 * the admin pages themselves render a "backend not configured" state, so
 * the middleware just steps aside rather than locking everyone out. */
export async function middleware(request: NextRequest) {
  if (!isSupabaseConfigured()) return NextResponse.next();

  const { supabaseResponse, user } = await updateSession(request);
  const isLoginPage = request.nextUrl.pathname === LOGIN_PATH;

  if (!user && !isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    return NextResponse.redirect(url);
  }

  if (user && isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = DASHBOARD_PATH;
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/admin/:path*"],
};
