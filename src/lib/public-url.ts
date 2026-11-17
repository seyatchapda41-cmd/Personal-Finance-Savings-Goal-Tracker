const PUBLISHED_SITE = "https://tempora-five.vercel.app";

function isLocalOrigin(url: string) {
  return /localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]/.test(url);
}

/** Address other people can open. A localhost value only works on this computer. */
export function publicSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (configured && !isLocalOrigin(configured)) return configured;
  return PUBLISHED_SITE;
}

export function memberStartUrl() {
  return `${publicSiteUrl()}/signup`;
}
