export const KNOWN_ACCOUNTS_COOKIE = "tempora_known_accounts";
export const MAX_DEVICE_PROFILES = 8;

export type DeviceProfile = {
  userId: string;
  fullName: string;
  avatar: string;
  maskedEmail: string;
  lastUsedAt: string;
  phone: string;
};

/** @deprecated Use DeviceProfile. Kept so older cookies still parse. */
export type KnownAccount = {
  phone: string;
  fullName: string;
  plan?: string;
};

const SECRET_KEYS = [
  "password",
  "pass",
  "token",
  "accessToken",
  "access_token",
  "refreshToken",
  "refresh_token",
  "secret",
  "session",
  "cookie",
];

export function maskEmail(email: string) {
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.indexOf("@");
  if (at < 1 || at === trimmed.length - 1) return "";
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  const visible = local.slice(0, Math.min(1, local.length));
  return `${visible}•••@${domain}`;
}

export function maskPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 6) return "••••";
  return `+${digits.slice(0, 3)}•••${digits.slice(-2)}`;
}

export function avatarFromName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function avatarHue(userId: string) {
  let hash = 0;
  for (const char of userId) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash % 360;
}

export function sanitizeDeviceProfile(input: unknown): DeviceProfile | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as Record<string, unknown>;
  for (const key of SECRET_KEYS) {
    if (key in raw) {
      // Drop the whole row if a secret leaked into the device list.
      delete raw[key];
    }
  }

  const phone = typeof raw.phone === "string" ? raw.phone : "";
  const fullName =
    typeof raw.fullName === "string" && raw.fullName.trim()
      ? raw.fullName.trim()
      : phone || "Account";
  const userId =
    typeof raw.userId === "string" && raw.userId
      ? raw.userId
      : phone
        ? `user_${phone.replace(/\D/g, "")}`
        : "";
  if (!userId || !phone) return null;

  const lastUsedAt =
    typeof raw.lastUsedAt === "string" && !Number.isNaN(Date.parse(raw.lastUsedAt))
      ? raw.lastUsedAt
      : new Date(0).toISOString();

  return {
    userId,
    fullName,
    avatar:
      typeof raw.avatar === "string" && raw.avatar.trim()
        ? raw.avatar.trim().slice(0, 2).toUpperCase()
        : avatarFromName(fullName),
    maskedEmail:
      typeof raw.maskedEmail === "string"
        ? raw.maskedEmail
        : maskEmail(typeof raw.email === "string" ? raw.email : ""),
    lastUsedAt,
    phone,
  };
}

export function parseDeviceProfiles(value: unknown): DeviceProfile[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const profiles: DeviceProfile[] = [];
  for (const row of value) {
    const profile = sanitizeDeviceProfile(row);
    if (!profile || seen.has(profile.userId)) continue;
    seen.add(profile.userId);
    profiles.push(profile);
  }
  return profiles.slice(0, MAX_DEVICE_PROFILES);
}

export function mergeDeviceProfile(
  profiles: DeviceProfile[],
  incoming: DeviceProfile,
) {
  const rest = profiles.filter(
    (row) => row.userId !== incoming.userId && row.phone !== incoming.phone,
  );
  return [incoming, ...rest].slice(0, MAX_DEVICE_PROFILES);
}

export function removeDeviceProfile(
  profiles: DeviceProfile[],
  userId: string,
) {
  return profiles.filter((row) => row.userId !== userId && row.phone !== userId);
}

export function formatLastUsed(iso: string, now = Date.now()) {
  const then = Date.parse(iso);
  if (Number.isNaN(then) || then === 0) return "Not used yet";
  const delta = Math.max(0, now - then);
  const minutes = Math.floor(delta / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(then).toLocaleDateString();
}

/** Match a saved card as the person types their phone on login. */
export function matchSavedProfile(profiles: DeviceProfile[], input: string) {
  const digits = input.replace(/\D/g, "");
  if (digits.length < 6) return undefined;
  const exact = profiles.filter((row) => {
    const stored = row.phone.replace(/\D/g, "");
    return (
      stored === digits ||
      stored.endsWith(digits) ||
      digits.endsWith(stored) ||
      stored === `237${digits}` ||
      digits === `237${stored}`
    );
  });
  return exact.length === 1 ? exact[0] : undefined;
}

export function profileFromAuth(input: {
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  now?: Date;
}): DeviceProfile {
  return {
    userId: input.userId,
    fullName: input.fullName.trim() || input.phone,
    avatar: avatarFromName(input.fullName || input.phone),
    maskedEmail: maskEmail(input.email),
    lastUsedAt: (input.now ?? new Date()).toISOString(),
    phone: input.phone,
  };
}
