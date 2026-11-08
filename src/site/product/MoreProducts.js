// «También te puede gustar»: 3 productos al final de la ficha para seguir explorando el menú.
// Primero de la misma categoría, luego del resto; mezclados con una semilla por producto para que
// el orden sea "al azar" pero estable (no cambia cada vez que se abre la misma ficha).
import van from "vanjs-core";
import Icon from "../../ui/Icon.js";
import { formatPrice } from "../../core/format.js";
import { imageProps } from "../../core/image.js";
import { getCategoryName, getVisibleProducts } from "../../core/siteSelectors.js";

const { section, h3, ul, li, button, div, img, p, span } = van.tags;

const SUGGESTIONS = 3;

function seededRandom(text) {
  let seed = [...text].reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 7);
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
}

function shuffle(list, random) {
  const copy = [...list];
  for (let index = copy.length - 1; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

export function pickSuggestions(site, product, count = SUGGESTIONS) {
  const random = seededRandom(product.id);
  const others = getVisibleProducts(site).filter((item) => item.id !== product.id);
  const sameCategory = shuffle(others.filter((item) => item.categoryId === product.categoryId), random);
  const rest = shuffle(others.filter((item) => item.categoryId !== product.categoryId), random);
  return [...sameCategory, ...rest].slice(0, count);
}

const SuggestionCard = (site, product, onSelect) =>
  button(
    {
      type: "button",
      onclick: () => onSelect(product),
      "aria-label": `Ver ${product.name}`,
      class: "group block w-full text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent",
    },
    div(
      { class: "relative aspect-[4/3] overflow-hidden rounded-[min(var(--site-radius),0.75rem)] bg-surface" },
      product.imageUrl
        ? img({
            ...imageProps(product.imageUrl, { sizes: "(min-width: 640px) 22rem, 60vw", widths: [320, 480, 640] }),
            alt: "",
            loading: "lazy",
            decoding: "async",
            class: "size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105",
          })
        : div({ class: "grid size-full place-items-center text-muted" }, Icon("image", "size-8 opacity-40")),
      product.featured
        ? span({ class: "absolute top-2 left-2 grid size-7 place-items-center rounded-full bg-background/95 text-accent shadow-sm" }, Icon("star", "size-3.5"))
        : null,
    ),
    p({ class: "mt-3 text-[11px] font-semibold tracking-[0.15em] text-muted uppercase" }, getCategoryName(site, product.categoryId)),
    p({ class: "mt-1 line-clamp-2 font-heading text-base leading-snug font-medium text-foreground transition-colors group-hover:text-accent sm:text-lg" }, product.name),
    div(
      { class: "mt-1.5 flex items-center justify-between gap-2" },
      span({ class: "text-sm font-semibold text-foreground tabular-nums" }, formatPrice(site.business, product.price, product.priceFrom)),
      span({ class: "inline-flex items-center gap-1 text-xs font-medium text-muted transition group-hover:translate-x-0.5 group-hover:text-accent" }, "Ver", Icon("arrowRight", "size-3.5")),
    ),
  );

/** `onSelect(product)` abre el producto elegido en la misma ficha. */
export default function MoreProducts(site, product, onSelect) {
  const suggestions = pickSuggestions(site, product);
  if (!suggestions.length) return null;

  return section(
    { class: "border-t border-foreground/10 pt-6", "aria-label": "También te puede gustar" },
    h3({ class: "font-heading text-lg font-medium text-foreground sm:text-xl" }, "También te puede gustar"),
    // Celular: se desliza de lado. Escritorio: una fila de 3.
    ul(
      { class: "no-scrollbar -mx-4 mt-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:scroll-px-0 sm:grid sm:grid-cols-3 sm:gap-5 sm:overflow-visible sm:px-0" },
      suggestions.map((item) => li({ class: "w-[62%] shrink-0 snap-start sm:w-auto" }, SuggestionCard(site, item, onSelect))),
    ),
  );
}
