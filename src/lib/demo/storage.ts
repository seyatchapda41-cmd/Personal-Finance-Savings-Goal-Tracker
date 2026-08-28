import { emptySnapshot } from "@/lib/seed";
import type { FinanceSnapshot, Profile } from "@/lib/types";

const PREFIX = "tempora.finance.";

function keyFor(userId: string) {
  return `${PREFIX}${userId}`;
}

export function loadSnapshot(profile: Profile): FinanceSnapshot {
  if (typeof window === "undefined") return emptySnapshot(profile);
  const raw = window.localStorage.getItem(keyFor(profile.id));
  if (!raw) {
    const seeded = emptySnapshot(profile);
    saveSnapshot(seeded);
    return seeded;
  }
  try {
    const parsed = JSON.parse(raw) as FinanceSnapshot;
    return {
      ...parsed,
      profile: { ...parsed.profile, ...profile },
      transactions: (parsed.transactions ?? []).map((tx) => ({
        ...tx,
        origin:
          tx.origin === "admin" || tx.origin === "reversal" ? tx.origin : "client",
        reversesId: tx.reversesId ?? null,
      })),
    };
  } catch {
    const seeded = emptySnapshot(profile);
    saveSnapshot(seeded);
    return seeded;
  }
}

export function saveSnapshot(snapshot: FinanceSnapshot) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(keyFor(snapshot.profile.id), JSON.stringify(snapshot));
}

export function clearSnapshot(userId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(keyFor(userId));
}

export function resetSnapshot(profile: Profile): FinanceSnapshot {
  const seeded = emptySnapshot(profile);
  saveSnapshot(seeded);
  return seeded;
}
