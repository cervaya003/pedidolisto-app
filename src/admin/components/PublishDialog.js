// Ventana de revisión: lista lo que cambió desde la última publicación.
// Dos modos: «publish» (subir los cambios) y «discard» (confirmar que se pierden).
// Celular: hoja que sube desde abajo. Escritorio: ventana centrada.
import van from "vanjs-core";
import Icon from "../../ui/Icon.js";
import { adminStore } from "../adminStore.js";
import { summarizeChanges } from "../changeSummary.js";

const { dialog, div, h2, h3, p, span, ul, li, button } = van.tags;

const KINDS = {
  added: { label: "Nuevo", class: "bg-emerald-50 text-emerald-700 ring-emerald-600/20", dot: "bg-emerald-500" },
  modified: { label: "Editado", class: "bg-amber-50 text-amber-700 ring-amber-600/20", dot: "bg-amber-500" },
  removed: { label: "Eliminado", class: "bg-red-50 text-red-700 ring-red-600/20", dot: "bg-red-500" },
  moved: { label: "Orden", class: "bg-zinc-100 text-zinc-600 ring-zinc-500/20", dot: "bg-zinc-400" },
};

const plural = (count, one, many) => `${count} ${count === 1 ? one : many}`;

/** Tira de colores superpuestos, como en el selector de paletas. */
const Palette = (colors) =>
  span(
    { class: "flex -space-x-1" },
    colors.map((color) => span({ class: "inline-block size-4 shrink-0 rounded-full ring-2 ring-white", style: `background:${color}; box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.12)` })),
  );

function ChangeItem(change, index) {
  const kind = KINDS[change.kind];
  return li(
    { class: "publish-item flex items-start gap-3 py-2.5", style: `--delay: ${Math.min(index, 12) * 30}ms` },
    span({ class: `mt-1.5 size-2 shrink-0 rounded-full ${kind.dot}` }),
    div(
      { class: "min-w-0 flex-1" },
      p({ class: "truncate text-sm font-medium text-zinc-900" }, change.title),
      change.detail ? p({ class: "mt-0.5 text-xs leading-relaxed text-zinc-500 first-letter:uppercase" }, change.detail) : null,
      change.palette ? div({ class: "mt-1.5 flex items-center gap-2 text-zinc-400" }, Palette(change.palette[0]), "→", Palette(change.palette[1])) : null,
    ),
    span({ class: `shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${kind.class}` }, kind.label),
  );
}

function Group(group) {
  return div(
    { class: "py-3 first:pt-0" },
    h3(
      { class: "flex items-center gap-2 text-xs font-semibold tracking-wide text-zinc-500 uppercase" },
      Icon(group.icon, "size-4"),
      group.label,
      span({ class: "rounded-full bg-zinc-100 px-1.5 py-px text-[11px] font-medium text-zinc-600 tabular-nums" }, group.changes.length),
    ),
    ul({ class: "mt-1 divide-y divide-zinc-100" }, group.changes.map(ChangeItem)),
  );
}

/** Resumen de cuántos hay de cada tipo: «2 nuevos · 3 editados · 1 eliminado». */
function Totals(groups) {
  const counts = { added: 0, modified: 0, removed: 0, moved: 0 };
  groups.forEach((group) => group.changes.forEach((change) => counts[change.kind]++));
  const words = { added: ["nuevo", "nuevos"], modified: ["editado", "editados"], removed: ["eliminado", "eliminados"], moved: ["cambio de orden", "cambios de orden"] };
  return div(
    { class: "flex flex-wrap gap-2" },
    Object.entries(counts)
      .filter(([, count]) => count)
      .map(([kind, count]) => span({ class: `rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${KINDS[kind].class}` }, plural(count, ...words[kind]))),
  );
}

let element = null;
let secondaryButton = null;
let primaryButton = null;
const groups = van.state([]);
const mode = van.state("publish");
const isDiscard = () => mode.val === "discard";
const totalChanges = () => groups.val.reduce((sum, group) => sum + group.changes.length, 0);

function close() {
  element?.close();
}

function getDialog() {
  if (element) return element;
  element = dialog(
    {
      "aria-labelledby": "publish-title",
      class:
        "publish-dialog m-auto flex max-h-[85dvh] w-full max-w-lg flex-col overflow-hidden bg-white p-0 shadow-2xl backdrop:bg-zinc-900/40 backdrop:backdrop-blur-[2px] max-sm:mb-0 max-sm:max-h-[90dvh] max-sm:rounded-t-2xl sm:w-[calc(100%-2rem)] sm:rounded-2xl [&:not([open])]:hidden",
      onclick: (event) => event.target === element && close(),
    },
    // Encabezado
    div(
      { class: "flex items-start gap-3 border-b border-zinc-100 p-5" },
      () =>
        isDiscard()
          ? span({ class: "grid size-10 shrink-0 place-items-center rounded-full bg-red-50 text-red-600" }, Icon("trash", "size-5"))
          : span({ class: "grid size-10 shrink-0 place-items-center rounded-full bg-zinc-900 text-white" }, Icon("receipt", "size-5")),
      div(
        { class: "min-w-0 flex-1" },
        h2({ id: "publish-title", class: "text-base font-semibold text-zinc-900" }, () => (isDiscard() ? "¿Descartar tus cambios?" : "Revisa tus cambios")),
        p({ class: "mt-0.5 text-sm text-zinc-500" }, () =>
          isDiscard()
            ? `Se perderán ${plural(totalChanges(), "cambio", "cambios")} y el sitio volverá a como está publicado.`
            : `${plural(totalChanges(), "cambio", "cambios")} desde la última publicación.`,
        ),
      ),
      button({ type: "button", class: "btn-icon -mt-1 -mr-1", "aria-label": "Cerrar", onclick: close }, Icon("close", "size-4")),
    ),
    // Lista
    div(
      { class: "min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4" },
      () =>
        groups.val.length
          ? div({ class: "space-y-4" }, Totals(groups.val), div({ class: "divide-y divide-zinc-100" }, groups.val.map(Group)))
          : p({ class: "py-6 text-center text-sm text-zinc-500" }, () => (isDiscard() ? "Hay ajustes menores sin publicar." : "Hay ajustes menores listos para publicar.")),
    ),
    // Pie
    div(
      { class: "flex flex-col-reverse gap-2 border-t border-zinc-100 bg-zinc-50/60 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5" },
      p({ class: () => `text-center text-xs sm:text-left ${isDiscard() ? "text-red-600" : "text-zinc-500"}` }, () => (isDiscard() ? "Esto no se puede deshacer." : "Tus clientes verán esto al instante.")),
      div(
        { class: "flex gap-2" },
        (secondaryButton = button({ type: "button", class: "btn-secondary flex-1 sm:flex-none", onclick: close }, "Seguir editando")),
        (primaryButton = button(
          {
            type: "button",
            class: () => `btn-primary flex-1 sm:flex-none ${isDiscard() ? "bg-red-600 hover:bg-red-700 focus-visible:outline-red-600" : ""}`,
            disabled: () => adminStore.status.val !== "idle",
            onclick: async () => {
              if (isDiscard()) {
                adminStore.discard();
                return close();
              }
              await adminStore.save();
              if (!adminStore.isDirty.val) close();
            },
          },
          () => {
            if (isDiscard()) return span({ class: "flex items-center gap-2" }, Icon("trash", "size-4"), "Descartar cambios");
            if (adminStore.status.val === "saving") return span({ class: "flex items-center gap-2" }, Icon("loader", "size-4 animate-spin"), "Publicando…");
            return span({ class: "flex items-center gap-2" }, Icon("check", "size-4"), "Publicar");
          },
        )),
      ),
    ),
  );
  document.body.append(element);
  return element;
}

function open(nextMode) {
  mode.val = nextMode;
  groups.val = summarizeChanges(adminStore.published.rawVal, adminStore.draft.rawVal);
  getDialog().showModal();
  // Publicar: foco en «Publicar». Descartar: foco en «Seguir editando» para no perder nada por accidente.
  (nextMode === "discard" ? secondaryButton : primaryButton).focus();
}

/** Abre la revisión para publicar los cambios actuales. */
export const openPublishDialog = () => open("publish");

/** Pide confirmación antes de descartar, mostrando lo que se perdería. */
export const openDiscardDialog = () => open("discard");
