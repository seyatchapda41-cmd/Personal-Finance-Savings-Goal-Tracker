import { STAFF_DESK_COOKIE } from "@/lib/cookie-names";

const YEAR = 60 * 60 * 24 * 365;

export { STAFF_DESK_COOKIE };

export function staffDeskCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: YEAR,
  };
}

export function adminDeskKey() {
  return (process.env.ADMIN_DESK_KEY ?? "").trim();
}

/** True when this request is unlocking the founder door on this browser. */
export function isStaffDeskUnlock(value: string | null | undefined) {
  if (!value) return false;
  const key = adminDeskKey();
  if (key) return value === key;
  // Local only: first visit with ?desk=open marks this machine.
  return process.env.NODE_ENV !== "production" && value === "open";
}

export function hasStaffDeskCookie(store: {
  get(name: string): { value: string } | undefined;
}) {
  return store.get(STAFF_DESK_COOKIE)?.value === "on";
}
