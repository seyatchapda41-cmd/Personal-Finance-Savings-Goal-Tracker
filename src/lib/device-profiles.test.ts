import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password-hash";
import { loginEmailForPhone } from "@/lib/auth/phone-identity";
import { phoneLoginCandidates } from "@/lib/phone";
import {
  AUTH_MAX_FAILURES,
  authLockMessage,
  clearAuthLock,
  parseAuthLock,
  recordAuthFailure,
} from "@/lib/auth/rate-limit";
import {
  avatarFromName,
  formatLastUsed,
  maskEmail,
  maskPhone,
  matchSavedProfile,
  mergeDeviceProfile,
  parseDeviceProfiles,
  profileFromAuth,
  removeDeviceProfile,
  sanitizeDeviceProfile,
  type DeviceProfile,
} from "@/lib/device-profiles";

function sample(overrides: Partial<DeviceProfile> = {}): DeviceProfile {
  return {
    ...profileFromAuth({
      userId: "user_237600000000",
      fullName: "Ada Saver",
      email: "ada@example.com",
      phone: "+237600000000",
      now: new Date("2026-09-01T10:00:00.000Z"),
    }),
    ...overrides,
  };
}

describe("device profiles", () => {
  it("masks email and never keeps the full address", () => {
    expect(maskEmail("ada@example.com")).toBe("a•••@example.com");
    const profile = sample();
    expect(profile.maskedEmail).toBe("a•••@example.com");
    expect(JSON.stringify(profile)).not.toMatch(/ada@example.com/);
  });

  it("masks phone for display", () => {
    expect(maskPhone("+237600000000")).toBe("+237•••00");
  });

  it("matches a saved profile as the phone is typed", () => {
    const ada = sample();
    const bo = sample({
      userId: "user_237611111111",
      phone: "+237611111111",
      fullName: "Bo",
    });
    expect(matchSavedProfile([ada, bo], "+237600000000")?.fullName).toBe(
      "Ada Saver",
    );
    expect(matchSavedProfile([ada, bo], "600000000")?.fullName).toBe("Ada Saver");
    expect(matchSavedProfile([ada, bo], "600")).toBeUndefined();
  });

  it("builds initials for the avatar", () => {
    expect(avatarFromName("Ada Saver")).toBe("AS");
  });

  it("drops passwords, tokens and refresh secrets from stored profiles", () => {
    const dirty = {
      userId: "user_1",
      fullName: "Ada",
      phone: "+237600000000",
      email: "ada@example.com",
      password: "Secret123",
      access_token: "tok_live",
      refreshToken: "refresh_live",
    };
    const clean = sanitizeDeviceProfile(dirty);
    expect(clean).toMatchObject({
      userId: "user_1",
      fullName: "Ada",
      phone: "+237600000000",
    });
    expect(JSON.stringify(clean)).not.toMatch(/Secret123|tok_live|refresh_live/);
  });

  it("parses multiple profiles and ignores junk rows", () => {
    const profiles = parseDeviceProfiles([
      sample(),
      {
        userId: "user_237611111111",
        fullName: "Bo",
        phone: "+237611111111",
        maskedEmail: "b•••@x.com",
        avatar: "BO",
        lastUsedAt: "2026-08-01T00:00:00.000Z",
      },
      { password: "nope" },
    ]);
    expect(profiles).toHaveLength(2);
  });

  it("merges a returning profile to the front without duplicating", () => {
    const first = sample();
    const second = sample({
      userId: "user_237611111111",
      phone: "+237611111111",
      fullName: "Bo",
    });
    const merged = mergeDeviceProfile([first], {
      ...second,
      lastUsedAt: "2026-09-01T12:00:00.000Z",
    });
    expect(merged[0].userId).toBe("user_237611111111");
    const again = mergeDeviceProfile(merged, {
      ...second,
      lastUsedAt: "2026-09-01T13:00:00.000Z",
    });
    expect(again).toHaveLength(2);
    expect(again[0].lastUsedAt).toBe("2026-09-01T13:00:00.000Z");
  });

  it("removes a device profile without needing a server account id match on phone", () => {
    const ada = sample();
    const bo = sample({
      userId: "user_237611111111",
      phone: "+237611111111",
      fullName: "Bo",
    });
    expect(removeDeviceProfile([ada, bo], ada.userId)).toEqual([bo]);
    expect(removeDeviceProfile([ada, bo], ada.phone)).toEqual([bo]);
  });

  it("does not treat a saved profile as an authenticated session", () => {
    const profile = sample();
    expect(profile).not.toHaveProperty("session");
    expect("password" in profile).toBe(false);
    expect("accessToken" in profile).toBe(false);
  });

  it("formats last used for the card", () => {
    const now = Date.parse("2026-09-01T10:05:00.000Z");
    expect(formatLastUsed("2026-09-01T10:00:00.000Z", now)).toBe("5m ago");
  });
});

describe("auth rate limit", () => {
  it("locks after too many failures and clears on success", () => {
    let state = parseAuthLock(null);
    expect(authLockMessage(state)).toBeNull();
    for (let i = 0; i < AUTH_MAX_FAILURES; i += 1) {
      state = recordAuthFailure(state, 1_000);
    }
    expect(authLockMessage(state, 1_000)).toMatch(/Too many sign-in attempts/);
    expect(authLockMessage(clearAuthLock())).toBeNull();
  });

  it("unlocks after the window", () => {
    const locked = recordAuthFailure(
      { failures: AUTH_MAX_FAILURES - 1, lockedUntil: 0 },
      1_000,
    );
    expect(parseAuthLock(locked, 1_000 + 11 * 60 * 1000).failures).toBe(0);
  });
});

describe("cross-device login", () => {
  it("derives the same login address from a phone on every device", () => {
    expect(loginEmailForPhone("+237 600 000 000")).toBe(
      loginEmailForPhone("+237600000000"),
    );
    expect(loginEmailForPhone("+237600000000")).toMatch(/@phone\.tempora\.app$/);
    expect(loginEmailForPhone("650112233")).toBe(
      loginEmailForPhone("+237650112233"),
    );
    expect(loginEmailForPhone("00237689358878")).toBe(
      loginEmailForPhone("+237689358878"),
    );
    expect(loginEmailForPhone("0012025550123")).toBe(
      loginEmailForPhone("+1 202 555 0123"),
    );
    expect(loginEmailForPhone("+33612345678")).toBe(
      loginEmailForPhone("0033612345678"),
    );
    expect(loginEmailForPhone("+2348012345678")).not.toBe(
      loginEmailForPhone("+237689358878"),
    );
    expect(loginEmailForPhone("0012025550123")).not.toContain("237");
    expect(phoneLoginCandidates("651177751")).toContain("+237651177751");
    expect(phoneLoginCandidates("00237689358878")).toContain("+237689358878");
  });

  it("checks the password hash without keeping the raw password", () => {
    const stored = hashPassword("Secret123");
    expect(stored).not.toContain("Secret123");
    expect(verifyPassword("Secret123", stored)).toBe(true);
    expect(verifyPassword("Wrong1234", stored)).toBe(false);
  });
});

describe("registration and login profile cards", () => {
  it("creates a safe card after registration", () => {
    const registered = profileFromAuth({
      userId: "abc",
      fullName: "Camille",
      email: "camille@tempora.app",
      phone: "+237622222222",
    });
    expect(registered.avatar).toBe("CA");
    expect(registered.maskedEmail).toContain("•••");
    expect(registered.phone).toBe("+237622222222");
  });

  it("account switching only keeps the user id for the next password prompt", () => {
    const target = sample({ userId: "user_switch", phone: "+237633333333" });
    const loginUrl = `/login?profile=${encodeURIComponent(target.userId)}`;
    expect(loginUrl).toContain("user_switch");
    expect(loginUrl).not.toContain("password");
  });
});
