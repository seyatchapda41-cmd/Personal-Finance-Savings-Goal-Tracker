import { loginEmailForPhone } from "@/lib/auth/phone-identity";
import { canonicalPhone, phoneDigits, phoneLoginCandidates } from "@/lib/phone";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { isAuthNetworkError } from "@/lib/supabase/fetch";
import { createServerSupabase } from "@/lib/supabase/server";

export function authUserPayload(input: {
  phone: string;
  password: string;
  fullName: string;
  email?: string;
  plan?: string;
  staff?: boolean;
}) {
  const phone = canonicalPhone(input.phone);
  return {
    email: loginEmailForPhone(phone),
    password: input.password,
    email_confirm: true,
    phone,
    phone_confirm: true,
    user_metadata: {
      full_name: input.fullName,
      email: input.email ?? "",
      plan: input.plan ?? "free",
      phone,
      ...(input.staff ? { staff: true } : {}),
    },
  };
}

export async function createAuthUser(
  input: Parameters<typeof authUserPayload>[0],
) {
  const admin = createAdminSupabase();
  if (!admin) {
    return { error: { message: "SUPABASE_SERVICE_ROLE_KEY is missing." } };
  }
  const payload = authUserPayload(input);
  const first = await admin.auth.admin.createUser(payload);
  if (first.error && isAuthNetworkError(first.error.message)) {
    return first;
  }
  if (
    first.error &&
    /phone/i.test(first.error.message) &&
    !/already/i.test(first.error.message)
  ) {
    const { phone: _phone, phone_confirm: _confirmed, ...rest } = payload;
    return admin.auth.admin.createUser(rest);
  }
  return first;
}

export async function findProfileByPhone(phone: string) {
  const admin = createAdminSupabase();
  if (!admin) return null;
  const wanted = new Set(phoneLoginCandidates(phone).map(phoneDigits));
  if (wanted.size === 0) return null;
  const clauses = [...wanted].flatMap((digits) => [
    `phone.eq.+${digits}`,
    `phone.eq.${digits}`,
  ]);
  const { data, error } = await admin
    .from("profiles")
    .select("id, full_name, email, phone")
    .or(clauses.join(","));
  if (error || !data?.length) return null;
  const match = data.find((row) => wanted.has(phoneDigits(row.phone ?? "")));
  return match ?? data[0];
}

/** Sign in with the phone the customer types. The account lives in the database, so the same phone and password work on any device. */
export async function signInWithPhonePassword(phone: string, password: string) {
  const supabase = await createServerSupabase();
  if (!supabase) return { error: "Supabase is not available." };

  const tried = new Set<string>();

  async function tryEmail(email: string | null | undefined) {
    if (!email || tried.has(email)) return null;
    tried.add(email);
    const attempt = await supabase!.auth.signInWithPassword({ email, password });
    if (!attempt.error) return { ok: true as const };
    if (isAuthNetworkError(attempt.error.message)) {
      return { error: attempt.error.message };
    }
    return null;
  }

  const primary = await tryEmail(loginEmailForPhone(phone));
  if (primary && "ok" in primary) return {};
  if (primary?.error) return { error: primary.error };

  const profile = await findProfileByPhone(phone);
  const admin = profile?.id ? createAdminSupabase() : null;
  if (profile?.id && admin) {
    const { data } = await admin.auth.admin.getUserById(profile.id);
    const storedEmail = await tryEmail(data.user?.email);
    if (storedEmail && "ok" in storedEmail) return {};
    if (storedEmail?.error) return { error: storedEmail.error };

    const storedPhone = data.user?.phone;
    if (storedPhone) {
      const byPhone = await supabase.auth.signInWithPassword({
        phone: storedPhone.startsWith("+") ? storedPhone : `+${storedPhone}`,
        password,
      });
      if (!byPhone.error) return {};
      if (isAuthNetworkError(byPhone.error.message)) {
        return { error: byPhone.error.message };
      }
    }
  }

  for (const candidate of phoneLoginCandidates(phone)) {
    const attempt = await tryEmail(loginEmailForPhone(candidate));
    if (attempt && "ok" in attempt) return {};
    if (attempt?.error) return { error: attempt.error };
  }

  return {
    error: "That phone number and password do not match an account.",
  };
}
