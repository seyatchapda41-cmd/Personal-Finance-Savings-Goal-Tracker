"use client";

import { useState } from "react";
import {
  forgetAccountAction,
  switchAccountAction,
} from "@/app/actions/auth";
import { ProfileAvatar } from "@/components/auth/profile-avatar";
import { RemoveProfileDialog } from "@/components/auth/remove-profile-dialog";
import { maskPhone, type DeviceProfile } from "@/lib/device-profiles";

export function AccountSwitcher({
  currentUserId,
  currentName,
  profiles,
}: {
  currentUserId: string;
  currentName: string;
  profiles: DeviceProfile[];
}) {
  const [open, setOpen] = useState(false);
  const [removing, setRemoving] = useState<DeviceProfile | null>(null);
  const [pending, setPending] = useState(false);
  const others = profiles.filter((row) => row.userId !== currentUserId);
  const current =
    profiles.find((row) => row.userId === currentUserId) ?? {
      userId: currentUserId,
      fullName: currentName,
      avatar: currentName.slice(0, 2).toUpperCase() || "?",
      maskedEmail: "",
      lastUsedAt: new Date().toISOString(),
      phone: "",
    };

  return (
    <div className="relative">
      <button
        type="button"
        className="flex w-full items-center gap-2 rounded-lg border border-white/20 px-2 py-1.5 text-left text-sm text-white hover:border-white/40"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((value) => !value)}
      >
        <ProfileAvatar avatar={current.avatar} userId={current.userId} size={28} />
        <span className="min-w-0 flex-1 truncate">{current.fullName}</span>
        <span className="text-xs text-white/70">Switch</span>
      </button>
      {open ? (
        <div
          className="absolute bottom-full left-0 z-40 mb-2 w-72 rounded-[var(--radius-lg)] border border-line bg-panel p-2 text-ink shadow-lg md:bottom-auto md:top-full md:mt-2"
          role="listbox"
          aria-label="Accounts on this device"
        >
          <p className="px-2 py-1 text-xs text-mute">
            Switching signs you out, then asks for that account’s password.
          </p>
          {others.length === 0 ? (
            <p className="px-2 py-3 text-sm text-mute">
              No other profiles on this device.
            </p>
          ) : (
            <ul className="mt-1 space-y-1">
              {others.map((profile) => (
                <li key={profile.userId}>
                  <div className="flex items-center gap-1">
                    <form
                      className="min-w-0 flex-1"
                      action={async (formData) => {
                        setPending(true);
                        await switchAccountAction(formData);
                      }}
                    >
                      <input type="hidden" name="userId" value={profile.userId} />
                      <button
                        type="submit"
                        className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-sand"
                        disabled={pending}
                      >
                        <ProfileAvatar
                          avatar={profile.avatar}
                          userId={profile.userId}
                          size={28}
                        />
                        <span className="min-w-0">
                          <span className="block truncate font-medium">
                            {profile.fullName}
                          </span>
                          <span className="block truncate text-xs text-mute">
                            {profile.maskedEmail || maskPhone(profile.phone)}
                          </span>
                        </span>
                      </button>
                    </form>
                    <button
                      type="button"
                      className="shrink-0 px-2 text-xs text-mute hover:text-danger"
                      onClick={() => setRemoving(profile)}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <form action={switchAccountAction} className="mt-1 border-t border-line pt-1">
            <input type="hidden" name="userId" value="" />
            <button
              type="submit"
              className="w-full rounded-md px-2 py-2 text-left text-sm hover:bg-sand"
            >
              Use another account
            </button>
          </form>
        </div>
      ) : null}
      {removing ? (
        <RemoveProfileDialog
          profile={removing}
          pending={pending}
          onCancel={() => setRemoving(null)}
          onConfirm={async () => {
            setPending(true);
            await forgetAccountAction(removing.userId);
            setRemoving(null);
            setPending(false);
          }}
        />
      ) : null}
    </div>
  );
}
