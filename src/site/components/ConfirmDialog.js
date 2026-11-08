// Confirmación para el sitio público (quitar del carrito, vaciarlo). Usa los colores y formas del tema.
// Se abre encima del panel del carrito (los <dialog> modales se apilan).
import van from "vanjs-core";
import Icon from "../../ui/Icon.js";

const { dialog, div, h2, p, button, span } = van.tags;

const content = van.state({ title: "", message: "", confirmLabel: "Quitar", cancelLabel: "Cancelar" });
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
      "aria-labelledby": "site-confirm-title",
      class:
        "m-auto w-[calc(100%-2rem)] max-w-sm rounded-[min(var(--site-radius),1rem)] bg-background p-0 text-foreground shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-[2px] open:animate-fade-up",
      oncancel: (event) => {
        event.preventDefault();
        finish(false);
      },
      onclick: (event) => event.target === element && finish(false),
    },
    div(
      { class: "p-5 sm:p-6" },
      div(
        { class: "flex items-start gap-3" },
        span({ class: "grid size-10 shrink-0 place-items-center rounded-full bg-red-500/10 text-red-600" }, Icon("trash", "size-5")),
        div(
          { class: "min-w-0 flex-1" },
          h2({ id: "site-confirm-title", class: "text-base font-semibold text-foreground" }, () => content.val.title),
          p({ class: "mt-1 text-sm text-muted" }, () => content.val.message),
        ),
      ),
      div(
        { class: "mt-6 flex justify-end gap-2" },
        button({ type: "button", class: "btn-secondary", autofocus: true, onclick: () => finish(false) }, () => content.val.cancelLabel),
        button(
          {
            type: "button",
            class: "inline-flex items-center justify-center gap-2 rounded-button bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600",
            onclick: () => finish(true),
          },
          () => content.val.confirmLabel,
        ),
      ),
    ),
  );
  document.body.append(element);
  return element;
}

/**
 * Resuelve true si el cliente confirma. «Cancelar» queda enfocado (Enter por reflejo no borra nada).
 * `text` es sinónimo de `message`.
 */
export function confirmAction({ title, message, text, confirmLabel = "Quitar", cancelLabel = "Cancelar" }) {
  resolveCurrent?.(false);
  content.val = { title, message: message ?? text ?? "", confirmLabel, cancelLabel };
  const target = getDialog();
  return new Promise((resolve) => {
    resolveCurrent = resolve;
    target.showModal();
  });
}
