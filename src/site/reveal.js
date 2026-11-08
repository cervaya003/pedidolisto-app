// Aparición al hacer scroll, en las dos direcciones: un elemento aparece al entrar a la pantalla
// y se oculta al salir, del lado por el que salió (arriba o abajo), para volver a entrar desde ahí.
//
// - `data-reveal` en un elemento lo anima a él.
// - `data-reveal-stagger` en un contenedor anima a cada hijo por separado.
// Lo que entra en el mismo momento se escalona solo (60 ms entre uno y otro).
// El estilo de cada plantilla (distancia, duración, desenfoque) vive en site.css bajo `data-motion`.
//
// Un MutationObserver detecta lo que se dibuja después (filtros, búsqueda, cambio de plantilla),
// así nada se queda oculto aunque se cree más tarde.
import { IS_PREVIEW } from "../core/previewChannel.js";

const STAGGER_MS = 60;
const MAX_STAGGER_STEPS = 6;

const canAnimate =
  !IS_PREVIEW &&
  "IntersectionObserver" in window &&
  "MutationObserver" in window &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function onIntersect(entries) {
  let step = 0;
  for (const entry of entries) {
    const element = entry.target;
    if (entry.isIntersecting) {
      element.style.setProperty("--reveal-delay", `${Math.min(step++, MAX_STAGGER_STEPS) * STAGGER_MS}ms`);
      element.removeAttribute("data-reveal-side");
      element.classList.add("is-revealed");
    } else if (element.classList.contains("is-revealed")) {
      element.style.setProperty("--reveal-delay", "0ms");
      element.setAttribute("data-reveal-side", entry.boundingClientRect.top < 0 ? "above" : "below");
      element.classList.remove("is-revealed");
    }
  }
}

const observer = canAnimate ? new IntersectionObserver(onIntersect, { rootMargin: "0px 0px -8% 0px" }) : null;

function track(node) {
  if (!(node instanceof Element)) return;
  const containers = node.matches("[data-reveal-stagger]") ? [node] : [];
  containers.push(...node.querySelectorAll("[data-reveal-stagger]"));
  for (const container of containers) for (const child of container.children) child.setAttribute("data-reveal", "");

  if (node.matches("[data-reveal]")) observer.observe(node);
  node.querySelectorAll("[data-reveal]").forEach((element) => observer.observe(element));
}

function untrack(node) {
  if (!(node instanceof Element)) return;
  if (node.matches("[data-reveal]")) observer.unobserve(node);
  node.querySelectorAll("[data-reveal]").forEach((element) => observer.unobserve(element));
}

if (observer) {
  // Solo se ocultan los elementos si de verdad podemos mostrarlos después (ver site.css).
  document.documentElement.classList.add("reveal-ready");
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.removedNodes.forEach(untrack);
      mutation.addedNodes.forEach(track);
    }
  }).observe(document.body, { childList: true, subtree: true });
}

/** Revisa la página completa. El MutationObserver ya cubre lo nuevo; esto es para lo que existía antes de cargar. */
export function observeReveals() {
  if (observer) requestAnimationFrame(() => track(document.body));
}
