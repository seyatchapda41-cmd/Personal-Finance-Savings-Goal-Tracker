"use client";

import { useEffect, useMemo, useState } from "react";
import { peekAccountAction } from "@/app/actions/auth";
import { AuthIdentityCard } from "@/components/auth/auth-identity-card";
import { Notice } from "@/components/notice";
import { VisibleField } from "@/components/visible-field";
import {
  matchSavedProfile,
  type DeviceProfile,
} from "@/lib/device-profiles";
import { MIN_PASSWORD_LENGTH } from "@/lib/password";
import { isValidPhone, PHONE_HINT } from "@/lib/phone";

export function LoginForm({
  action,
  nextPath,
  defaultPhone,
  lockedPhone = false,
  accountName,
  profile,
  profiles = [],
  footer,
}: {
  action: (formData: FormData) => Promise<{ error?: string } | void>;
  nextPath?: string;
  defaultPhone?: string;
  lockedPhone?: boolean;
  accountName?: string;
  profile?: DeviceProfile;
  profiles?: DeviceProfile[];
  footer?: React.ReactNode;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [phone, setPhone] = useState(profile?.phone || defaultPhone || "");
  const [password, setPassword] = useState("");
  const [remote, setRemote] = useState<{
    fullName?: string;
    maskedEmail?: string;
  }>({});

  const shown = useMemo(() => {
    if (profile) return profile;
    return matchSavedProfile(profiles, phone);
  }, [profile, profiles, phone]);

  useEffect(() => {
    if (profile || !isValidPhone(phone)) {
      setRemote({});
      return;
    }
    const timer = setTimeout(() => {
      const data = new FormData();
      data.set("phone", phone);
      void peekAccountAction(data).then((found) => setRemote(found));
    }, 400);
    return () => clearTimeout(timer);
  }, [phone, profile]);

  return (
    <form
      className="space-y-4"
      action={async (formData) => {
        setPending(true);
        setError(null);
        const result = await action(formData);
        if (result?.error) setError(result.error);
        setPending(false);
      }}
    >
      {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}
      <AuthIdentityCard
        fullName={shown?.fullName || remote.fullName || accountName}
        phone={shown?.phone || phone}
        email={shown?.maskedEmail || remote.maskedEmail}
        userId={shown?.userId}
        avatar={shown?.avatar}
        caption={
          shown || remote.fullName
            ? "This account works on any device. Confirm with your password."
            : "Use the same phone and password on any phone or computer."
        }
      />
      <VisibleField
        label="Phone number"
        name="phone"
        type="tel"
        required
        inputMode="tel"
        autoComplete="username"
        value={phone}
        readOnly={lockedPhone}
        onChange={(event) => setPhone(event.target.value)}
        hint={PHONE_HINT}
      />
      <VisibleField
        label="Password"
        name="password"
        type="password"
        required
        minLength={MIN_PASSWORD_LENGTH}
        autoComplete="current-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      {error ? <Notice tone="bad">{error}</Notice> : null}
      <button className="btn-primary w-full" type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Log in"}
      </button>
      {footer}
    </form>
  );
}
