// Confirmación antes de eliminar algo en el admin. Una sola ventana para todo el panel.
// Uso: if (await confirmDelete({ title: "¿Eliminar la sección?", message: "…" })) eliminar();
import van from "vanjs-core";
import Icon from "../../ui/Icon.js";

const { dialog, div, h2, p, button, span } = van.tags;

const content = van.state({ title: "", message: "", confirmLabel: "Eliminar" });
let resolveCurrent = null;
let element = null;

function finish(result) {
  element.close();
  resolveCurrent?.(result);
  resolveCurrent = null;
}

function getDialog() {
  if (element) return element;
  element = dialog(
    {
      "aria-labelledby": "confirm-title",
      class: "m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl bg-white p-0 shadow-2xl backdrop:bg-zinc-900/40 backdrop:backdrop-blur-[2px]",
      // Esc o tocar fuera = cancelar.
      oncancel: (event) => {
        event.preventDefault();
        finish(false);
      },
      onclick: (event) => event.target === element && finish(false),
    },
    div(
      { class: "p-5" },
      div(
        { class: "flex items-start gap-3" },
        span({ class: "grid size-10 shrink-0 place-items-center rounded-full bg-red-50 text-red-600" }, Icon("trash", "size-5")),
        div(
          { class: "min-w-0 flex-1" },
          h2({ id: "confirm-title", class: "text-base font-semibold text-zinc-900" }, () => content.val.title),
          p({ class: "mt-1 text-sm text-zinc-500" }, () => content.val.message),
        ),
      ),
      p({ class: "mt-4 rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-500" }, "Mientras no publiques, puedes recuperarlo con «Descartar»."),
      div(
        { class: "mt-5 flex justify-end gap-2" },
        button({ type: "button", class: "btn-secondary", autofocus: true, onclick: () => finish(false) }, "Cancelar"),
        button(
          { type: "button", class: "btn-primary bg-red-600 hover:bg-red-700 focus-visible:outline-red-600", onclick: () => finish(true) },
          () => content.val.confirmLabel,
        ),
      ),
    ),
  );
  document.body.append(element);
  return element;
}

/** Abre la confirmación y resuelve true si el usuario confirma. «Cancelar» queda enfocado por seguridad. */
export function confirmDelete({ title = "¿Eliminar este elemento?", message = "Esta acción quitará el elemento.", confirmLabel = "Eliminar" } = {}) {
  resolveCurrent?.(false);
  content.val = { title, message, confirmLabel };
  const target = getDialog();
  return new Promise((resolve) => {
    resolveCurrent = resolve;
    target.showModal();
  });
}

/** Envuelve una acción de eliminar: solo se ejecuta si el usuario confirma. */
export const withConfirm = (options, action) => async () => {
  if (await confirmDelete(typeof options === "function" ? options() : options)) action();
};
