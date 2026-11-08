// Galería de fotos de la ficha: se desliza con el dedo (scroll-snap nativo), con flechas,
// puntos y contador. La foto activa se "asienta" con un leve zoom (solo transform/opacity).
// Acomodos: "below" (miniaturas abajo), "side" (miniaturas verticales a la izquierda, tipo
// marketplace) y "arch" (foto en arco, sin miniaturas, estilo editorial).
import van from "vanjs-core";
import Icon from "../../ui/Icon.js";
import { imageProps } from "../../core/image.js";

const { div, button, img, span } = van.tags;

const SLIDE_SIZES = "(min-width: 768px) 32rem, 100vw";
// Si nadie toca la galería durante este tiempo, pasa sola a la siguiente foto.
const AUTOPLAY_MS = 5000;
// Clase literal: Tailwind solo genera las clases que ve escritas completas.
const ARCH_BOTTOM = "rounded-b-[min(var(--site-radius),0.75rem)]";

/** Foto principal + adicionales, sin vacíos. */
export const productImages = (product) => [product.imageUrl, ...(product.gallery ?? [])].filter(Boolean);

const ArrowButton = (icon, label, onclick, side) =>
  button(
    {
      type: "button",
      "aria-label": label,
      onclick,
      class: `absolute top-1/2 ${side} z-10 hidden size-10 -translate-y-1/2 place-items-center rounded-full bg-background/90 text-foreground opacity-0 shadow-lg ring-1 ring-foreground/5 backdrop-blur transition duration-300 group-hover:opacity-100 hover:scale-105 focus-visible:opacity-100 sm:grid`,
    },
    Icon(icon, "size-5"),
  );

const Placeholder = () => div({ class: "grid size-full place-items-center text-muted" }, Icon("image", "size-12 opacity-40"));

/** Marco en arco con un contorno fino desplazado detrás (mismo lenguaje que la portada de la Carta). */
const ArchFrame = (...children) =>
  div(
    { class: "relative mx-auto w-full max-w-md md:max-w-[26rem]" },
    div({ class: `absolute inset-0 translate-x-3 translate-y-3 rounded-t-full ${ARCH_BOTTOM} border border-accent/40`, "aria-hidden": "true" }),
    ...children,
  );

/** `startIndex`: foto con la que abre (la galería se posiciona ahí sin animación). */
export default function ProductGallery(product, { radius = "rounded-card", layout = "below", startIndex = 0 } = {}) {
  const images = productImages(product);
  const isArch = layout === "arch";
  const shape = isArch ? `aspect-[4/5] rounded-t-full ${ARCH_BOTTOM}` : `aspect-square ${radius}`;
  const frameClass = `relative overflow-hidden bg-surface ${shape}`;

  if (images.length <= 1) {
    const frame = div(
      { class: frameClass },
      images[0] ? img({ ...imageProps(images[0], { sizes: SLIDE_SIZES }), alt: product.name, class: "size-full object-cover" }) : Placeholder(),
    );
    return isArch ? ArchFrame(frame) : frame;
  }

  const count = images.length;
  const active = van.state(Math.min(Math.max(0, startIndex), count - 1));

  const track = div(
    {
      tabindex: "0",
      "aria-roledescription": "carrusel",
      "aria-label": `Fotos de ${product.name}`,
      class: "no-scrollbar flex size-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain outline-none",
      onkeydown: (event) => {
        const step = { ArrowLeft: -1, ArrowRight: 1 }[event.key];
        if (step) {
          event.preventDefault();
          go(active.val + step);
        }
      },
    },
    images.map((src, index) =>
      div(
        { class: "relative size-full shrink-0 snap-center overflow-hidden", "aria-roledescription": "foto", "aria-label": `${index + 1} de ${count}` },
        img({
          ...imageProps(src, { sizes: SLIDE_SIZES }),
          alt: index ? "" : product.name,
          loading: index ? "lazy" : "eager",
          decoding: "async",
          draggable: "false",
          class: () =>
            `size-full object-cover transition-[transform,opacity] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              active.val === index ? "scale-100 opacity-100" : "scale-[1.08] opacity-60"
            }`,
        }),
      ),
    ),
  );

  // La foto activa se calcula desde el scroll (sirve igual para dedo, flechas y teclado).
  let frame = 0;
  track.addEventListener(
    "scroll",
    () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => (active.val = Math.round(track.scrollLeft / Math.max(1, track.clientWidth))));
      restartAutoplay(); // cualquier movimiento (dedo, flechas, puntos, miniaturas, teclado) reinicia la espera
    },
    { passive: true },
  );

  // Abre directo en la foto pedida, sin animación (cuando ya tiene ancho en pantalla).
  if (active.rawVal) requestAnimationFrame(() => (track.scrollLeft = active.rawVal * track.clientWidth));

  // Avance automático: cuenta 5 s desde el último movimiento. Mientras el dedo o el mouse
  // están presionados sobre la foto, espera. Se detiene cuando la galería sale de la página.
  let autoplayTimer = 0;
  let isHeld = false;
  let wasMounted = false;
  function restartAutoplay() {
    clearTimeout(autoplayTimer);
    autoplayTimer = setTimeout(autoplayTick, AUTOPLAY_MS);
  }
  function autoplayTick() {
    if (!track.isConnected) {
      if (wasMounted) return; // la ficha se cerró: no se vuelve a programar
      return restartAutoplay(); // todavía no entra a la página
    }
    wasMounted = true;
    if (isHeld || document.hidden || !track.clientWidth) return restartAutoplay();
    go(active.val + 1);
    restartAutoplay();
  }
  const hold = () => {
    isHeld = true;
    restartAutoplay();
  };
  const release = () => {
    isHeld = false;
    restartAutoplay();
  };
  restartAutoplay();

  // Circular: después de la última vuelve a la primera.
  function go(index) {
    const target = (index + count) % count;
    track.scrollTo({ left: target * track.clientWidth, behavior: "smooth" });
  }

  const slider = div(
    {
      class: `group ${frameClass} ${layout === "side" ? "md:min-w-0 md:flex-1" : ""}`,
      onpointerdown: hold,
      onpointerup: release,
      onpointercancel: release,
      onpointerleave: release,
    },
    track,
    ArrowButton("chevronLeft", "Foto anterior", () => go(active.val - 1), "left-3"),
    ArrowButton("chevronRight", "Foto siguiente", () => go(active.val + 1), "right-3"),
    // En el arco el contador chocaría con la curva: ahí bastan los puntos.
    isArch
      ? null
      : span(
          { class: "pointer-events-none absolute top-3 right-3 rounded-full bg-black/45 px-2.5 py-1 text-xs font-medium text-white tabular-nums backdrop-blur" },
          () => `${active.val + 1} / ${count}`,
        ),
    div(
      { class: `absolute inset-x-0 flex justify-center gap-1.5 ${isArch ? "bottom-5" : "bottom-3"}` },
      images.map((_, index) =>
        button({
          type: "button",
          "aria-label": `Ver foto ${index + 1}`,
          onclick: () => go(index),
          class: () => `h-1.5 rounded-full shadow transition-all duration-500 ${active.val === index ? "w-6 bg-white" : "w-1.5 bg-white/60 hover:bg-white/90"}`,
        }),
      ),
    ),
  );

  if (isArch) return ArchFrame(slider);

  const thumbnails = div(
    { class: layout === "side" ? "grid grid-cols-5 gap-2 md:order-first md:flex md:w-16 md:shrink-0 md:flex-col" : "grid grid-cols-5 gap-2" },
    images.map((src, index) =>
      button(
        {
          type: "button",
          "aria-label": `Ver foto ${index + 1}`,
          onclick: () => go(index),
          // En vertical se resalta con borde (como en los marketplaces); abajo, con anillo.
          class: () =>
            `aspect-square overflow-hidden rounded-[min(var(--site-radius),0.5rem)] bg-surface transition duration-300 ${
              active.val === index ? "opacity-100 ring-2 ring-primary ring-offset-2 ring-offset-background" : "opacity-55 hover:opacity-100"
            }`,
        },
        img({ ...imageProps(src, { sizes: "5rem", widths: [160, 240] }), alt: "", loading: "lazy", decoding: "async", class: "size-full object-cover" }),
      ),
    ),
  );

  return div({ class: layout === "side" ? "flex flex-col gap-3 md:flex-row md:items-start" : "space-y-3" }, slider, thumbnails);
}
