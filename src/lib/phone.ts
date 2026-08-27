// Phone number is the login credential for every account type, so it is
// normalized to a single canonical form before it reaches storage or Supabase.
export function normalizePhone(input: string) {
  const stripped = input.replace(/[\s().-]/g, "");
  if (!stripped) return "";
  const digits = stripped.replace(/^\+/, "");
  if (!/^\d+$/.test(digits)) return "";
  return `+${digits}`;
}

export function isValidPhone(input: string) {
  const normalized = normalizePhone(input);
  return /^\+\d{8,15}$/.test(normalized);
}

export function formatPhone(phone: string) {
  return normalizePhone(phone) || phone;
}

export const PHONE_HINT = "Include your country code.";
