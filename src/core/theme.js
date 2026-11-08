import { metaStore } from "./metaStore.js";

const FONT_LINK_ID = "theme-fonts";
const GOOGLE_FONTS_URL = "https://fonts.googleapis.com/css2";
const PILL_RADIUS = "999px";
const DEFAULT_RADIUS = "1.5rem";
const FALLBACK_FONT = { fallback: "sans-serif", weights: "400" };

const toKebab = (value) => value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
const findFont = (family) => metaStore.get()?.fonts.find((font) => font.family === family) ?? FALLBACK_FONT;
const fontStack = (family) => `"${family}", ${findFont(family).fallback}`;

function loadFonts(families) {
  const query = [...new Set(families)]
    .map((family) => `family=${family.replace(/ /g, "+")}:wght@${findFont(family).weights}`)
    .join("&");
  const href = `${GOOGLE_FONTS_URL}?${query}&display=swap`;

  let link = document.getElementById(FONT_LINK_ID);
  if (!link) {
    link = Object.assign(document.createElement("link"), { id: FONT_LINK_ID, rel: "stylesheet" });
    document.head.append(link);
  }
  if (link.href !== href) link.href = href;
}

/** Traduce el tema guardado a variables CSS que consumen las clases de Tailwind. */
export function applyTheme(theme, root = document.documentElement) {
  const radius = metaStore.get()?.radiusOptions[theme.radius]?.value ?? DEFAULT_RADIUS;
  const variables = {
    ...Object.fromEntries(Object.entries(theme.colors).map(([key, value]) => [toKebab(key), value])),
    radius,
    "button-radius": theme.radius === "none" ? "0px" : PILL_RADIUS,
    "font-heading": fontStack(theme.fonts.heading),
    "font-body": fontStack(theme.fonts.body),
    "background-image": theme.backgroundImageUrl ? `url(${JSON.stringify(theme.backgroundImageUrl)})` : "none",
  };

  for (const [name, value] of Object.entries(variables)) root.style.setProperty(`--site-${name}`, value);
  loadFonts([theme.fonts.heading, theme.fonts.body]);
}
