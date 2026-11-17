export const AUTH_MAX_FAILURES = 8;
export const AUTH_LOCK_MS = 10 * 60 * 1000;

export type AuthLockState = {
  failures: number;
  lockedUntil: number;
};

export function parseAuthLock(value: unknown, now = Date.now()): AuthLockState {
  if (!value || typeof value !== "object") {
    return { failures: 0, lockedUntil: 0 };
  }
  const raw = value as Record<string, unknown>;
  const failures =
    typeof raw.failures === "number" && raw.failures >= 0 ? raw.failures : 0;
  const lockedUntil =
    typeof raw.lockedUntil === "number" ? raw.lockedUntil : 0;
  if (lockedUntil && lockedUntil <= now) {
    return { failures: 0, lockedUntil: 0 };
  }
  return { failures, lockedUntil };
}

export function authLockMessage(state: AuthLockState, now = Date.now()) {
  if (state.lockedUntil > now) {
    const minutes = Math.max(1, Math.ceil((state.lockedUntil - now) / 60_000));
    return `Too many sign-in attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;
  }
  return null;
}

export function recordAuthFailure(
  state: AuthLockState,
  now = Date.now(),
): AuthLockState {
  const current = parseAuthLock(state, now);
  const failures = current.failures + 1;
  if (failures >= AUTH_MAX_FAILURES) {
    return { failures, lockedUntil: now + AUTH_LOCK_MS };
  }
  return { failures, lockedUntil: 0 };
}

export function clearAuthLock(): AuthLockState {
  return { failures: 0, lockedUntil: 0 };
}
