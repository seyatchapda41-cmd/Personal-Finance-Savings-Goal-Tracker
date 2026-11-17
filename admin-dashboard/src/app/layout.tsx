import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { ADMIN_APP_URL, APP_NAME } from "@/lib/config";
import { nightFromCookieStore } from "@/lib/themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(ADMIN_APP_URL),
  applicationName: `${APP_NAME} Control panel`,
  title: {
    default: `${APP_NAME} control panel`,
    template: `%s · ${APP_NAME}`,
  },
  description: "Founder desk for Tempora.",
  robots: { index: false, follow: false },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const store = await cookies();
  const night = nightFromCookieStore(store);

  return (
    <html
      lang="en"
      data-night={night ? "on" : "off"}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-page text-ink">{children}</body>
    </html>
  );
}
