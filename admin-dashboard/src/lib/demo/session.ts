import { cookies } from "next/headers";
import { DEMO_SESSION_COOKIE, RESET_BOOKS_COOKIE } from "@/lib/cookie-names";
import type { DemoAccount } from "@/lib/demo/accounts";
import { userIdFromPhone } from "@/lib/ids";

// Demo mode stands in for a real session: the signed-in account travels in a
// cookie, and the books are reset on arrival.
export async function setDemoSession(phone: string, account: DemoAccount) {
  const store = await cookies();
  store.set(
    DEMO_SESSION_COOKIE,
    JSON.stringify({
      id: userIdFromPhone(phone),
      phone,
      email: account.email,
      fullName: account.fullName,
      plan: account.plan,
    }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    },
  );
  store.set(RESET_BOOKS_COOKIE, "1", {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60,
  });
}
