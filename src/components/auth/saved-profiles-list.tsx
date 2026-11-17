"use client";

import { DeviceProfileCard } from "@/components/auth/device-profile-card";
import { EmptyState } from "@/components/empty-state";
import type { DeviceProfile } from "@/lib/device-profiles";

export function SavedProfilesList({
  profiles,
  onContinue,
  onRemove,
  pending = false,
}: {
  profiles: DeviceProfile[];
  onContinue: (profile: DeviceProfile) => void;
  onRemove: (profile: DeviceProfile) => void;
  pending?: boolean;
}) {
  if (profiles.length === 0) {
    return (
      <EmptyState
        title="No accounts on this device"
        body="Log in or create an account. Tempora will remember a safe profile here so you can pick it next time — never the password."
      />
    );
  }

  return (
    <ul className="space-y-3">
      {profiles.map((profile) => (
        <li key={profile.userId}>
          <DeviceProfileCard
            profile={profile}
            pending={pending}
            onContinue={() => onContinue(profile)}
            onRemove={() => onRemove(profile)}
          />
        </li>
      ))}
    </ul>
  );
}
