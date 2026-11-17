import { cookies } from "next/headers";
import Image from "next/image";
import { FontPicker } from "@/components/font-picker";
import { Logo } from "@/components/logo";
import { NightModeToggle } from "@/components/night-mode-toggle";
import { ThemeDots } from "@/components/theme-picker";
import { APP_NAME, APP_TAGLINE } from "@/lib/config";
import { FONT_COOKIE, parseFont } from "@/lib/fonts";
import { THEME_COOKIE, nightFromCookieStore, parseTheme } from "@/lib/themes";

export async function AuthShell({
  children,
  title,
  description,
}: {
  children: React.ReactNode;
  title: string;
  description?: React.ReactNode;
}) {
  const store = await cookies();
  const font = parseFont(store.get(FONT_COOKIE)?.value);
  const theme = parseTheme(store.get(THEME_COOKIE)?.value);
  const night = nightFromCookieStore(store);

  return (
    <div className="grid min-h-dvh bg-page lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-navy text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute inset-0 opacity-40" aria-hidden>
          <Image
            src="/welcome/landscape.png"
            alt=""
            fill
            sizes="50vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-navy/80" />
        </div>
        <div className="relative">
          <Logo tone="light" href="/" />
        </div>
        <div className="relative max-w-md">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-blue-200">
            {APP_NAME}
          </p>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight">
            Your money, finally in one calm place.
          </h2>
          <p className="mt-4 text-sm leading-6 text-slate-300">
            {APP_TAGLINE}
          </p>
        </div>
        <p className="relative text-xs text-slate-400">
          © {new Date().getFullYear()} {APP_NAME}
        </p>
      </aside>

      <main className="flex flex-col justify-center px-4 py-12 sm:px-10">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo href="/" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description ? (
            <div className="mt-2 text-sm text-mute">{description}</div>
          ) : null}
          <div className="mt-8">{children}</div>
          <div className="mt-10 space-y-6 border-t border-line pt-8">
            <div>
              <p className="text-xs text-mute">Display</p>
              <p className="mt-1 text-sm text-mute">
                Night mode uses a light (white) typeface colour and will change
                the current colour background.
              </p>
              <div className="mt-3">
                <NightModeToggle initialNight={night} />
              </div>
            </div>
            <FontPicker initialFont={font} compact />
            <ThemeDots initialTheme={theme} />
          </div>
        </div>
      </main>
    </div>
  );
}
