export const THEME_COOKIE = "tempora_theme";
export const NIGHT_COOKIE = "tempora_night";
export const ADMIN_THEME_COOKIE = "tempora_admin_theme";

export const THEME_IDS = [
  "azure",
  "midnight",
  "corporate",
  "forest",
  "sunset",
  "violet",
  "ocean",
  "contrast",
] as const;

export type ThemeId = (typeof THEME_IDS)[number];

export type ThemeKind = "Light" | "Dark";

export type ThemePreview = {
  page: string;
  panel: string;
  navy: string;
  accent: string;
  ink: string;
  mute: string;
  line: string;
};

export type ThemeOption = {
  id: ThemeId;
  name: string;
  kind: ThemeKind;
  blurb: string;
  preview: ThemePreview;
};

export const THEMES: ThemeOption[] = [
  {
    id: "azure",
    name: "Classic Azure",
    kind: "Light",
    blurb: "The Tempora default: calm navy and blue.",
    preview: {
      page: "#f4f6fa",
      panel: "#ffffff",
      navy: "#0b1f3a",
      accent: "#2563eb",
      ink: "#0f172a",
      mute: "#5b6b80",
      line: "#e2e8f0",
    },
  },
  {
    id: "midnight",
    name: "Midnight Lime",
    kind: "Dark",
    blurb: "Night mode with sharp lime accents.",
    preview: {
      page: "#0b0e12",
      panel: "#151a22",
      navy: "#07090c",
      accent: "#84cc16",
      ink: "#e8f0d8",
      mute: "#8a9478",
      line: "#2a3320",
    },
  },
  {
    id: "corporate",
    name: "Corporate Blue",
    kind: "Light",
    blurb: "Bright blues for a clean office look.",
    preview: {
      page: "#eaf2fb",
      panel: "#ffffff",
      navy: "#0a2f6b",
      accent: "#1d4ed8",
      ink: "#0b1f3a",
      mute: "#4b6484",
      line: "#c9daf0",
    },
  },
  {
    id: "forest",
    name: "Forest",
    kind: "Light",
    blurb: "Sage and deep green, easy on the eyes.",
    preview: {
      page: "#f2f6f1",
      panel: "#ffffff",
      navy: "#1a3324",
      accent: "#2f6f4e",
      ink: "#14241b",
      mute: "#5b7264",
      line: "#d5e0d6",
    },
  },
  {
    id: "sunset",
    name: "Sunset",
    kind: "Light",
    blurb: "Warm sand and terracotta.",
    preview: {
      page: "#faf4ee",
      panel: "#fffdfb",
      navy: "#3b2418",
      accent: "#c2410c",
      ink: "#2a1810",
      mute: "#7a5c4a",
      line: "#ead9cc",
    },
  },
  {
    id: "violet",
    name: "Violet",
    kind: "Light",
    blurb: "Soft lilac with a purple accent.",
    preview: {
      page: "#f6f3fb",
      panel: "#ffffff",
      navy: "#2a1848",
      accent: "#7c3aed",
      ink: "#1c1233",
      mute: "#6b5d82",
      line: "#e4d9f2",
    },
  },
  {
    id: "ocean",
    name: "Ocean",
    kind: "Light",
    blurb: "Teal water tones for a cooler desk.",
    preview: {
      page: "#eef7f6",
      panel: "#ffffff",
      navy: "#0f3d42",
      accent: "#0d9488",
      ink: "#123033",
      mute: "#4f6e70",
      line: "#cfe3e1",
    },
  },
  {
    id: "contrast",
    name: "High contrast",
    kind: "Dark",
    blurb: "Black, white and gold for maximum punch.",
    preview: {
      page: "#000000",
      panel: "#141414",
      navy: "#000000",
      accent: "#facc15",
      ink: "#ffffff",
      mute: "#c4c4c4",
      line: "#3a3a3a",
    },
  },
];

export function parseTheme(value: unknown): ThemeId {
  return THEME_IDS.includes(value as ThemeId) ? (value as ThemeId) : "azure";
}

export function parseNight(value: unknown) {
  return value === "on" || value === "1" || value === "dark" || value === true;
}

/** Prefer the shared night cookie; fall back to the older founder-panel cookie. */
export function nightFromCookieStore(store: {
  get(name: string): { value: string } | undefined;
}) {
  const night = store.get(NIGHT_COOKIE)?.value;
  if (night === "on" || night === "off") return night === "on";
  return parseNight(store.get(ADMIN_THEME_COOKIE)?.value);
}

export function themeById(id: ThemeId) {
  return THEMES.find((theme) => theme.id === id) ?? THEMES[0];
}
