// Selector de tipografía con vista previa (como en Word): cada opción se escribe con su propia letra.
// Agrupa por estilo, se navega con flechas y se cierra con Esc o al tocar fuera.
import van from "vanjs-core";
import Icon from "../../ui/Icon.js";
import { metaStore } from "../../core/metaStore.js";
import { adminStore } from "../adminStore.js";

const { div, button, span, p, ul, li } = van.tags;

const PREVIEW_LINK_ID = "admin-font-previews";
const GOOGLE_FONTS_URL = "https://fonts.googleapis.com/css2";
const DEFAULT_SAMPLE = "Pasteles hechos con cariño 123";

const GROUPS = [
  { fallback: "sans-serif", label: "Modernas (sin remates)" },
  { fallback: "serif", label: "Clásicas (con remates)" },
  { fallback: "cursive", label: "Manuscritas" },
];

const fontStack = (font) => `"${font.family}", ${font.fallback}`;

/**
 * Carga todas las fuentes UNA vez, solo con las letras que se usan en la vista previa (`text=`):
 * pesa unos pocos KB aunque sean muchas familias.
 */
function loadPreviewFonts(fonts, samples) {
  if (document.getElementById(PREVIEW_LINK_ID)) return;
  const letters = [...new Set([...fonts.map((font) => font.family).join(""), ...samples.join(""), ..."ÁÉÍÓÚáéíóúÑñ"])].join("");
  const families = fonts.map((font) => `family=${font.family.replace(/ /g, "+")}`).join("&");
  document.head.append(
    Object.assign(document.createElement("link"), {
      id: PREVIEW_LINK_ID,
      rel: "stylesheet",
      href: `${GOOGLE_FONTS_URL}?${families}&text=${encodeURIComponent(letters)}&display=swap`,
    }),
  );
}

/** `field.sample`: frase de ejemplo (distinta para títulos y textos). */
export default function FontPicker(field, path) {
  const fonts = metaStore.get().fonts;
  const sample = field.sample ?? DEFAULT_SAMPLE;
  loadPreviewFonts(fonts, [sample, DEFAULT_SAMPLE, "Títulos", "Textos"]);

  const current = van.state(adminStore.get(path));
  const open = van.state(false);
  const selected = () => fonts.find((font) => font.family === current.val) ?? fonts[0];

  const optionButtons = () => [...list.querySelectorAll("[role=option]")];
  const close = () => {
    open.val = false;
    trigger.focus();
  };
  const choose = (family) => {
    current.val = family;
    adminStore.set(path, family);
    close();
  };

  const Option = (font) =>
    li(
      button(
        {
          type: "button",
          role: "option",
          "data-family": font.family,
          "aria-selected": () => String(current.val === font.family),
          onclick: () => choose(font.family),
          class: () =>
            `flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition outline-none hover:bg-zinc-100 focus-visible:bg-zinc-100 ${
              current.val === font.family ? "bg-zinc-100" : ""
            }`,
        },
        span(
          { class: "min-w-0 flex-1" },
          span({ class: "block truncate text-lg leading-snug text-zinc-900", style: `font-family:${fontStack(font)}` }, font.family),
          span({ class: "block truncate text-sm text-zinc-500", style: `font-family:${fontStack(font)}` }, sample),
        ),
        () => (current.val === font.family ? Icon("check", "size-4 shrink-0 text-zinc-900") : span()),
      ),
    );

  const list = div(
    {
      role: "listbox",
      "aria-label": field.label,
      class: () =>
        `absolute inset-x-0 top-full z-30 mt-1.5 max-h-96 overflow-y-auto overscroll-contain rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl ${
          open.val ? "" : "hidden"
        }`,
      onkeydown: (event) => {
        const items = optionButtons();
        const index = items.indexOf(document.activeElement);
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          const next = items[Math.min(items.length - 1, Math.max(0, index + (event.key === "ArrowDown" ? 1 : -1)))];
          next?.focus();
        } else if (event.key === "Escape") {
          event.preventDefault();
          close();
        }
      },
    },
    GROUPS.map((group) => {
      const items = fonts.filter((font) => font.fallback === group.fallback);
      return items.length
        ? div(
            { class: "py-1" },
            p({ class: "px-3 pt-1 pb-1.5 text-[11px] font-semibold tracking-wider text-zinc-400 uppercase" }, group.label),
            ul(items.map(Option)),
          )
        : null;
    }),
  );

  const trigger = button(
    {
      type: "button",
      "aria-haspopup": "listbox",
      "aria-expanded": () => String(open.val),
      onclick: () => {
        open.val = !open.val;
        // Al abrir, enfoca la fuente elegida y la deja a la vista.
        if (open.val) {
          requestAnimationFrame(() => {
            const active = list.querySelector(`[data-family="${CSS.escape(current.val)}"]`);
            active?.scrollIntoView({ block: "center" });
            active?.focus({ preventScroll: true });
          });
        }
      },
      onkeydown: (event) => {
        if ((event.key === "ArrowDown" || event.key === "ArrowUp") && !open.val) {
          event.preventDefault();
          trigger.click();
        }
      },
      class: "field-input flex items-center gap-3 text-left",
    },
    () =>
      span(
        { class: "min-w-0 flex-1" },
        span({ class: "block truncate text-base text-zinc-900", style: `font-family:${fontStack(selected())}` }, selected().family),
        span({ class: "block truncate text-xs text-zinc-500", style: `font-family:${fontStack(selected())}` }, sample),
      ),
    span({ class: () => `shrink-0 text-zinc-400 transition-transform ${open.val ? "rotate-180" : ""}` }, Icon("chevronDown", "size-4")),
  );

  const root = div({ class: "relative" }, trigger, list);

  // Cerrar al tocar fuera. Se quita solo cuando el selector ya no está en la página.
  const onOutside = (event) => {
    if (!root.isConnected) return document.removeEventListener("pointerdown", onOutside);
    if (open.val && !root.contains(event.target)) open.val = false;
  };
  document.addEventListener("pointerdown", onOutside);

  return root;
}
