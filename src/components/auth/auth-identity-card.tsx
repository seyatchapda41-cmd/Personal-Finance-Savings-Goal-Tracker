"use client";

import { ProfileAvatar } from "@/components/auth/profile-avatar";
import { avatarFromName } from "@/lib/device-profiles";
import { formatPhone } from "@/lib/phone";

export function AuthIdentityCard({
  fullName,
  phone,
  email,
  userId,
  avatar,
  caption,
}: {
  fullName?: string;
  phone?: string;
  email?: string;
  userId?: string;
  avatar?: string;
  caption?: string;
}) {
  const name = fullName?.trim() || "Your account";
  const initials = avatar || avatarFromName(name);
  const id = userId || phone || name;
  const displayPhone = phone ? formatPhone(phone) : "";

  return (
    <div className="card flex items-center gap-4">
      <ProfileAvatar avatar={initials} userId={id} size={56} />
      <div className="min-w-0">
        <p className="truncate text-lg font-semibold">{name}</p>
        {displayPhone ? (
          <p className="mt-0.5 truncate text-sm">{displayPhone}</p>
        ) : (
          <p className="mt-0.5 truncate text-sm text-mute">Phone appears as you type</p>
        )}
        {email ? <p className="truncate text-sm text-mute">{email}</p> : null}
        {caption ? <p className="mt-1 text-xs text-mute">{caption}</p> : null}
      </div>
    </div>
  );
}
