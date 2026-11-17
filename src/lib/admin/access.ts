import { canonicalPhone } from "@/lib/phone";

// The founder is identified by phone number, listed in ADMIN_PHONES as a
// comma separated list. No allowlist means no panel.
export function adminPhones() {
  return (process.env.ADMIN_PHONES ?? "")
    .split(",")
    .map((entry) => canonicalPhone(entry.trim()))
    .filter(Boolean);
}

export function adminConfigured() {
  return adminPhones().length > 0;
}

export function isAdminPhone(phone: string) {
  const allowed = adminPhones();
  if (allowed.length === 0) return false;
  return allowed.includes(canonicalPhone(phone));
}
