import van from "vanjs-core";
import FeaturedCard from "../components/FeaturedCard.js";
import SectionHeading from "../components/SectionHeading.js";
import Icon from "../../ui/Icon.js";
import { getVisibleProducts } from "../../core/siteSelectors.js";

const { section, div, ul, li, button } = van.tags;

const ScrollButton = (icon, label, onclick) =>
  button(
    {
      type: "button",
      "aria-label": label,
      onclick,
      class:
        "grid size-12 place-items-center rounded-full border border-foreground/15 text-foreground transition hover:border-primary hover:bg-primary hover:text-on-primary",
    },
    Icon(icon),
  );

export default function FeaturedSection({ section: config, site }) {
  const featured = getVisibleProducts(site).filter((product) => product.featured);
  if (!featured.length) return null;

  // Las tarjetas aparecen escalonadas al llegar, y también al deslizarlas hacia la vista.
  const track = ul(
    {
      "data-reveal-stagger": "",
      class:
        "no-scrollbar -mx-5 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 pb-2 sm:-mx-8 sm:scroll-px-8 sm:gap-6 sm:px-8",
    },
    featured.map((product) => li({ class: "w-[78%] shrink-0 snap-start sm:w-[44%] lg:w-[31%]" }, FeaturedCard(product, site))),
  );
  const scroll = (direction) => track.scrollBy({ left: direction * track.clientWidth * 0.8, behavior: "smooth" });

  return section(
    { id: config.id, class: "py-16 sm:py-24" },
    div(
      { class: "mx-auto max-w-7xl px-5 sm:px-8" },
      div(
        { class: "mb-10 flex items-end justify-between gap-6" },
        SectionHeading(config.props),
        div(
          { class: "hidden shrink-0 gap-2 sm:flex" },
          ScrollButton("chevronLeft", "Anterior", () => scroll(-1)),
          ScrollButton("chevronRight", "Siguiente", () => scroll(1)),
        ),
      ),
      track,
    ),
  );
}
