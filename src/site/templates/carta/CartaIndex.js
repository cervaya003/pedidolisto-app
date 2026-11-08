import van from "vanjs-core";
import { CartIconButton } from "../../cart/CartControls.js";
import { OrdersButton } from "../../orders/MyOrders.js";
import { chapterId, chapterNumber, FAVORITES_ANCHOR } from "./cartaStore.js";
import { scrollSpy } from "../../motion/scroll.js";

const { nav, div, ol, li, a, span } = van.tags;

/**
 * Índice fijo de capítulos (categorías) con «Mis pedidos» y el carrito.
 * Movimiento: una línea fina de acento avanza con la lectura y el capítulo que estás leyendo
 * se resalta con un subrayado; en celular el índice se desliza solo para mantenerlo a la vista.
 */
export default function CartaIndex(groups, products, favoritesLabel = "") {
  const entries = [
    ...(favoritesLabel ? [{ id: FAVORITES_ANCHOR, label: `★ ${favoritesLabel}`, isFavorites: true }] : []),
    ...groups.map(({ category }, index) => ({ id: chapterId(category.id), label: category.name, number: chapterNumber(index) })),
  ];
  const spy = scrollSpy(entries.map((entry) => entry.id));
  const isActive = (entry) => spy.active.val === entry.id;

  const list = ol(
    { class: "no-scrollbar flex flex-1 gap-6 overflow-x-auto py-4 sm:gap-8" },
    entries.map((entry) =>
      li(
        { class: "shrink-0" },
        a(
          {
            href: `#${entry.id}`,
            "data-chapter": entry.id,
            "aria-current": () => String(isActive(entry)),
            class: () =>
              entry.isFavorites
                ? "nav-link inline-flex items-baseline gap-1.5 text-sm font-semibold text-accent transition-colors duration-300 hover:text-foreground"
                : `nav-link group inline-flex items-baseline gap-2 text-sm transition-colors duration-300 hover:text-accent ${isActive(entry) ? "text-accent" : "text-foreground/75"}`,
          },
          entry.isFavorites
            ? entry.label
            : [span({ class: "font-heading text-xs text-accent tabular-nums" }, entry.number), span({ class: "font-medium" }, entry.label)],
        ),
      ),
    ),
  );

  // Mantiene visible el capítulo activo cuando el índice no cabe (celular). Solo mueve el índice, no la página.
  van.derive(() => {
    const id = spy.active.val;
    if (!id || !list.isConnected) return;
    const link = list.querySelector(`[data-chapter="${CSS.escape(id)}"]`);
    if (!link) return;
    const left = link.offsetLeft - list.offsetLeft;
    const isOutOfView = left < list.scrollLeft || left + link.offsetWidth > list.scrollLeft + list.clientWidth;
    if (isOutOfView) list.scrollTo({ left: Math.max(0, left - 24), behavior: "smooth" });
  });

  return spy.attach(
    nav(
      { class: "sticky top-0 z-30 border-y border-foreground/10 bg-background/90 backdrop-blur-md", "aria-label": "Índice de la carta" },
      div({ class: "mx-auto flex max-w-6xl items-center gap-6 px-5 sm:px-8" }, list, div({ class: "-mr-2 flex shrink-0 items-center" }, OrdersButton("size-10 text-foreground hover:bg-foreground/5"), CartIconButton(products, "size-10 shrink-0 text-foreground hover:bg-foreground/5"))),
      // Progreso de lectura: una línea de acento que crece de izquierda a derecha.
      span({ class: "scroll-progress pointer-events-none absolute inset-x-0 -bottom-px h-px bg-accent", "aria-hidden": "true" }),
    ),
  );
}
