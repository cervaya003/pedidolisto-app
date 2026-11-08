import van from "vanjs-core";
import { metaStore } from "../../core/metaStore.js";
import { adminStore } from "../adminStore.js";

const { div, button, span, p } = van.tags;

const DEFAULT_TEMPLATE = "classic";

// Descripción y miniatura de cada plantilla. Los nombres vienen del API (/meta).
const TEMPLATE_INFO = {
  classic: {
    description: "Portada grande, carrusel de destacados y menú en mosaico. Usa todas las secciones.",
    sketch: () => [
      span({ class: "col-span-6 h-5 rounded-sm bg-zinc-300" }),
      span({ class: "col-span-3 h-3 rounded-sm bg-zinc-200" }),
      span({ class: "col-span-3 h-3 rounded-sm bg-zinc-200" }),
      span({ class: "col-span-2 row-span-2 h-7 rounded-sm bg-zinc-300" }),
      span({ class: "col-span-2 h-3 rounded-sm bg-zinc-200" }),
      span({ class: "col-span-2 h-3 rounded-sm bg-zinc-200" }),
      span({ class: "col-span-4 h-3 rounded-sm bg-zinc-200" }),
    ],
  },
  market: {
    description: "Estilo marketplace: buscador, filtros, orden por precio, ficha de producto y pedido con carrito.",
    sketch: () => [
      span({ class: "col-span-6 h-2.5 rounded-sm bg-zinc-500" }),
      span({ class: "col-span-2 row-span-2 rounded-sm bg-zinc-200" }),
      ...Array.from({ length: 4 }, () => span({ class: "col-span-2 h-4 rounded-sm bg-zinc-300" })),
    ],
  },
  carta: {
    description: "Menú editorial por capítulos: nombre ···· precio, recomendaciones de la casa y detalle lateral.",
    sketch: () => [
      span({ class: "col-span-6 mx-auto h-3 w-2/3 rounded-sm bg-zinc-400" }),
      span({ class: "col-span-6 h-4 rounded-sm bg-zinc-200" }),
      ...Array.from({ length: 4 }, () => span({ class: "col-span-3 h-1.5 border-b border-dotted border-zinc-400" })),
    ],
  },
};

const currentTemplate = () => adminStore.draft.val?.theme.template ?? DEFAULT_TEMPLATE;

function selectTemplate(id, name) {
  if (currentTemplate() === id) return;
  adminStore.set("theme.template", id);
  adminStore.notify(`Plantilla «${name}» seleccionada. Publica para aplicarla en el sitio.`);
}

function TemplateOption(id, name) {
  const info = TEMPLATE_INFO[id] ?? { description: "", sketch: () => [] };
  const isActive = () => currentTemplate() === id;

  return button(
    {
      type: "button",
      "aria-pressed": () => String(isActive()),
      onclick: () => selectTemplate(id, name),
      class: () =>
        `flex w-full items-start gap-3 rounded-xl border p-3 text-left transition ${
          isActive() ? "border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900" : "border-zinc-200 bg-white hover:border-zinc-400"
        }`,
    },
    div({ class: "grid w-20 shrink-0 grid-cols-6 content-start gap-1 rounded-lg bg-white p-1.5 ring-1 ring-zinc-900/10", "aria-hidden": "true" }, info.sketch()),
    div(
      { class: "min-w-0" },
      p(
        { class: "flex items-center gap-2 text-sm font-semibold text-zinc-900" },
        name,
        span({ class: () => `rounded-full bg-zinc-900 px-1.5 py-0.5 text-[10px] font-medium text-white ${isActive() ? "" : "hidden"}` }, "En uso"),
      ),
      p({ class: "mt-0.5 text-xs leading-relaxed text-zinc-500" }, info.description),
    ),
  );
}

/** Elige la plantilla del sitio. Todas usan los mismos productos, categorías, colores y textos. */
export default function TemplatePicker() {
  const templates = metaStore.get()?.templates ?? { classic: "Clásica" };

  return div(
    { class: "space-y-2" },
    Object.entries(templates).map(([id, name]) => TemplateOption(id, name)),
    p(
      { class: "pt-1 text-xs text-zinc-400" },
      "Tienda y Carta reutilizan los textos de las secciones Portada, Destacados y Pasos.",
    ),
  );
}
