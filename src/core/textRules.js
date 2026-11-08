// Reglas de texto del navegador. Copia de catalogos-api/src/shared/textRules.js: si cambias una, cambia la otra.
// El API vuelve a validar todo; aquí es para avisar al instante y no dejar escribir lo que no se aceptará.

// Símbolos que nunca se aceptan en textos libres (sirven para inyectar HTML, plantillas o comandos).
const FORBIDDEN_CHARS = /[<>{}[\]\\`^|~]/g;
// Caracteres de control invisibles (salvo salto de línea y tabulador).
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export const PATTERNS = Object.freeze({
  PERSON_NAME: /^[\p{L}\p{M}]+(?:[ .'-]+[\p{L}\p{M}]+)*\.?$/u,
  PLACE: /^[\p{L}\p{M}\p{N} .,#'°/()-]*$/u,
  HOUSE_NUMBER: /^[\p{L}\p{N} /-]*$/u,
  EMAIL: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/,
  POSTAL_CODE: /^\d{4,6}$/,
});

/** Largos máximos de los campos públicos (iguales a los del API). */
export const MAX = Object.freeze({
  NAME: 80,
  PHONE: 20,
  EMAIL: 120,
  STREET: 100,
  HOUSE_NUMBER: 10,
  NEIGHBORHOOD: 80,
  POSTAL_CODE: 6,
  CITY: 60,
  REFERENCES: 200,
  NOTES: 500,
  OPTION_TEXT: 120,
  ITEM_NOTE: 300,
});

// Filtros mientras se escribe: quitan lo que de todos modos no se aceptaría.
export const filters = Object.freeze({
  /** Textos libres (notas, mensajes): sin símbolos peligrosos ni caracteres de control. */
  safeText: (value) => value.replace(FORBIDDEN_CHARS, "").replace(CONTROL_CHARS, ""),
  /** Nombres: solo letras, espacios, punto, apóstrofo y guion. */
  personName: (value) => value.replace(/[^\p{L}\p{M} .'-]/gu, ""),
  /** Teléfono: dígitos y + ( ) - espacio. */
  phone: (value) => value.replace(/[^\d+() -]/g, ""),
  /** Correo: sin espacios. */
  email: (value) => value.replace(/\s/g, ""),
  /** Calles, colonias, ciudades. */
  place: (value) => value.replace(/[^\p{L}\p{M}\p{N} .,#'°/()-]/gu, ""),
  houseNumber: (value) => value.replace(/[^\p{L}\p{N} /-]/gu, ""),
  digits: (value) => value.replace(/\D/g, ""),
});

export const digitCount = (value) => value.replace(/\D/g, "").length;

/** Ladas aceptadas: México por defecto; Estados Unidos y Canadá comparten +1. Siempre 10 dígitos. */
export const PHONE_COUNTRIES = Object.freeze([
  { code: "MX", dial: "+52", name: "México" },
  { code: "US", dial: "+1", name: "Estados Unidos" },
  { code: "CA", dial: "+1", name: "Canadá" },
]);
export const PHONE_DIGITS = 10;
export const dialOf = (countryCode) => (PHONE_COUNTRIES.find((country) => country.code === countryCode) ?? PHONE_COUNTRIES[0]).dial;

/** "+524421234567" → "+52 442 123 4567"; "+14155550123" → "+1 (415) 555-0123". */
export function formatPhone(phone = "") {
  const mexico = phone.match(/^\+52(\d{3})(\d{3})(\d{4})$/);
  if (mexico) return `+52 ${mexico[1]} ${mexico[2]} ${mexico[3]}`;
  const northAmerica = phone.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
  if (northAmerica) return `+1 (${northAmerica[1]}) ${northAmerica[2]}-${northAmerica[3]}`;
  return phone;
}

/** Separa un teléfono guardado en país y 10 dígitos. Los guardados sin lada se toman como de México. */
export function splitPhone(phone = "", countryCode) {
  const digits = phone.replace(/\D/g, "");
  if (phone.startsWith("+1")) return { country: countryCode === "CA" ? "CA" : "US", digits: digits.slice(1, 11) };
  if (phone.startsWith("+52")) return { country: "MX", digits: digits.slice(2, 12) };
  return { country: "MX", digits: digits.slice(-PHONE_DIGITS) };
}
