import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { response, userId } = await updateSession(request);
  const path = request.nextUrl.pathname;
  // Staff sign in lives under /admin but must stay reachable while signed out.
  const isAdminLogin = path.startsWith("/admin/login");
  const isAdmin = path.startsWith("/admin") && !isAdminLogin;
  const isApp = path.startsWith("/app") || isAdmin;
  const isAuth =
    path.startsWith("/login") ||
    path.startsWith("/signup") ||
    path.startsWith("/forgot-password");

  if (isApp && !userId) {
    const url = request.nextUrl.clone();
    url.pathname = isAdmin ? "/admin/login" : "/login";
    if (!isAdmin) url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  if (isAuth && userId) {
    const url = request.nextUrl.clone();
    url.pathname = "/app/account";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
