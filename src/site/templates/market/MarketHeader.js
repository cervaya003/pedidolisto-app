import van from "vanjs-core";
import Icon from "../../../ui/Icon.js";
import { whatsappLink } from "../../../core/format.js";
import { FAVORITES_CATEGORY, getFavoritesLabel, getProductsByCategory } from "../../../core/siteSelectors.js";
import { CartIconButton } from "../../cart/CartControls.js";
import { OrdersButton } from "../../orders/MyOrders.js";
import { activeCategory, ALL_CATEGORIES, query, resetFilters, scrollToResults } from "./marketStore.js";
import { RADIUS_SM } from "./ui.js";
import { isScrolled } from "../../motion/scroll.js";

const { header, div, a, img, form, label, input, button, nav, span } = van.tags;

const MarketBrand = (business) =>
  a(
    { href: "#", onclick: resetFilters, class: "inline-flex shrink-0 items-center gap-2.5 font-heading text-xl font-bold tracking-tight text-on-primary sm:text-2xl" },
    business.logoUrl ? img({ src: business.logoUrl, alt: "", class: "h-9 w-auto object-contain" }) : null,
    span(business.name),
  );

function SearchBox(business) {
  return form(
    {
      role: "search",
      class: "relative order-last w-full md:order-none md:w-auto md:flex-1",
      onsubmit: (event) => {
        event.preventDefault();
        scrollToResults();
      },
    },
    label({ for: "market-search", class: "sr-only" }, "Buscar productos"),
    input({
      id: "market-search",
      type: "search",
      autocomplete: "off",
      value: query.rawVal, // rawVal: no redibujar la página con cada letra
      placeholder: `Buscar en ${business.name}…`,
      oninput: (event) => (query.val = event.target.value),
      class: `h-11 w-full ${RADIUS_SM} bg-background pr-12 pl-4 text-sm text-foreground shadow-sm outline-none transition-shadow duration-300 placeholder:text-muted focus:shadow-lg focus:ring-2 focus:ring-accent`,
    }),
    button(
      {
        type: "submit",
        "aria-label": "Buscar",
        class: "absolute inset-y-1.5 right-0 grid w-11 place-items-center border-l border-foreground/10 text-muted transition hover:text-foreground",
      },
      Icon("search", "size-5"),
    ),
  );
}

function CategoryLink(id, name) {
  return button(
    {
      type: "button",
      onclick: () => {
        activeCategory.val = id;
        scrollToResults();
      },
      "aria-current": () => String(activeCategory.val === id),
      // Subrayado pegado al borde inferior de la barra (la fila recorta lo que se sale).
      class: () =>
        `nav-link shrink-0 py-2.5 text-sm transition-colors duration-300 [--nav-underline-offset:0px] ${
          activeCategory.val === id ? "font-semibold text-on-primary" : "text-on-primary/75 hover:text-on-primary"
        }`,
    },
    name,
  );
}

/**
 * Barra superior de la tienda: marca, buscador, carrito y accesos a categorías.
 * Movimiento: entra deslizándose; al bajar se recoge la fila del buscador y quedan fijas solo las
 * categorías (lo útil mientras se compra); al subir regresa completa. Solo usa `translate`:
 * el encabezado no cambia de alto, así el contenido nunca salta.
 */
export default function MarketHeader(site, products) {
  const { business } = site;
  const orderHref = whatsappLink(business);
  const categories = getProductsByCategory(site, products).map((group) => group.category);
  const favoritesLabel = getFavoritesLabel(site, products);
  const hasCategoryRow = categories.length > 1;

  const topRow = div(
    { class: "mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6" },
    MarketBrand(business),
    SearchBox(business),
    div(
      { class: "ml-auto flex items-center gap-1 md:ml-0" },
      orderHref
        ? a(
            {
              href: orderHref,
              target: "_blank",
              rel: "noopener",
              class: "hidden items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-on-primary/85 transition hover:bg-on-primary/10 hover:text-on-primary lg:inline-flex",
            },
            Icon("chat", "size-4"),
            "Ayuda",
          )
        : null,
      OrdersButton("size-11 hover:bg-on-primary/10"),
      CartIconButton(products, "size-11 hover:bg-on-primary/10", "ring-primary"),
    ),
  );

  const element = header(
    {
      class: () =>
        `sticky top-0 z-40 animate-header-in bg-primary text-on-primary transition-shadow duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isScrolled.val ? "shadow-[0_10px_30px_-12px_rgb(0_0_0/0.45)]" : "shadow-md"
        }`,
    },
    topRow,
    hasCategoryRow
      ? nav(
          { class: "border-t border-on-primary/10", "aria-label": "Categorías" },
          div(
            { class: "no-scrollbar mx-auto flex max-w-7xl items-center gap-6 overflow-x-auto px-4 sm:px-6" },
            CategoryLink(ALL_CATEGORIES, "Todo"),
            favoritesLabel ? CategoryLink(FAVORITES_CATEGORY, `★ ${favoritesLabel}`) : null,
            categories.map((category) => CategoryLink(category.id, category.name)),
            business.hours
              ? span({ class: "ml-auto hidden shrink-0 items-center gap-1.5 text-xs text-on-primary/70 lg:inline-flex" }, Icon("clock", "size-3.5"), business.hours)
              : null,
          ),
        )
      : null,
  );

  return element;
}
