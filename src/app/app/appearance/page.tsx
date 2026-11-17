import type { Metadata } from "next";
import { cookies } from "next/headers";
import { FontPicker } from "@/components/font-picker";
import { NightModeToggle } from "@/components/night-mode-toggle";
import { ThemePicker } from "@/components/theme-picker";
import { FONT_COOKIE, parseFont } from "@/lib/fonts";
import { THEME_COOKIE, nightFromCookieStore, parseTheme } from "@/lib/themes";

export const metadata: Metadata = { title: "Appearance" };

export default async function AppearancePage() {
  const store = await cookies();
  const theme = parseTheme(store.get(THEME_COOKIE)?.value);
  const font = parseFont(store.get(FONT_COOKIE)?.value);
  const night = nightFromCookieStore(store);

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <header>
        <p className="text-sm text-mute">Look and feel</p>
        <h1 className="mt-1 text-3xl font-semibold">Choose your look</h1>
        <p className="mt-2 max-w-xl text-sm text-mute">
          Theme, typeface and night mode are saved on this device. They apply as
          soon as you tap a card, including on the login screen next time.
        </p>
      </header>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Night mode</h2>
          <p className="mt-1 text-sm text-mute">
            Before it turns on, Tempora will ask you to accept a light (white)
            typeface colour. The current colour background will also change to
            dark.
          </p>
        </div>
        <NightModeToggle initialNight={night} variant="card" />
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Text style</h2>
          <p className="mt-1 text-sm text-mute">
            The typeface used for names, amounts and the rest of Tempora.
          </p>
        </div>
        <FontPicker initialFont={font} />
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Theme</h2>
          <p className="mt-1 text-sm text-mute">
            Colour palettes, from the classic navy desk to high contrast.
          </p>
        </div>
        <ThemePicker initialTheme={theme} />
      </section>
    </div>
  );
}
