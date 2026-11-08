import van from "vanjs-core";
import Icon from "../../../ui/Icon.js";
import { getSectionProps } from "../../../core/siteSelectors.js";
import MarketCard from "./MarketCard.js";
import { PANEL_CLASS } from "./ui.js";

const { section, div, h2, p, ul, li, button } = van.tags;

const ScrollButton = (icon, label, onclick) =>
  button(
    {
      type: "button",
      "aria-label": label,
      onclick,
      class: "grid size-9 place-items-center rounded-full bg-background text-foreground shadow ring-1 ring-foreground/10 transition hover:text-accent",
    },
    Icon(icon, "size-4"),
  );

/** Franja horizontal con los productos destacados. */
export default function MarketDeals(site, products) {
  // Oculta en «Secciones» o sin favoritos: no se dibuja.
  const props = getSectionProps(site, "featured");
  const featured = products.filter((product) => product.featured);
  if (!props || !featured.length) return null;
  const track = ul(
    { class: "no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1" },
    featured.map((product) => li({ class: "w-40 shrink-0 snap-start sm:w-48" }, MarketCard(product, site, { compact: true }))),
  );
  const scroll = (direction) => track.scrollBy({ left: direction * track.clientWidth * 0.8, behavior: "smooth" });

  return section(
    { "data-reveal": "", class: `${PANEL_CLASS} p-4 sm:p-5`, "aria-labelledby": "market-deals-title" },
    div(
      { class: "mb-4 flex items-end justify-between gap-4" },
      div(
        h2({ id: "market-deals-title", class: "text-lg font-semibold text-foreground sm:text-xl" }, props.title || "Destacados"),
        props.text ? p({ class: "mt-0.5 text-sm text-muted" }, props.text) : null,
      ),
      div({ class: "hidden shrink-0 gap-2 sm:flex" }, ScrollButton("chevronLeft", "Anterior", () => scroll(-1)), ScrollButton("chevronRight", "Siguiente", () => scroll(1))),
    ),
    track,
  );
}
