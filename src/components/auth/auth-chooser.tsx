"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { forgetAccountAction, signInAction } from "@/app/actions/auth";
import { LoginForm } from "@/components/auth/login-form";
import { RemoveProfileDialog } from "@/components/auth/remove-profile-dialog";
import { SavedProfilesList } from "@/components/auth/saved-profiles-list";
import { Notice } from "@/components/notice";
import type { DeviceProfile } from "@/lib/device-profiles";

type View = "list" | "login";

export function AuthChooser({
  profiles,
  selectedId,
  nextPath = "/app/account",
  expired = false,
}: {
  profiles: DeviceProfile[];
  selectedId?: string;
  nextPath?: string;
  expired?: boolean;
}) {
  const selected = useMemo(
    () => profiles.find((row) => row.userId === selectedId || row.phone === selectedId),
    [profiles, selectedId],
  );
  const [view, setView] = useState<View>("login");
  const [active, setActive] = useState<DeviceProfile | undefined>(selected);
  const [removing, setRemoving] = useState<DeviceProfile | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [removePending, setRemovePending] = useState(false);
  const [rows, setRows] = useState(profiles);

  async function confirmRemove() {
    if (!removing) return;
    setRemovePending(true);
    setRemoveError(null);
    await forgetAccountAction(removing.userId);
    const remaining = rows.filter((row) => row.userId !== removing.userId);
    setRows(remaining);
    if (active?.userId === removing.userId) {
      setActive(undefined);
      setView(remaining.length > 0 ? "list" : "login");
    }
    setRemoving(null);
    setRemovePending(false);
  }

  const showList = view === "list" && rows.length > 0 && !active;

  return (
    <div className="space-y-6">
      {expired ? (
        <Notice tone="bad">
          Your session ended. Confirm with your password to continue — a saved
          profile is not enough.
        </Notice>
      ) : null}

      {showList ? (
        <SavedProfilesList
          profiles={rows}
          pending={removePending}
          onContinue={(profile) => {
            setActive(profile);
            setView("login");
          }}
          onRemove={setRemoving}
        />
      ) : null}

      {showList ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            className="btn-secondary flex-1"
            onClick={() => {
              setActive(undefined);
              setView("login");
            }}
          >
            Use another account
          </button>
          <Link href="/signup" className="btn-primary flex-1">
            Create new account
          </Link>
        </div>
      ) : (
        <>
          <LoginForm
            key={active?.userId || "other"}
            action={signInAction}
            nextPath={nextPath}
            defaultPhone={active?.phone}
            lockedPhone={Boolean(active)}
            accountName={active?.fullName}
            profile={active}
            profiles={rows}
            footer={
              <p className="text-center text-sm text-mute">
                <Link href="/forgot-password" className="text-azure">
                  Forgot password
                </Link>
              </p>
            }
          />
          <div className="flex flex-col gap-2 text-center text-sm">
            {rows.length > 0 ? (
              <button
                type="button"
                className="text-azure"
                onClick={() => {
                  setActive(undefined);
                  setView("list");
                }}
              >
                Choose a saved account
              </button>
            ) : null}
            <button
              type="button"
              className="text-azure"
              onClick={() => {
                setActive(undefined);
                setView("login");
              }}
            >
              Use another account
            </button>
            <Link href="/signup" className="text-azure">
              Create new account
            </Link>
          </div>
        </>
      )}

      {removing ? (
        <RemoveProfileDialog
          profile={removing}
          pending={removePending}
          error={removeError}
          onCancel={() => setRemoving(null)}
          onConfirm={() => void confirmRemove()}
        />
      ) : null}
    </div>
  );
}
