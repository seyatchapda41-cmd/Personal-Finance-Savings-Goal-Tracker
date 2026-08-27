import { normalizePhone } from "@/lib/phone";

// Supabase phone auth needs a paid SMS provider to send verification codes.
// The phone number stays the credential clients type, while the account is held
// under an address derived from it. Clients never see or use this address; their
// real email lives in user metadata and in profiles.email.
const LOGIN_EMAIL_DOMAIN = "phone.tempora.app";

export function loginEmailForPhone(phone: string) {
  const digits = normalizePhone(phone).replace(/\D/g, "");
  return `p${digits}@${LOGIN_EMAIL_DOMAIN}`;
}

export function isLoginEmail(email: string | null | undefined) {
  return Boolean(email?.endsWith(`@${LOGIN_EMAIL_DOMAIN}`));
}
