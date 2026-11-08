// Encabezado del panel del carrito: título, botón para regresar (opcional) y cerrar.
import van from "vanjs-core";
import Icon from "../../ui/Icon.js";
import { closeCart } from "./cartStore.js";

const { header, h2, button, div } = van.tags;

const ICON_BUTTON = "grid size-9 shrink-0 place-items-center rounded-full text-foreground transition hover:bg-foreground/5";

export default function DrawerHeader(title, { onBack } = {}) {
  return header(
    { class: "flex items-center justify-between gap-2 border-b border-foreground/10 px-5 py-4" },
    div(
      { class: "flex min-w-0 items-center gap-1" },
      onBack ? button({ type: "button", onclick: onBack, "aria-label": "Regresar al carrito", class: `${ICON_BUTTON} -ml-2` }, Icon("arrowLeft", "size-5")) : null,
      h2({ class: "truncate text-lg font-semibold text-foreground" }, title),
    ),
    button({ type: "button", onclick: closeCart, "aria-label": "Cerrar", class: ICON_BUTTON }, Icon("close", "size-5")),
  );
}
