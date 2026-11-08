import van from "vanjs-core";
import Icon from "../../../ui/Icon.js";
import { formatPrice } from "../../../core/format.js";
import { imageProps } from "../../../core/image.js";
import { getCategoryName, getFavoritesLabel } from "../../../core/siteSelectors.js";
import { addToCart, cartQuantity, setQuantity } from "../../cart/cartStore.js";
import { QuantityStepper } from "../../cart/CartControls.js";
import { isCustomizable } from "../../product/optionRules.js";
import { openProduct } from "./marketStore.js";
import { PANEL_CLASS, RADIUS_SM } from "./ui.js";

const { article, button, div, img, h3, p, span } = van.tags;

const IMAGE_SIZES = "(min-width: 1280px) 18vw, (min-width: 768px) 28vw, 48vw";

const ACTION_CLASS = `flex h-9 w-full items-center justify-center gap-2 ${RADIUS_SM} bg-primary/10 text-sm font-semibold text-primary transition hover:bg-primary hover:text-on-primary`;

export function CartControl(product) {
  // Un producto personalizable no se agrega directo: primero se eligen sus opciones en la ficha.
  if (isCustomizable(product)) {
    return button({ type: "button", onclick: () => openProduct(product.id), class: ACTION_CLASS }, Icon("sliders", "size-4"), "Personalizar");
  }

  return () =>
    cartQuantity(product.id)
      ? div(
          { class: "flex items-center justify-center gap-2 sm:justify-between" },
          span({ class: "hidden text-xs font-medium text-accent sm:inline" }, "En tu carrito"),
          QuantityStepper({ value: () => cartQuantity(product.id), onChange: (quantity) => setQuantity(product.id, quantity), shape: RADIUS_SM }),
        )
      : button(
          {
            type: "button",
            onclick: () => addToCart(product.id),
            class: ACTION_CLASS,
          },
          Icon("cart", "size-4"),
          "Agregar",
        );
}

/** Tarjeta de producto estilo marketplace: foto cuadrada, nombre, precio grande y botón de pedido. */
export default function MarketCard(product, site, { compact = false } = {}) {
  const tagline = product.badge || getCategoryName(site, product.categoryId);

  return article(
    { class: `group flex h-full flex-col overflow-hidden ${PANEL_CLASS} transition-shadow hover:shadow-lg` },
    button(
      {
        type: "button",
        onclick: () => openProduct(product.id),
        "aria-label": `Ver ${product.name}`,
        class: "flex flex-1 flex-col text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent",
      },
      div(
        { class: "relative aspect-square overflow-hidden bg-surface" },
        product.imageUrl
          ? img({
              ...imageProps(product.imageUrl, { sizes: IMAGE_SIZES, widths: [320, 480, 800] }),
              alt: product.name,
              loading: "lazy",
              decoding: "async",
              class: "size-full object-cover transition-transform duration-500 group-hover:scale-105",
            })
          : div({ class: "grid size-full place-items-center text-muted" }, Icon("image", "size-10 opacity-40")),
        product.featured
          ? span(
              { class: "absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-background/95 px-2 py-0.5 text-[10px] font-bold text-accent uppercase shadow-sm" },
              Icon("star", "size-3"),
              getFavoritesLabel(site) || "Favorito",
            )
          : null,
      ),
      div(
        { class: `flex flex-1 flex-col border-t border-foreground/5 ${compact ? "p-3" : "p-3 sm:p-4"}` },
        h3({ class: "line-clamp-2 text-sm leading-snug text-foreground/85" }, product.name),
        product.priceFrom ? p({ class: "mt-2 text-xs text-muted" }, "Desde") : null,
        p(
          { class: `${product.priceFrom ? "" : "mt-2"} text-xl font-medium tracking-tight text-foreground tabular-nums sm:text-2xl` },
          formatPrice(site.business, product.price),
        ),
        tagline ? p({ class: "mt-1 text-xs font-semibold text-accent" }, tagline) : null,
      ),
    ),
    compact ? null : div({ class: "px-3 pb-3 sm:px-4 sm:pb-4" }, CartControl(product)),
  );
}
