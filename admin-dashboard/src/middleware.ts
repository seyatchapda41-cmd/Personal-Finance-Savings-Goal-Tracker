import { NextResponse, type NextRequest } from "next/server";
import {
  isStaffDeskUnlock,
  staffDeskCookieOptions,
} from "@/lib/admin/desk";
import {
  ADMIN_AUTH_COOKIE,
  DEMO_SESSION_COOKIE,
  STAFF_DESK_COOKIE,
} from "@/lib/cookie-names";
import { updateSession } from "@/lib/supabase/middleware";

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie);
  });
}

export async function middleware(request: NextRequest) {
  const { response, userId } = await updateSession(request);
  const path = request.nextUrl.pathname;
  const isLogin = path.startsWith("/login");
  const isPublic = isLogin;

  if (isLogin && isStaffDeskUnlock(request.nextUrl.searchParams.get("desk"))) {
    const url = request.nextUrl.clone();
    url.searchParams.delete("desk");
    const redirect = NextResponse.redirect(url);
    copyCookies(response, redirect);
    redirect.cookies.set(STAFF_DESK_COOKIE, "on", staffDeskCookieOptions());
    return redirect;
  }

  if (!isPublic && !userId) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    const hadSession =
      Boolean(request.cookies.get(DEMO_SESSION_COOKIE)?.value) ||
      request.cookies.getAll().some((cookie) =>
        cookie.name.startsWith(ADMIN_AUTH_COOKIE),
      );
    if (hadSession) url.searchParams.set("reason", "expired");
    const redirect = NextResponse.redirect(url);
    copyCookies(response, redirect);
    return redirect;
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
