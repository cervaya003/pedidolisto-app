import van from "vanjs-core";
import { FAVORITES_CATEGORY, isInCategory } from "../../core/siteSelectors.js";

const { div, button, span } = van.tags;

export const ALL_CATEGORIES = "all";

export default function CategoryFilter({ categories, products, activeCategory, favoritesLabel = "" }) {
  const options = [
    { id: ALL_CATEGORIES, name: "Todos" },
    ...(favoritesLabel ? [{ id: FAVORITES_CATEGORY, name: `★ ${favoritesLabel}` }] : []),
    ...categories,
  ];
  const countFor = (id) => (id === ALL_CATEGORIES ? products.length : products.filter((product) => isInCategory(product, id)).length);

  return div(
    { class: "no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 sm:-mx-8 sm:px-8", "aria-label": "Filtrar por categoría" },
    options
      .filter((option) => countFor(option.id) > 0)
      .map((option) => {
        const isActive = () => activeCategory.val === option.id;

        return button(
          {
            type: "button",
            "aria-pressed": () => String(isActive()),
            onclick: () => (activeCategory.val = option.id),
            class: () =>
              `inline-flex shrink-0 items-center gap-2 rounded-button border px-4 py-2 text-sm font-medium transition-colors ${
                isActive()
                  ? "border-primary bg-primary text-on-primary"
                  : "border-foreground/15 bg-background text-foreground/75 hover:border-foreground/40 hover:text-foreground"
              }`,
          },
          option.name,
          span({ class: "text-xs tabular-nums opacity-60" }, countFor(option.id)),
        );
      }),
  );
}
