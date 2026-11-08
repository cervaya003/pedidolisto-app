// Estado de la plantilla «Tienda»: búsqueda, filtros y producto abierto. El carrito es compartido (site/cart).
// Vive a nivel de módulo para sobrevivir a los re-renderizados de la vista previa.
import van from "vanjs-core";
import { isInCategory } from "../../../core/siteSelectors.js";

export const RESULTS_ID = "productos";
export const ALL_CATEGORIES = "all";
export const SORT_OPTIONS = {
  relevance: "Más relevantes",
  priceAsc: "Menor precio",
  priceDesc: "Mayor precio",
  name: "Nombre (A-Z)",
};

const SORTERS = {
  priceAsc: (a, b) => a.price - b.price,
  priceDesc: (a, b) => b.price - a.price,
  name: (a, b) => a.name.localeCompare(b.name, "es"),
};

export const query = van.state("");
export const activeCategory = van.state(ALL_CATEGORIES);
export const sortBy = van.state("relevance");
export const viewedProductId = van.state(null);

export const openProduct = (id) => (viewedProductId.val = id);
export const closeProduct = () => (viewedProductId.val = null);

export const resetFilters = () => {
  query.val = "";
  activeCategory.val = ALL_CATEGORIES;
  sortBy.val = "relevance";
};

export const scrollToResults = () => document.getElementById(RESULTS_ID)?.scrollIntoView({ behavior: "smooth" });

const normalize = (value) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

/** Aplica búsqueda, categoría y orden. Lee los estados, así que se re-evalúa cuando cambian. */
export function filterProducts(products, categoryName) {
  const term = normalize(query.val);
  const category = activeCategory.val;

  const result = products.filter(
    (product) =>
      (category === ALL_CATEGORIES || isInCategory(product, category)) &&
      (!term || normalize(`${product.name} ${product.description} ${product.badge} ${categoryName(product.categoryId)}`).includes(term)),
  );
  const sorter = SORTERS[sortBy.val];
  return sorter ? [...result].sort(sorter) : result;
}
