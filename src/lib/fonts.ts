export const FONT_COOKIE = "tempora_font";

export const FONT_IDS = [
  "geist",
  "inter",
  "roboto",
  "opensans",
  "nunito",
  "arial",
  "verdana",
  "trebuchet",
  "times",
  "georgia",
  "garamond",
  "palatino",
  "playfair",
  "lora",
  "serif",
  "plex",
  "courier",
  "comic",
] as const;

export type FontId = (typeof FONT_IDS)[number];

export type FontOption = {
  id: FontId;
  name: string;
  blurb: string;
  family: string;
  sample: string;
};

export const FONTS: FontOption[] = [
  {
    id: "geist",
    name: "Geist",
    blurb: "Tempora default.",
    family: "var(--font-geist-sans), ui-sans-serif, sans-serif",
    sample: "Aa",
  },
  {
    id: "inter",
    name: "Inter",
    blurb: "Clean screen sans.",
    family: "var(--font-inter), sans-serif",
    sample: "Aa",
  },
  {
    id: "roboto",
    name: "Roboto",
    blurb: "Android / Material.",
    family: "var(--font-roboto), sans-serif",
    sample: "Aa",
  },
  {
    id: "opensans",
    name: "Open Sans",
    blurb: "Wide humanist sans.",
    family: "var(--font-open-sans), sans-serif",
    sample: "Aa",
  },
  {
    id: "nunito",
    name: "Nunito",
    blurb: "Rounded and friendly.",
    family: "var(--font-nunito), sans-serif",
    sample: "Aa",
  },
  {
    id: "arial",
    name: "Arial",
    blurb: "Standard Windows sans.",
    family: "Arial, Helvetica, sans-serif",
    sample: "Aa",
  },
  {
    id: "verdana",
    name: "Verdana",
    blurb: "Large, easy to read.",
    family: "Verdana, Geneva, sans-serif",
    sample: "Aa",
  },
  {
    id: "trebuchet",
    name: "Trebuchet MS",
    blurb: "Soft geometric sans.",
    family: '"Trebuchet MS", sans-serif',
    sample: "Aa",
  },
  {
    id: "times",
    name: "Times New Roman",
    blurb: "Classic newspaper serif.",
    family: '"Times New Roman", Times, serif',
    sample: "Aa",
  },
  {
    id: "georgia",
    name: "Georgia",
    blurb: "Warm screen serif.",
    family: "Georgia, serif",
    sample: "Aa",
  },
  {
    id: "garamond",
    name: "Garamond",
    blurb: "Bookish old-style serif.",
    family: "var(--font-garamond), Garamond, serif",
    sample: "Aa",
  },
  {
    id: "palatino",
    name: "Palatino",
    blurb: "Elegant old-style serif.",
    family: 'Palatino, "Palatino Linotype", "Book Antiqua", serif',
    sample: "Aa",
  },
  {
    id: "playfair",
    name: "Playfair Display",
    blurb: "High-contrast display serif.",
    family: "var(--font-playfair), serif",
    sample: "Aa",
  },
  {
    id: "lora",
    name: "Lora",
    blurb: "Contemporary serif.",
    family: "var(--font-lora), serif",
    sample: "Aa",
  },
  {
    id: "serif",
    name: "Source Serif",
    blurb: "Editorial serif.",
    family: "var(--font-source-serif), serif",
    sample: "Aa",
  },
  {
    id: "plex",
    name: "IBM Plex Sans",
    blurb: "Technical corporate sans.",
    family: "var(--font-plex), sans-serif",
    sample: "Aa",
  },
  {
    id: "courier",
    name: "Courier New",
    blurb: "Typewriter monospace.",
    family: '"Courier New", Courier, monospace',
    sample: "Aa",
  },
  {
    id: "comic",
    name: "Comic Sans MS",
    blurb: "Casual handwritten look.",
    family: '"Comic Sans MS", "Comic Sans", cursive',
    sample: "Aa",
  },
];

export function parseFont(value: unknown): FontId {
  return FONT_IDS.includes(value as FontId) ? (value as FontId) : "geist";
}
