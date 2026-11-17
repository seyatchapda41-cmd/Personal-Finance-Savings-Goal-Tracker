"use client";

import { ProfileAvatar } from "@/components/auth/profile-avatar";
import {
  formatLastUsed,
  maskPhone,
  type DeviceProfile,
} from "@/lib/device-profiles";

export function DeviceProfileCard({
  profile,
  onContinue,
  onRemove,
  pending = false,
}: {
  profile: DeviceProfile;
  onContinue: () => void;
  onRemove: () => void;
  pending?: boolean;
}) {
  return (
    <article className="card flex flex-col gap-4 sm:flex-row sm:items-center">
      <ProfileAvatar avatar={profile.avatar} userId={profile.userId} />
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-semibold">{profile.fullName}</h3>
        <p className="mt-0.5 truncate text-sm">{profile.phone}</p>
        {profile.maskedEmail ? (
          <p className="truncate text-sm text-mute">{profile.maskedEmail}</p>
        ) : (
          <p className="truncate text-sm text-mute">{maskPhone(profile.phone)}</p>
        )}
        <p className="mt-1 text-xs text-mute">
          Last used {formatLastUsed(profile.lastUsedAt)}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-primary"
          onClick={onContinue}
          disabled={pending}
        >
          Continue
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={onRemove}
          disabled={pending}
        >
          Remove
        </button>
      </div>
    </article>
  );
}
