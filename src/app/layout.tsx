import type { Metadata } from "next";
import { Geist, Geist_Mono, IBM_Plex_Sans, Inter, Nunito, Source_Serif_4, Roboto, Open_Sans, Playfair_Display, Lora, EB_Garamond } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { APP_NAME, APP_TAGLINE } from "@/lib/config";
import { publicSiteUrl } from "@/lib/public-url";
import { FONT_COOKIE, parseFont } from "@/lib/fonts";
import { THEME_COOKIE, nightFromCookieStore, parseTheme } from "@/lib/themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
});

const plex = IBM_Plex_Sans({
  variable: "--font-plex",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
});

const garamond = EB_Garamond({
  variable: "--font-garamond",
  subsets: ["latin"],
});

const siteUrl = publicSiteUrl();
const shareImage = `${siteUrl}/opengraph-image.png`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: APP_NAME,
  title: {
    default: `${APP_NAME} — Personal finance & savings goals`,
    template: `%s · ${APP_NAME}`,
  },
  description: APP_TAGLINE,
  keywords: [
    "personal finance",
    "savings goals",
    "budget tracker",
    "Tempora",
  ],
  openGraph: {
    title: `${APP_NAME} — Personal finance & savings goals`,
    description: APP_TAGLINE,
    url: siteUrl,
    siteName: APP_NAME,
    type: "website",
    images: [
      {
        url: shareImage,
        width: 1536,
        height: 1024,
        alt: `${APP_NAME} logo`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} — Personal finance & savings goals`,
    description: APP_TAGLINE,
    images: [shareImage],
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const store = await cookies();
  const theme = parseTheme(store.get(THEME_COOKIE)?.value);
  const font = parseFont(store.get(FONT_COOKIE)?.value);
  const night = nightFromCookieStore(store);

  return (
    <html
      lang="en"
      data-theme={theme}
      data-font={font}
      data-night={night ? "on" : "off"}
      className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${nunito.variable} ${sourceSerif.variable} ${plex.variable} ${roboto.variable} ${openSans.variable} ${playfair.variable} ${lora.variable} ${garamond.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-page text-ink">{children}</body>
    </html>
  );
}
