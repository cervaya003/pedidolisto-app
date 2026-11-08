import van from "vanjs-core";
import { formatPrice } from "../../../core/format.js";
import { imageProps } from "../../../core/image.js";
import { chapterId, chapterNumber, openProduct } from "./cartaStore.js";

const { section, header, span, div, h2, p, ul, li, button, img, h3, small } = van.tags;

const optionsLabel = (count) => `${count} ${count === 1 ? "opción" : "opciones"}`;

/** Renglón de la carta: nombre, línea punteada y precio, como en un menú impreso. */
export function CartaItem(product, business) {
  return li(
    button(
      {
        type: "button",
        onclick: () => openProduct(product.id),
        "aria-label": `Ver detalle de ${product.name}`,
        class: "group flex w-full items-start gap-4 border-b border-dashed border-foreground/15 py-5 text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent",
      },
      product.imageUrl
        ? div(
            { class: "size-16 shrink-0 overflow-hidden rounded-full bg-surface ring-1 ring-foreground/10 sm:size-20" },
            img({
              ...imageProps(product.imageUrl, { sizes: "5rem", widths: [160, 240] }),
              alt: "",
              loading: "lazy",
              decoding: "async",
              class: "size-full object-cover transition-transform duration-500 group-hover:scale-110",
            }),
          )
        : null,
      div(
        { class: "min-w-0 flex-1" },
        div(
          { class: "flex items-baseline gap-3" },
          h3({ class: "font-heading text-lg leading-snug font-medium text-foreground transition-colors group-hover:text-accent sm:text-xl" }, product.name),
          span({ class: "min-w-6 flex-1 -translate-y-1 border-b border-dotted border-foreground/30", "aria-hidden": "true" }),
          p(
            { class: "shrink-0 font-heading text-lg text-foreground tabular-nums" },
            product.priceFrom ? small({ class: "mr-1 font-body text-xs text-muted" }, "desde") : null,
            formatPrice(business, product.price),
          ),
        ),
        product.badge ? p({ class: "mt-1 text-[10px] font-bold tracking-[0.2em] text-accent uppercase" }, product.badge) : null,
        product.description ? p({ class: "mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted" }, product.description) : null,
      ),
    ),
  );
}

/** Un capítulo de la carta por categoría, con número grande y lista en dos columnas. */
export default function CartaChapter({ category, products }, index, site) {
  return section(
    { id: chapterId(category.id), class: "scroll-mt-20 border-t border-foreground/10 py-14 first:border-t-0 sm:py-20" },
    header(
      { "data-reveal": "", class: "mb-8 flex items-end gap-5 sm:mb-10" },
      span({ class: "font-heading text-6xl leading-none font-light text-accent tabular-nums sm:text-8xl", "aria-hidden": "true" }, chapterNumber(index)),
      div(
        { class: "pb-1" },
        h2({ class: "font-heading text-3xl leading-tight font-medium text-foreground italic sm:text-5xl" }, category.name),
        p({ class: "mt-1 text-xs font-semibold tracking-[0.2em] text-muted uppercase" }, optionsLabel(products.length)),
      ),
    ),
    ul({ "data-reveal-stagger": "", class: "grid gap-x-14 md:grid-cols-2" }, products.map((product) => CartaItem(product, site.business))),
  );
}
