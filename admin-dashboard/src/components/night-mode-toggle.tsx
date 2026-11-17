"use client";

import { useEffect, useState } from "react";
import {
  ADMIN_THEME_COOKIE,
  NIGHT_COOKIE,
} from "@/lib/themes";

const YEAR = 60 * 60 * 24 * 365;

export function isNightOn() {
  return document.documentElement.getAttribute("data-night") === "on";
}

export function applyNight(on: boolean) {
  document.documentElement.setAttribute("data-night", on ? "on" : "off");
  document.cookie = `${NIGHT_COOKIE}=${on ? "on" : "off"}; path=/; max-age=${YEAR}; samesite=lax`;
  document.cookie = `${ADMIN_THEME_COOKIE}=${on ? "dark" : "light"}; path=/; max-age=${YEAR}; samesite=lax`;
  window.dispatchEvent(new Event("tempora-night"));
}

export function useNight(initialNight: boolean) {
  const [on, setOn] = useState(initialNight);

  useEffect(() => {
    function sync() {
      setOn(isNightOn());
    }
    sync();
    window.addEventListener("tempora-night", sync);
    return () => window.removeEventListener("tempora-night", sync);
  }, []);

  return on;
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-4 w-4" aria-hidden>
      <path d="M21 14.3A8.5 8.5 0 1 1 9.7 3 7 7 0 0 0 21 14.3Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-4 w-4" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v1.5M12 19.5V21M4.9 4.9l1.1 1.1M18 18l1.1 1.1M3 12h1.5M19.5 12H21M4.9 19.1l1.1-1.1M18 6l1.1-1.1" strokeLinecap="round" />
    </svg>
  );
}

export function NightModeToggle({
  initialNight,
  variant = "label",
}: {
  initialNight: boolean;
  variant?: "label" | "icon" | "card" | "admin";
}) {
  const on = useNight(initialNight);
  const [ask, setAsk] = useState(false);

  function requestOn() {
    setAsk(true);
  }

  function confirmOn() {
    applyNight(true);
    setAsk(false);
  }

  function turnOff() {
    applyNight(false);
    setAsk(false);
  }

  const trigger =
    variant === "icon" ? (
      <button
        type="button"
        className="inline-flex items-center gap-1.5 rounded-md border border-line px-2 py-1.5 text-sm text-ink hover:border-azure"
        onClick={on ? turnOff : requestOn}
        aria-pressed={on}
        aria-label={on ? "Turn off night mode" : "Turn on night mode"}
        title={on ? "Day mode" : "Night mode"}
      >
        {on ? <SunIcon /> : <MoonIcon />}
        <span className="hidden sm:inline">{on ? "Day" : "Night"}</span>
      </button>
    ) : variant === "admin" ? (
      <button
        type="button"
        className="ad-btn px-2"
        onClick={on ? turnOff : requestOn}
        aria-pressed={on}
        aria-label={on ? "Turn off night mode" : "Turn on night mode"}
        title={on ? "Day mode" : "Night mode"}
      >
        {on ? <SunIcon /> : <MoonIcon />}
      </button>
    ) : variant === "card" ? (
      <button
        type="button"
        className="card w-full text-left"
        onClick={on ? turnOff : requestOn}
        aria-pressed={on}
      >
        <p className="text-xs text-mute">Display</p>
        <p className="mt-1 font-semibold">{on ? "Night mode is on" : "Night mode"}</p>
        <p className="mt-1 text-sm text-mute">
          {on
            ? "Tap to restore your colour background and usual text colour."
            : "Dark page with a light (white) typeface colour. Your current colour background will change."}
        </p>
      </button>
    ) : (
      <button
        type="button"
        className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm ${
          on
            ? "border-azure bg-azure-soft text-ink"
            : "border-line text-mute hover:border-azure hover:text-ink"
        }`}
        onClick={on ? turnOff : requestOn}
        aria-pressed={on}
      >
        {on ? <SunIcon /> : <MoonIcon />}
        {on ? "Night mode on" : "Night mode"}
      </button>
    );

  return (
    <>
      {trigger}
      {ask ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="night-mode-title"
        >
          <div className="card max-w-md shadow-lg">
            <h2 id="night-mode-title" className="text-lg font-semibold">
              Turn on night mode?
            </h2>
            <p className="mt-3 text-sm text-mute">
              Night mode needs a <strong className="font-medium text-ink">light (white) typeface colour</strong> so
              the page stays readable. Tempora will switch the text to white for you — you do not need to pick a
              white font first.
            </p>
            <p className="mt-3 text-sm text-mute">
              The <strong className="font-medium text-ink">current colour background will change</strong> to a dark
              page while night mode is on. Theme accents stay; the page itself will no longer look the same until
              you turn night mode off.
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setAsk(false)}
              >
                Keep current colours
              </button>
              <button type="button" className="btn-primary" onClick={confirmOn}>
                Use white text and turn on
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
