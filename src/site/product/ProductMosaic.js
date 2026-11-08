// Fotos de la plantilla Clásica: primer vistazo en mosaico (las 3 primeras) y, al tocar una foto o
// «siguiente», se abre el carrusel en grande desde esa foto. Un botón regresa al mosaico.
import van from "vanjs-core";
import Icon from "../../ui/Icon.js";
import { imageProps } from "../../core/image.js";
import ProductGallery, { productImages } from "./ProductGallery.js";

const { div, button, img, span } = van.tags;

const MOSAIC_PHOTOS = 3;

// Clases completas para que Tailwind las genere.
const LAYOUTS = {
  2: { grid: "grid-cols-3 grid-rows-1", main: "col-span-2 row-span-1" },
  3: { grid: "grid-cols-3 grid-rows-2", main: "col-span-2 row-span-2" },
};

export default function ProductMosaic(product, { radius = "rounded-card" } = {}) {
  const images = productImages(product);
  if (images.length <= 1) return ProductGallery(product, { radius });

  const shown = images.slice(0, MOSAIC_PHOTOS);
  const hiddenCount = images.length - shown.length;
  const layout = LAYOUTS[shown.length];
  // null = mosaico; número = carrusel abierto en esa foto.
  const openAt = van.state(null);

  const Tile = (src, index) => {
    const isMain = index === 0;
    const isLast = index === shown.length - 1;
    return button(
      {
        type: "button",
        onclick: () => (openAt.val = index),
        "aria-label": `Ver foto ${index + 1} en grande`,
        class: `group relative overflow-hidden bg-surface ${radius} ${isMain ? layout.main : ""} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`,
      },
      img({
        ...imageProps(src, { sizes: isMain ? "(min-width: 768px) 24rem, 66vw" : "(min-width: 768px) 12rem, 33vw", widths: isMain ? [480, 800, 1200] : [240, 480] }),
        alt: isMain ? product.name : "",
        loading: isMain ? "eager" : "lazy",
        decoding: "async",
        class: "size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105",
      }),
      // Más fotos de las que caben: «+2» sobre la última.
      isLast && hiddenCount > 0
        ? span(
            { class: "absolute inset-0 grid place-items-center bg-black/45 text-2xl font-semibold text-white backdrop-blur-[1px] transition group-hover:bg-black/55" },
            `+${hiddenCount}`,
          )
        : div({ class: "absolute inset-0 bg-black/0 transition group-hover:bg-black/10", "aria-hidden": "true" }),
    );
  };

  const Mosaic = () =>
    div(
      { class: "relative" },
      div({ class: `grid aspect-square gap-2 ${layout.grid}`, role: "group", "aria-label": `Fotos de ${product.name}` }, shown.map(Tile)),
      // «Siguiente» sobre la foto grande: abre el carrusel en la segunda foto.
      button(
        {
          type: "button",
          onclick: () => (openAt.val = 1),
          "aria-label": "Ver fotos en grande",
          class: "absolute top-1/2 left-[calc(66.666%-3.25rem)] grid size-10 -translate-y-1/2 place-items-center rounded-full bg-background/90 text-foreground shadow-lg ring-1 ring-foreground/5 backdrop-blur transition hover:scale-105",
        },
        Icon("chevronRight", "size-5"),
      ),
      span(
        { class: "pointer-events-none absolute top-3 left-3 rounded-full bg-black/45 px-2.5 py-1 text-xs font-medium text-white backdrop-blur" },
        `${images.length} fotos`,
      ),
    );

  const Carousel = (startIndex) =>
    div(
      { class: "relative animate-fade-up" },
      ProductGallery(product, { radius, startIndex }),
      button(
        {
          type: "button",
          onclick: () => (openAt.val = null),
          "aria-label": "Ver todas en mosaico",
          title: "Ver todas en mosaico",
          class: "absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1 text-xs font-medium text-white backdrop-blur transition hover:bg-black/60",
        },
        Icon("grid", "size-3.5"),
        "Mosaico",
      ),
    );

  return () => (openAt.val === null ? Mosaic() : Carousel(openAt.val));
}
