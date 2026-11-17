"use client";

import { ProfileAvatar } from "@/components/auth/profile-avatar";
import type { DeviceProfile } from "@/lib/device-profiles";

export function RemoveProfileDialog({
  profile,
  pending,
  error,
  onCancel,
  onConfirm,
}: {
  profile: DeviceProfile;
  pending: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="remove-profile-title"
    >
      <div className="card max-w-md shadow-lg">
        <div className="flex items-start gap-3">
          <ProfileAvatar avatar={profile.avatar} userId={profile.userId} size={40} />
          <div>
            <h2 id="remove-profile-title" className="text-lg font-semibold">
              Remove {profile.fullName} from this device?
            </h2>
            <p className="mt-2 text-sm text-mute">
              This only forgets the profile card on this browser. The real
              account stays. You can still log in with the phone number and
              password.
            </p>
          </div>
        </div>
        {error ? (
          <p className="mt-4 text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={pending}>
            Keep on this device
          </button>
          <button type="button" className="btn-danger" onClick={onConfirm} disabled={pending}>
            {pending ? "Removing…" : "Remove from device"}
          </button>
        </div>
      </div>
    </div>
  );
}
