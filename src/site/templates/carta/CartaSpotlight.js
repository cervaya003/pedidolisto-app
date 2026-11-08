import van from "vanjs-core";
import Icon from "../../../ui/Icon.js";
import { formatPrice } from "../../../core/format.js";
import { imageProps } from "../../../core/image.js";
import { getSectionProps } from "../../../core/siteSelectors.js";
import { CartaItem } from "./CartaChapter.js";
import { chapterNumber, FAVORITES_ANCHOR, openProduct } from "./cartaStore.js";

const { section, div, p, h2, h3, img, button, article, ul } = van.tags;

// Los primeros favoritos se muestran como páginas de revista; el resto, como renglones de la carta.
const SPREAD_LIMIT = 3;

function Spread(product, site, index) {
  const isReversed = index % 2 === 1;

  return article(
    { "data-reveal": "", class: "grid items-center gap-8 md:grid-cols-2 md:gap-14" },
    div(
      { class: `relative aspect-[4/3] overflow-hidden rounded-card bg-surface ${isReversed ? "md:order-last" : ""}` },
      product.imageUrl
        ? img({
            ...imageProps(product.imageUrl, { sizes: "(min-width: 768px) 50vw, 100vw" }),
            alt: product.name,
            loading: "lazy",
            decoding: "async",
            class: "absolute inset-0 size-full object-cover",
          })
        : null,
    ),
    div(
      p({ class: "font-heading text-sm text-accent italic" }, `Nº ${chapterNumber(index)}`),
      h3({ class: "mt-3 font-heading text-3xl leading-tight font-medium text-balance text-foreground sm:text-5xl" }, product.name),
      product.description ? p({ class: "mt-5 max-w-md leading-relaxed text-foreground/75" }, product.description) : null,
      div(
        { class: "mt-7 flex flex-wrap items-center gap-6" },
        p({ class: "font-heading text-2xl text-foreground tabular-nums" }, formatPrice(site.business, product.price, product.priceFrom)),
        button(
          {
            type: "button",
            onclick: () => openProduct(product.id),
            class: "inline-flex items-center gap-2 border-b border-foreground pb-0.5 text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent",
          },
          "Ver detalle",
          Icon("arrowRight", "size-4"),
        ),
      ),
    ),
  );
}

/** Favoritos de la casa: los primeros en zigzag y el resto en lista. */
export default function CartaSpotlight(site, products) {
  // Oculta en «Secciones» o sin favoritos: no se dibuja.
  const props = getSectionProps(site, "featured");
  const featured = products.filter((product) => product.featured);
  if (!props || !featured.length) return null;
  const spreads = featured.slice(0, SPREAD_LIMIT);
  const rest = featured.slice(SPREAD_LIMIT);

  return section(
    { id: FAVORITES_ANCHOR, class: "mx-auto max-w-6xl scroll-mt-20 px-5 py-20 sm:px-8 sm:py-28", "aria-labelledby": "carta-spotlight-title" },
    div(
      { "data-reveal": "", class: "mb-14 text-center" },
      p({ class: "text-xs font-semibold tracking-[0.35em] text-accent uppercase" }, props.eyebrow || "Recomendaciones"),
      h2({ id: "carta-spotlight-title", class: "mt-4 font-heading text-4xl font-medium text-balance text-foreground sm:text-5xl" }, props.title || "De la casa"),
    ),
    div({ class: "space-y-16 sm:space-y-24" }, spreads.map((product, index) => Spread(product, site, index))),
    rest.length ? ul({ "data-reveal-stagger": "", class: "mt-16 grid gap-x-14 sm:mt-24 md:grid-cols-2" }, rest.map((product) => CartaItem(product, site.business))) : null,
  );
}
