"use client";

import { useState } from "react";
import { adminSaveSettingsAction } from "@/app/actions/admin";
import { Card } from "@/components/admin/ui";
import type { PlatformSettings } from "@/lib/admin/settings";

function Toggle({
  name,
  label,
  hint,
  defaultChecked,
}: {
  name: string;
  label: string;
  hint: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex items-start gap-3">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-1 h-4 w-4"
      />
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="ad-muted block text-xs">{hint}</span>
      </span>
    </label>
  );
}

export function SettingsForm({
  settings,
  disabled,
  updatedBy,
  updatedAt,
}: {
  settings: PlatformSettings;
  disabled: boolean;
  updatedBy: string;
  updatedAt: string | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  return (
    <Card>
      <form
        className="space-y-5"
        action={async (formData) => {
          setPending(true);
          setError(null);
          setSaved(false);
          const result = await adminSaveSettingsAction(formData);
          if (result.error) setError(result.error);
          else setSaved(true);
          setPending(false);
        }}
      >
        <div className="space-y-4">
          <Toggle
            name="maintenanceMode"
            label="Maintenance mode"
            hint="Closes the client app and public pages. This panel stays open to you."
            defaultChecked={settings.maintenanceMode}
          />
          <label className="block text-sm">
            Message shown during maintenance
            <textarea
              className="ad-input mt-1 min-h-20"
              name="maintenanceMessage"
              defaultValue={settings.maintenanceMessage}
              maxLength={500}
            />
          </label>
        </div>

        <hr className="ad-divide" style={{ borderColor: "var(--ad-border)" }} />

        <div className="space-y-4">
          <Toggle
            name="announcementActive"
            label="Show announcement"
            hint="Displays a banner at the top of every page for every visitor."
            defaultChecked={settings.announcementActive}
          />
          <label className="block text-sm">
            Announcement
            <textarea
              className="ad-input mt-1 min-h-20"
              name="announcement"
              defaultValue={settings.announcement}
              maxLength={500}
              placeholder="Premium is half price this month."
            />
          </label>
        </div>

        <hr className="ad-divide" style={{ borderColor: "var(--ad-border)" }} />

        <Toggle
          name="signupsEnabled"
          label="Allow new signups"
          hint="Turn off to stop new accounts being created without closing the site."
          defaultChecked={settings.signupsEnabled}
        />

        {disabled ? (
          <p className="text-xs" style={{ color: "var(--ad-warn)" }}>
            These switches need the database. Connect Supabase to use them.
          </p>
        ) : null}
        {error ? (
          <p className="text-sm" style={{ color: "var(--ad-bad)" }}>
            {error}
          </p>
        ) : null}
        {saved ? (
          <p className="text-sm" style={{ color: "var(--ad-good)" }}>
            Saved. The change is live across the site.
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="ad-btn ad-btn-primary"
            disabled={pending || disabled}
          >
            {pending ? "Saving…" : "Save platform settings"}
          </button>
          {updatedAt ? (
            <span className="ad-muted text-xs">
              Last changed {new Date(updatedAt).toLocaleString()}
              {updatedBy ? ` by ${updatedBy}` : ""}
            </span>
          ) : null}
        </div>
      </form>
    </Card>
  );
}
