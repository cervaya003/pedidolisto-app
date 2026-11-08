// Controles del carrito reutilizables por cualquier plantilla. Usan solo tokens del tema.
import van from "vanjs-core";
import Icon from "../../ui/Icon.js";
import { formatPrice } from "../../core/format.js";
import { getCartCount, getCartLines, getCartTotal, openCart } from "./cartStore.js";

const { div, button, span } = van.tags;

const STEP_BUTTON =
  "grid size-8 place-items-center text-foreground transition hover:bg-foreground/5 disabled:opacity-30 disabled:hover:bg-transparent";

/** Selector de cantidad. `value` es una función para poder leer estados. */
export function QuantityStepper({ value, onChange, min = 0, size = "md", shape = "rounded-button" }) {
  return div(
    { class: `inline-flex items-center overflow-hidden ${shape} border border-foreground/15 bg-background ${size === "lg" ? "h-11" : "h-9"}` },
    button(
      { type: "button", "aria-label": "Quitar uno", class: STEP_BUTTON, disabled: () => value() <= min, onclick: () => onChange(value() - 1) },
      Icon("minus", "size-4"),
    ),
    span({ class: "min-w-8 text-center text-sm font-semibold tabular-nums text-foreground", "aria-live": "polite" }, () => value()),
    button({ type: "button", "aria-label": "Agregar uno", class: STEP_BUTTON, onclick: () => onChange(value() + 1) }, Icon("plus", "size-4")),
  );
}

/** Ícono de carrito con contador. `className` define tamaño y colores del botón. */
export function CartIconButton(products, className, badgeRing = "ring-background") {
  const count = () => getCartCount(getCartLines(products));

  return button(
    {
      type: "button",
      onclick: openCart,
      "aria-label": () => `Ver carrito (${count()} productos)`,
      class: `relative grid place-items-center rounded-full transition ${className}`,
    },
    Icon("cart", "size-6"),
    // Se vuelve a crear con cada cambio de cantidad, así el rebote se repite al agregar algo.
    () => {
      const value = count();
      return value
        ? span(
            {
              class: `absolute -top-1 -right-1 min-w-5 animate-badge-pop rounded-full bg-accent px-1.5 text-center text-[11px] leading-5 font-bold text-on-primary ring-2 ${badgeRing}`,
            },
            value,
          )
        : span({ hidden: true });
    },
  );
}

/** Barra fija inferior (celular) que aparece cuando hay productos en el carrito. */
export function MobileCartBar(site, products) {
  return () => {
    const lines = getCartLines(products);
    const count = getCartCount(lines);

    return div(
      { class: `fixed inset-x-0 bottom-0 z-30 border-t border-foreground/10 bg-background/95 p-3 backdrop-blur md:hidden ${count ? "" : "hidden"}` },
      button(
        { type: "button", onclick: openCart, class: "btn-primary w-full justify-between py-3" },
        span({ class: "inline-flex items-center gap-2" }, Icon("cart", "size-5"), `Ver carrito (${count})`),
        span({ class: "tabular-nums" }, formatPrice(site.business, getCartTotal(lines))),
      ),
    );
  };
}
