"use client";

import { useState } from "react";
import { FONT_COOKIE, FONTS, type FontId } from "@/lib/fonts";

function applyFont(id: FontId) {
  document.documentElement.setAttribute("data-font", id);
  document.cookie = `${FONT_COOKIE}=${id}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

export function FontPicker({
  initialFont,
  compact = false,
}: {
  initialFont: FontId;
  compact?: boolean;
}) {
  const [selected, setSelected] = useState(initialFont);

  function choose(id: FontId) {
    setSelected(id);
    applyFont(id);
  }

  if (compact) {
    return (
      <fieldset>
        <legend className="text-xs uppercase tracking-wide text-mute">
          Text style
        </legend>
        <p className="mt-1 text-xs text-mute">
          Choose the typeface used on this device, including after you log in.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {FONTS.map((font) => {
            const active = selected === font.id;
            return (
              <button
                key={font.id}
                type="button"
                onClick={() => choose(font.id)}
                aria-pressed={active}
                className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                  active
                    ? "border-azure-strong bg-azure-soft text-ink"
                    : "border-line bg-panel text-mute hover:border-azure hover:text-ink"
                }`}
                style={{ fontFamily: font.family }}
              >
                <span className="block text-base font-semibold leading-none">
                  {font.sample}
                </span>
                <span className="mt-1 block text-[11px]">{font.name}</span>
              </button>
            );
          })}
        </div>
      </fieldset>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {FONTS.map((font) => {
        const active = selected === font.id;
        return (
          <button
            key={font.id}
            type="button"
            onClick={() => choose(font.id)}
            aria-pressed={active}
            className={`rounded-2xl border p-4 text-left transition-shadow ${
              active
                ? "border-azure-strong ring-2 ring-azure"
                : "border-line hover:border-azure hover:shadow-sm"
            }`}
            style={{
              background: "var(--panel)",
              fontFamily: font.family,
            }}
          >
            <p className="text-3xl font-semibold tracking-tight">Ag</p>
            <p className="mt-3 font-semibold text-ink">{font.name}</p>
            <p className="mt-0.5 text-xs text-mute">{font.blurb}</p>
            {active ? (
              <p className="mt-2 text-xs font-medium text-azure">Selected</p>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
