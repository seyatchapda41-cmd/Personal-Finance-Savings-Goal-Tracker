"use client";

import { useState } from "react";
import { THEME_COOKIE, THEMES, type ThemeId, type ThemeOption } from "@/lib/themes";

function applyTheme(id: ThemeId) {
  document.documentElement.setAttribute("data-theme", id);
  document.cookie = `${THEME_COOKIE}=${id}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

function ThemePreviewCard({ theme }: { theme: ThemeOption }) {
  const { preview } = theme;
  return (
    <div
      className="relative h-40 overflow-hidden"
      style={{ background: preview.page }}
      aria-hidden="true"
    >
      <div className="absolute inset-y-0 left-0 w-11" style={{ background: preview.navy }} />
      <div className="absolute inset-3 left-14 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="h-2 w-16 rounded-full" style={{ background: preview.ink, opacity: 0.85 }} />
          <span className="h-5 w-14 rounded-md" style={{ background: preview.accent }} />
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-12 rounded-md border"
              style={{ background: preview.panel, borderColor: preview.line }}
            >
              <div className="m-1.5 h-1.5 w-8 rounded-full" style={{ background: preview.mute }} />
              <div className="mx-1.5 mt-2 h-3 w-10 rounded-sm" style={{ background: preview.accent, opacity: 0.85 }} />
            </div>
          ))}
        </div>
        <div className="mt-auto h-8 rounded-md border" style={{ background: preview.panel, borderColor: preview.line }}>
          <div className="m-2 h-2 rounded-full" style={{ width: "70%", background: preview.accent }} />
        </div>
      </div>
    </div>
  );
}

export function ThemePicker({ initialTheme }: { initialTheme: ThemeId }) {
  const [selected, setSelected] = useState(initialTheme);

  function choose(id: ThemeId) {
    setSelected(id);
    applyTheme(id);
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {THEMES.map((theme) => {
        const active = selected === theme.id;
        return (
          <button
            key={theme.id}
            type="button"
            onClick={() => choose(theme.id)}
            aria-pressed={active}
            className={`overflow-hidden rounded-2xl border text-left transition-shadow ${
              active
                ? "border-azure-strong ring-2 ring-azure shadow-md"
                : "border-line hover:border-azure hover:shadow-sm"
            }`}
            style={{ background: "var(--panel)" }}
          >
            <ThemePreviewCard theme={theme} />
            <div className="flex items-start justify-between gap-3 px-4 py-3">
              <div>
                <p className="font-semibold text-ink">{theme.name}</p>
                <p className="mt-0.5 text-sm text-mute">{theme.blurb}</p>
              </div>
              <span className="shrink-0 rounded-full border border-line px-2 py-0.5 text-[11px] text-mute">
                {theme.kind}
              </span>
            </div>
            {active ? (
              <p className="px-4 pb-3 text-xs font-medium text-azure">Selected</p>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function ThemeDots({ initialTheme }: { initialTheme: ThemeId }) {
  const [selected, setSelected] = useState(initialTheme);

  function choose(id: ThemeId) {
    setSelected(id);
    applyTheme(id);
  }

  return (
    <fieldset>
      <legend className="text-xs uppercase tracking-wide text-mute">
        Colours
      </legend>
      <p className="mt-1 text-xs text-mute">
        Tap a palette. You can change it again after you sign in.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {THEMES.map((theme) => {
          const active = selected === theme.id;
          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => choose(theme.id)}
              aria-pressed={active}
              title={theme.name}
              className={`flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-xs ${
                active
                  ? "border-azure-strong bg-azure-soft text-ink"
                  : "border-line text-mute hover:border-azure hover:text-ink"
              }`}
            >
              <span
                className="h-4 w-4 rounded-full border border-line"
                style={{ background: theme.preview.accent }}
              />
              {theme.name}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
