// Phone number is the login credential for every account type, so it is
// normalized to a single canonical form before it reaches storage or Supabase.
function internationalDigits(input: string) {
  let digits = input.replace(/\D/g, "");
  // 00 is the international prefix used instead of + in many countries.
  if (digits.startsWith("00")) digits = digits.slice(2);
  return digits;
}

export function normalizePhone(input: string) {
  const digits = internationalDigits(input);
  if (!digits) return "";
  return `+${digits}`;
}

// The number that is saved and later used to sign in. A full international
// number stays as itself. A 9-digit Cameroon mobile with no country code is
// stored as +237 so the same person can type either form.
export function canonicalPhone(input: string) {
  const normalized = normalizePhone(input);
  const digits = normalized.replace(/\D/g, "");
  if (digits.length === 9 && digits.startsWith("6")) return `+237${digits}`;
  return normalized;
}

export function isValidPhone(input: string) {
  const normalized = normalizePhone(input);
  return /^\+\d{8,15}$/.test(normalized);
}

export function formatPhone(phone: string) {
  return normalizePhone(phone) || phone;
}

export function phoneDigits(input: string) {
  return input.replace(/\D/g, "");
}

/** Same account from any country: +237, 00237, spaces, or a local 9-digit Cameroon number. */
export function phoneLoginCandidates(input: string) {
  const root = internationalDigits(input);
  const forms = new Set<string>();
  if (root) forms.add(root);
  if (root.startsWith("0") && root.length > 1) forms.add(root.slice(1));

  const candidates = new Set<string>();
  for (const digits of forms) {
    candidates.add(`+${digits}`);
    candidates.add(digits);
    if (digits.length === 9 && digits.startsWith("6")) {
      candidates.add(`+237${digits}`);
      candidates.add(`237${digits}`);
    }
    if (digits.startsWith("237") && digits.length >= 11) {
      candidates.add(`+${digits}`);
      candidates.add(digits);
    }
  }
  return [...candidates];
}

export const PHONE_HINT =
  "Use the same number you registered, with its country code. +237 and 00237 both work from any country.";
