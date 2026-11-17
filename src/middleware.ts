import { NextResponse, type NextRequest } from "next/server";
import { DEMO_SESSION_COOKIE } from "@/lib/cookie-names";
import { KNOWN_ACCOUNTS_COOKIE } from "@/lib/device-profiles";
import { updateSession } from "@/lib/supabase/middleware";

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie);
  });
}

function clearSavedAccounts(response: NextResponse) {
  response.cookies.set(KNOWN_ACCOUNTS_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}

export async function middleware(request: NextRequest) {
  const { response, userId } = await updateSession(request);
  const path = request.nextUrl.pathname;

  const isApp = path.startsWith("/app");
  const isAuth =
    path.startsWith("/login") ||
    path.startsWith("/signup") ||
    path.startsWith("/forgot-password");

  if (isApp && !userId) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    const hadSession =
      Boolean(request.cookies.get(DEMO_SESSION_COOKIE)?.value) ||
      request.cookies.getAll().some(
        (cookie) =>
          cookie.name.includes("auth-token") || cookie.name.startsWith("sb-"),
      );
    if (hadSession) url.searchParams.set("reason", "expired");
    const redirect = NextResponse.redirect(url);
    copyCookies(response, redirect);
    return clearSavedAccounts(redirect);
  }

  if (isAuth && userId) {
    const url = request.nextUrl.clone();
    url.pathname = "/app/account";
    url.search = "";
    const redirect = NextResponse.redirect(url);
    copyCookies(response, redirect);
    return clearSavedAccounts(redirect);
  }

  return clearSavedAccounts(response);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
