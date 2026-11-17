export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export const APP_NAME = "Tempora";
export const APP_TAGLINE = "Personal finance and savings goals, in one place.";
export const APP_VERSION = "1.0.0";

