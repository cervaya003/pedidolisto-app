import van from "vanjs-core";
import Icon from "../../../ui/Icon.js";
import { imageProps } from "../../../core/image.js";
import { getSectionProps } from "../../../core/siteSelectors.js";
import { scrollToResults } from "./marketStore.js";
import { PANEL_CLASS, RADIUS } from "./ui.js";

const { section, div, p, h1, em, button, img, ol, li, span, h3 } = van.tags;

// Clases completas: Tailwind necesita verlas escritas para generarlas.
const BENEFIT_COLUMNS = { 1: "", 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-4" };

// Reutiliza los textos de la Portada y de los Pasos: se editan desde la pestaña «Secciones».
// Si una de las dos está oculta, su parte no se dibuja.
function Hero(site) {
  const hero = getSectionProps(site, "hero");
  if (!hero) return null;
  const title = hero.title || site.business.tagline || site.business.name;

  return div(
    { class: `relative grid overflow-hidden ${RADIUS} bg-inverse text-on-inverse md:grid-cols-[1.1fr_1fr]` },
    div(
      { class: "relative z-10 flex animate-fade-up flex-col justify-center gap-4 p-6 sm:p-10" },
      hero.eyebrow ? p({ class: "text-xs font-bold tracking-[0.2em] text-on-inverse/65 uppercase" }, hero.eyebrow) : null,
      h1(
        { class: "font-heading text-3xl leading-tight font-semibold text-balance sm:text-4xl lg:text-5xl" },
        title,
        hero.highlight && hero.title ? [" ", em({ class: "font-normal text-on-inverse/85" }, hero.highlight)] : null,
      ),
      hero.text ? p({ class: "max-w-md text-sm leading-relaxed text-on-inverse/75 sm:text-base" }, hero.text) : null,
      div(
        button(
          { type: "button", onclick: scrollToResults, class: "btn-inverse mt-2 px-6 py-3" },
          hero.ctaLabel || "Ver productos",
          Icon("arrowRight", "size-4"),
        ),
      ),
    ),
    hero.imageUrl
      ? div(
          { class: "relative min-h-52 md:min-h-80" },
          img({
            ...imageProps(hero.imageUrl, { sizes: "(min-width: 768px) 45vw, 100vw" }),
            alt: "",
            fetchpriority: "high",
            class: "absolute inset-0 size-full animate-image-reveal object-cover",
          }),
          div({ class: "absolute inset-0 bg-linear-to-r from-inverse via-inverse/20 to-transparent max-md:bg-linear-to-t", "aria-hidden": "true" }),
        )
      : null,
  );
}

function Benefits(site) {
  const items = (getSectionProps(site, "steps")?.items ?? []).slice(0, 4);
  if (!items.length) return null;

  return ol(
    { "data-reveal": "", class: `grid divide-foreground/5 ${PANEL_CLASS} ${BENEFIT_COLUMNS[items.length]} max-sm:divide-y sm:divide-x`, "aria-label": "Cómo comprar" },
    items.map((item, index) =>
      li(
        { class: "flex items-start gap-3 p-4" },
        span({ class: "grid size-9 shrink-0 place-items-center rounded-full bg-accent/10 text-sm font-bold text-accent" }, index + 1),
        div(h3({ class: "text-sm font-semibold text-foreground" }, item.title), p({ class: "mt-0.5 line-clamp-2 text-xs text-muted" }, item.text)),
      ),
    ),
  );
}

export default function MarketBanner(site) {
  const parts = [Hero(site), Benefits(site)].filter(Boolean);
  return parts.length ? section({ class: "space-y-3", "aria-label": "Presentación" }, parts) : null;
}
