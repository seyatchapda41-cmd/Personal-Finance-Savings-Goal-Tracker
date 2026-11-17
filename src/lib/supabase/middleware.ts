import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import { DEMO_SESSION_COOKIE } from "@/lib/cookie-names";
import { supabaseFetch } from "@/lib/supabase/fetch";

export {
  DEMO_ACCOUNTS_COOKIE,
  DEMO_SESSION_COOKIE,
  RESET_BOOKS_COOKIE,
} from "@/lib/cookie-names";

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({ request });

  if (isSupabaseConfigured()) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { fetch: supabaseFetch },
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value),
            );
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options),
            );
          },
        },
      },
    );
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return { response, userId: user?.id ?? null, phone: user?.phone ?? null };
    } catch {
      // A saved browser card is not the account. When the database is
      // configured, only a real session from that database can sign someone in.
      return { response, userId: null, phone: null };
    }
  }

  const raw = request.cookies.get(DEMO_SESSION_COOKIE)?.value;
  if (!raw) return { response, userId: null, phone: null };
  try {
    const parsed = JSON.parse(raw) as { id: string; phone?: string };
    if (!parsed.phone) return { response, userId: null, phone: null };
    return { response, userId: parsed.id, phone: parsed.phone };
  } catch {
    return { response, userId: null, phone: null };
  }
}
