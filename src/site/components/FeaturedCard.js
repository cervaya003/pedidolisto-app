import van from "vanjs-core";
import Badge from "./Badge.js";
import { formatPrice } from "../../core/format.js";
import { imageProps } from "../../core/image.js";
import { getCategoryName } from "../../core/siteSelectors.js";
import { openProduct } from "../uiStore.js";

const { button, img, div, p, h3 } = van.tags;

export default function FeaturedCard(product, site) {
  return button(
    {
      type: "button",
      onclick: () => openProduct(product),
      "aria-label": `Ver detalle de ${product.name}`,
      class:
        "group relative block aspect-[4/5] w-full overflow-hidden rounded-card bg-surface text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent",
    },
    product.imageUrl
      ? img({
          ...imageProps(product.imageUrl, { sizes: "(min-width: 1024px) 31vw, (min-width: 640px) 44vw, 78vw" }),
          alt: product.name,
          loading: "lazy",
          decoding: "async",
          class: "absolute inset-0 size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105",
        })
      : null,
    div({ class: "absolute inset-0 bg-linear-to-t from-black/80 via-black/10 to-transparent", "aria-hidden": "true" }),
    product.badge ? Badge(product.badge, "absolute top-4 left-4") : null,
    div(
      { class: "absolute inset-x-0 bottom-0 p-6" },
      p({ class: "text-xs font-semibold tracking-[0.18em] text-white/70 uppercase" }, getCategoryName(site, product.categoryId)),
      h3({ class: "mt-2 font-heading text-2xl leading-tight font-medium text-white sm:text-3xl" }, product.name),
      p({ class: "mt-3 text-base font-semibold text-white" }, formatPrice(site.business, product.price, product.priceFrom)),
    ),
  );
}
