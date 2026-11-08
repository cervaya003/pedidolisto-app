import van from "vanjs-core";
import CategoryFilter, { ALL_CATEGORIES } from "../components/CategoryFilter.js";
import ProductGrid from "../components/ProductGrid.js";
import SectionHeading from "../components/SectionHeading.js";
import { getFavoritesLabel, getVisibleProducts, isInCategory } from "../../core/siteSelectors.js";
import { isScrollingDown } from "../motion/scroll.js";

const { section, div, p } = van.tags;

export default function MenuSection({ section: config, site }) {
  const { props } = config;
  const products = getVisibleProducts(site);
  const activeCategory = van.state(ALL_CATEGORIES);

  const filtered = () =>
    activeCategory.val === ALL_CATEGORIES ? products : products.filter((product) => isInCategory(product, activeCategory.val));

  return section(
    { id: config.id, class: "py-16 sm:py-24" },
    div(
      { class: "mx-auto max-w-7xl px-5 sm:px-8" },
      SectionHeading(props),
      props.showFilters && site.categories.length > 1
        ? div(
            {
              // Pegada debajo del encabezado compacto (h-14); cuando el encabezado se esconde, sube al borde.
              class: () =>
                `sticky z-30 -mx-5 mt-10 mb-6 bg-background/90 px-5 py-3 backdrop-blur-md transition-[top] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:-mx-8 sm:px-8 ${
                  isScrollingDown.val ? "top-0" : "top-14"
                }`,
            },
            CategoryFilter({ categories: site.categories, products, activeCategory, favoritesLabel: getFavoritesLabel(site, products) }),
          )
        : div({ class: "h-10" }),
      products.length
        ? () => ProductGrid({ products: filtered(), business: site.business, props })
        : p({ class: "py-16 text-center text-muted" }, "Pronto agregaremos productos."),
    ),
  );
}
