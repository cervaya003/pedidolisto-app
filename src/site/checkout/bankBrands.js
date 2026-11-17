// Bancos más usados con su tarjeta «de plástico» (colores y adornos inspirados en cada una, sin logos).
// Se guarda solo el nombre del banco (`payment.bank`) y, si el dueño lo cambia, el color (`payment.cardColor`).

/**
 * `decor`: adorno dibujado encima del fondo (ver BankCard).
 * `match`: reconoce el nombre aunque lo hayan escrito a mano («Bancomer», «nu méxico»…).
 */
export const BANK_BRANDS = [
  {
    key: "bbva",
    label: "BBVA",
    color: "#072146",
    background: "linear-gradient(135deg,#001391 0%,#072146 55%,#1464a5 100%)",
    text: "#ffffff",
    decor: "waves",
    nameClass: "font-black italic tracking-tight",
    match: /\b(bbva|bancomer)\b/i,
  },
  {
    key: "santander",
    label: "Santander",
    color: "#ec0000",
    background: "linear-gradient(135deg,#ff2b2b 0%,#ec0000 50%,#a80000 100%)",
    text: "#ffffff",
    decor: "flame",
    nameClass: "font-bold tracking-tight",
    match: /\bsantander\b/i,
  },
  {
    key: "nu",
    label: "Nu",
    color: "#820ad1",
    background: "linear-gradient(140deg,#a43cf0 0%,#820ad1 50%,#55078c 100%)",
    text: "#ffffff",
    decor: "minimal",
    nameClass: "font-black lowercase tracking-tighter",
    nameSize: "text-[9cqw]",
    match: /^(nu|nubank|nu m[eé]xico)\b/i,
  },
  {
    key: "banorte",
    label: "Banorte",
    color: "#eb0029",
    background: "linear-gradient(135deg,#ff1f4b 0%,#eb0029 45%,#8f0019 100%)",
    text: "#ffffff",
    decor: "stripe",
    nameClass: "font-black uppercase tracking-wide",
    match: /\bbanorte\b/i,
  },
  {
    key: "spin",
    label: "Spin by OXXO",
    color: "#ffc20e",
    background: "linear-gradient(135deg,#ffe066 0%,#ffc20e 50%,#f59f00 100%)",
    text: "#1c1917",
    decor: "dots",
    nameClass: "font-black tracking-tight",
    match: /\b(spin|oxxo)\b/i,
  },
];

/** Banco de la lista que corresponde al nombre guardado, o null si es otro. */
export const findBrand = (name = "") => (name.trim() ? BANK_BRANDS.find((brand) => brand.match.test(name.trim())) ?? null : null);

const hexToRgb = (hex) => [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16));
const toHex = (rgb) => `#${rgb.map((value) => Math.round(Math.min(255, Math.max(0, value))).toString(16).padStart(2, "0")).join("")}`;

/** Aclara (amount > 0) u oscurece (amount < 0) un color. */
export function shade(hex, amount) {
  const target = amount > 0 ? 255 : 0;
  return toHex(hexToRgb(hex).map((value) => value + (target - value) * Math.abs(amount)));
}

/** Texto negro o blanco, lo que se lea mejor sobre ese color. */
export function readableText(hex) {
  const [r, g, b] = hexToRgb(hex).map((value) => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.45 ? "#1c1917" : "#ffffff";
}

const isHex = (value) => /^#[0-9a-f]{6}$/i.test(value ?? "");

/**
 * Diseño de la tarjeta: el del banco, con el color que eligió el dueño si lo cambió.
 * null = sin banco conocido ni color: la tarjeta usa los colores del sitio.
 */
export function cardDesign({ bank = "", cardColor = "" } = {}) {
  const brand = findBrand(bank);
  if (isHex(cardColor)) {
    return {
      background: `linear-gradient(135deg,${shade(cardColor, 0.18)} 0%,${cardColor} 50%,${shade(cardColor, -0.4)} 100%)`,
      text: readableText(cardColor),
      decor: brand?.decor ?? "classic",
      nameClass: brand?.nameClass ?? "",
      nameSize: brand?.nameSize,
    };
  }
  return brand;
}
