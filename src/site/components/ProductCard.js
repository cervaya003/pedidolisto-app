import van from "vanjs-core";
import Badge from "./Badge.js";
import Icon from "../../ui/Icon.js";
import { formatPrice } from "../../core/format.js";
import { imageProps } from "../../core/image.js";
import { openProduct } from "../uiStore.js";

const { button, img, div, h3, p, span } = van.tags;

const IMAGE_SIZES = {
  normal: "(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw",
  wide: "(min-width: 768px) 50vw, 100vw",
  large: "(min-width: 768px) 50vw, 100vw",
};

const BUTTON_CLASS =
  "group relative block size-full overflow-hidden rounded-card text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent";

const Photo = (product, className) =>
  product.imageUrl
    ? img({
        ...imageProps(product.imageUrl, { sizes: IMAGE_SIZES[product.size] ?? IMAGE_SIZES.normal }),
        alt: product.name,
        loading: "lazy",
        decoding: "async",
        class: `absolute inset-0 size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 ${className}`,
      })
    : div({ class: "absolute inset-0 grid place-items-center text-muted" }, Icon("image", "size-10 opacity-40"));

function OverlayCard(product, business) {
  const isLarge = product.size === "large";

  return [
    Photo(product),
    div({ class: "absolute inset-0 bg-linear-to-t from-black/80 via-black/15 to-transparent", "aria-hidden": "true" }),
    product.badge ? Badge(product.badge, "absolute top-3 left-3 sm:top-4 sm:left-4") : null,
    div(
      { class: `absolute inset-x-0 bottom-0 p-4 sm:p-5 ${isLarge ? "lg:p-7" : ""}` },
      h3(
        { class: `font-heading leading-tight font-medium text-white ${isLarge ? "text-2xl sm:text-4xl" : "text-base sm:text-xl"}` },
        product.name,
      ),
      isLarge && product.description
        ? p({ class: "mt-2 hidden max-w-md text-sm leading-relaxed text-white/80 sm:block" }, product.description)
        : null,
      div(
        { class: "mt-2 flex items-center justify-between gap-2" },
        span({ class: "text-sm font-semibold text-white sm:text-base" }, formatPrice(business, product.price, product.priceFrom)),
        span(
          {
            class:
              "hidden translate-x-1 items-center gap-1 text-xs font-medium text-white/90 opacity-0 transition duration-300 group-hover:translate-x-0 group-hover:opacity-100 sm:inline-flex",
          },
          "Ver detalle",
          Icon("arrowRight", "size-3.5"),
        ),
      ),
    ),
  ];
}

function ClassicCard(product, business) {
  const isLarge = product.size === "large";

  return div(
    { class: "flex size-full flex-col" },
    div(
      { class: "relative min-h-0 flex-1 overflow-hidden" },
      Photo(product),
      product.badge ? Badge(product.badge, "absolute top-3 left-3") : null,
    ),
    div(
      { class: "p-4 sm:p-5" },
      h3({ class: `font-heading leading-tight font-medium text-foreground ${isLarge ? "text-2xl" : "text-base sm:text-lg"}` }, product.name),
      isLarge && product.description ? p({ class: "mt-1 line-clamp-2 text-sm text-muted" }, product.description) : null,
      p({ class: "mt-1.5 text-sm font-semibold text-accent sm:text-base" }, formatPrice(business, product.price, product.priceFrom)),
    ),
  );
}

const CARD_RENDERERS = { overlay: OverlayCard, classic: ClassicCard };

export default function ProductCard(product, { business, cardStyle = "overlay" }) {
  const render = CARD_RENDERERS[cardStyle] ?? OverlayCard;

  return button(
    {
      type: "button",
      onclick: () => openProduct(product),
      "aria-label": `Ver detalle de ${product.name}`,
      class: `${BUTTON_CLASS} ${cardStyle === "classic" ? "bg-surface shadow-sm" : "bg-surface"}`,
    },
    render(product, business),
  );
}
