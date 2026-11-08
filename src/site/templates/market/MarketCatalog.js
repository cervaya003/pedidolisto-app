import van from "vanjs-core";
import Icon from "../../../ui/Icon.js";
import { whatsappLink } from "../../../core/format.js";
import { FAVORITES_CATEGORY, getCategoryName, getFavoritesLabel, getProductsByCategory } from "../../../core/siteSelectors.js";
import MarketCard from "./MarketCard.js";
import { activeCategory, ALL_CATEGORIES, filterProducts, query, resetFilters, RESULTS_ID, SORT_OPTIONS, sortBy } from "./marketStore.js";
import { PANEL_CLASS, RADIUS_SM } from "./ui.js";

const { section, aside, div, h2, h3, p, ul, li, button, label, select, option, span, a } = van.tags;

const countLabel = (count) => `${count} ${count === 1 ? "resultado" : "resultados"}`;

function FilterOption(id, name, count) {
  return li(
    button(
      {
        type: "button",
        "aria-pressed": () => String(activeCategory.val === id),
        onclick: () => (activeCategory.val = id),
        class: () =>
          `flex w-full items-center justify-between gap-2 py-1.5 text-left text-sm transition-colors ${
            activeCategory.val === id ? "font-semibold text-accent" : "text-foreground/75 hover:text-foreground"
          }`,
      },
      name,
      span({ class: "text-xs text-muted tabular-nums" }, count),
    ),
  );
}

function Sidebar(site, products, groups, favoritesLabel) {
  const orderHref = whatsappLink(site.business);
  const { hours, address } = site.business;

  return aside(
    { "data-reveal": "", class: "hidden space-y-3 lg:block", "aria-label": "Filtros" },
    div(
      { class: `${PANEL_CLASS} p-4` },
      h3({ class: "mb-2 text-sm font-semibold text-foreground" }, "Categorías"),
      ul(
        FilterOption(ALL_CATEGORIES, "Todo", products.length),
        favoritesLabel ? FilterOption(FAVORITES_CATEGORY, `★ ${favoritesLabel}`, products.filter((product) => product.featured).length) : null,
        groups.map((group) => FilterOption(group.category.id, group.category.name, group.products.length)),
      ),
    ),
    hours || address || orderHref
      ? div(
          { class: `${PANEL_CLASS} space-y-3 p-4 text-sm text-foreground/75` },
          h3({ class: "text-sm font-semibold text-foreground" }, "Información"),
          hours ? p({ class: "flex gap-2" }, Icon("clock", "size-4 shrink-0 text-accent"), hours) : null,
          address ? p({ class: "flex gap-2" }, Icon("pin", "size-4 shrink-0 text-accent"), address) : null,
          orderHref
            ? a({ href: orderHref, target: "_blank", rel: "noopener", class: "flex gap-2 font-medium text-accent hover:underline" }, Icon("chat", "size-4 shrink-0"), "Escríbenos por WhatsApp")
            : null,
        )
      : null,
  );
}

const MobileChips = (products, groups, favoritesLabel) =>
  div(
    { class: "no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:hidden", "aria-label": "Filtrar por categoría" },
    [
      { id: ALL_CATEGORIES, name: "Todo" },
      ...(favoritesLabel ? [{ id: FAVORITES_CATEGORY, name: `★ ${favoritesLabel}` }] : []),
      ...groups.map((group) => group.category),
    ].map((category) =>
      button(
        {
          type: "button",
          onclick: () => (activeCategory.val = category.id),
          class: () =>
            `shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
              activeCategory.val === category.id ? "border-accent bg-accent/10 font-semibold text-accent" : "border-foreground/15 bg-background text-foreground/75"
            }`,
        },
        category.name,
      ),
    ),
  );

const SortSelect = () =>
  label(
    { class: "flex shrink-0 items-center gap-2 text-sm text-muted" },
    span({ class: "hidden sm:inline" }, "Ordenar por"),
    select(
      {
        class: `${RADIUS_SM} border border-foreground/15 bg-background py-1.5 pr-8 pl-3 text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-accent`,
        onchange: (event) => (sortBy.val = event.target.value),
      },
      Object.entries(SORT_OPTIONS).map(([value, text]) => option({ value, selected: sortBy.rawVal === value }, text)),
    ),
  );

const EmptyState = () =>
  div(
    { class: `${PANEL_CLASS} px-6 py-16 text-center` },
    div({ class: "mx-auto grid size-14 place-items-center rounded-full bg-surface text-muted" }, Icon("search", "size-6")),
    h3({ class: "mt-4 text-lg font-semibold text-foreground" }, "No encontramos productos"),
    p({ class: "mt-1 text-sm text-muted" }, "Revisa la ortografía o usa palabras más generales."),
    button({ type: "button", onclick: resetFilters, class: "btn-primary mt-6" }, "Ver todos los productos"),
  );

/** Catálogo completo: filtros a la izquierda, resultados con orden a la derecha. */
export default function MarketCatalog(site, products) {
  const groups = getProductsByCategory(site, products);
  const favoritesLabel = getFavoritesLabel(site, products);
  const categoryName = (id) => (id === FAVORITES_CATEGORY ? favoritesLabel : getCategoryName(site, id));

  return section(
    { id: RESULTS_ID, class: "grid scroll-mt-32 items-start gap-4 lg:grid-cols-[15rem_1fr]" },
    Sidebar(site, products, groups, favoritesLabel),
    div(
      { class: "min-w-0 space-y-3" },
      div(
        { class: "flex items-end justify-between gap-4" },
        () => {
          const results = filterProducts(products, categoryName);
          const title = activeCategory.val === ALL_CATEGORIES ? "Todos los productos" : categoryName(activeCategory.val);
          return div(
            { class: "min-w-0" },
            h2({ class: "truncate text-xl font-semibold text-foreground sm:text-2xl" }, query.val.trim() ? `«${query.val.trim()}»` : title),
            p({ class: "text-sm text-muted" }, countLabel(results.length)),
          );
        },
        SortSelect(),
      ),
      MobileChips(products, groups, favoritesLabel),
      () => {
        const results = filterProducts(products, categoryName);
        if (!results.length) return EmptyState();
        // Cada tarjeta aparece por separado; al buscar o filtrar, los resultados nuevos entran escalonados.
        return ul(
          { "data-reveal-stagger": "", class: "grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 xl:grid-cols-4" },
          results.map((product) => li(MarketCard(product, site))),
        );
      },
    ),
  );
}
