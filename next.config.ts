import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  ...(process.env.NODE_ENV === "production"
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/((?!_next/static|_next/image).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, max-age=0, must-revalidate",
          },
          ...securityHeaders,
        ],
      },
    ];
  },
  async redirects() {
    return [
      { source: "/home", destination: "/signup", permanent: false },
      { source: "/register", destination: "/signup", permanent: false },
      { source: "/sign-up", destination: "/signup", permanent: false },
      { source: "/join", destination: "/signup", permanent: false },
      { source: "/start", destination: "/signup", permanent: false },
      { source: "/signin", destination: "/login", permanent: false },
      { source: "/sign-in", destination: "/login", permanent: false },
      { source: "/dashboard", destination: "/app", permanent: false },
    ];
  },
};

export default nextConfig;
