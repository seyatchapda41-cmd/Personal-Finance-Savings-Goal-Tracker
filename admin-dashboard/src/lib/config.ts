export function isAdminLocal() {
  const flag = process.env.ADMIN_LOCAL?.trim().toLowerCase();
  return flag === "1" || flag === "true" || flag === "yes";
}

export function isSupabaseConfigured() {
  if (isAdminLocal()) return false;
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export const APP_NAME = "Tempora";
export const APP_TAGLINE = "Personal finance and savings goals, in one place.";
export const APP_VERSION = "1.0.0";

const PUBLISHED_CUSTOMER_URL = "https://tempora-five.vercel.app";
const PUBLISHED_ADMIN_URL = "https://tempora-admin.vercel.app";

function publishedUrl(value: string | undefined, fallback: string) {
  const configured = value?.trim().replace(/\/$/, "") ?? "";
  if (
    configured &&
    !/localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]/.test(configured)
  ) {
    return configured;
  }
  return fallback;
}

/** Customer site other phones and computers can open. */
export const CUSTOMER_APP_URL = publishedUrl(
  process.env.NEXT_PUBLIC_WEB_URL || process.env.NEXT_PUBLIC_SITE_URL,
  PUBLISHED_CUSTOMER_URL,
);

/** Founder panel other phones and computers can open. */
export const ADMIN_APP_URL = publishedUrl(
  process.env.NEXT_PUBLIC_ADMIN_URL,
  PUBLISHED_ADMIN_URL,
);
