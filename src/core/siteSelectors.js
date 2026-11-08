export const getEnabledSections = (site) => site.layout.sections.filter((section) => section.enabled);

export const getVisibleProducts = (site) => site.products.filter((product) => product.active !== false);

export const getCategoryName = (site, categoryId) =>
  site.categories.find((category) => category.id === categoryId)?.name ?? "";

export const getNavLinks = (site) =>
  getEnabledSections(site)
    .filter((section) => section.props.navLabel)
    .map((section) => ({ href: `#${section.id}`, label: section.props.navLabel }));

export const getMenuHref = (site) => {
  const menu = getEnabledSections(site).find((section) => section.type === "menu");
  return menu ? `#${menu.id}` : "#contacto";
};

/** Props de la primera sección activa de un tipo, o null. Las plantillas alternativas reutilizan sus textos. */
export const getSectionProps = (site, type) => getEnabledSections(site).find((section) => section.type === type)?.props ?? null;

export const getProductsByCategory = (site, products = getVisibleProducts(site)) =>
  site.categories
    .map((category) => ({ category, products: products.filter((product) => product.categoryId === category.id) }))
    .filter((group) => group.products.length);

// «Favoritos» funciona como una categoría más en los filtros. Su nombre se edita en Secciones → Destacados.
export const FAVORITES_CATEGORY = "__favoritos";
const DEFAULT_FAVORITES_LABEL = "Favoritos";

/** Nombre de la categoría de favoritos, o "" si está apagada o no hay favoritos. */
export function getFavoritesLabel(site, products = getVisibleProducts(site)) {
  const featured = site.layout.sections.find((section) => section.type === "featured");
  if (!featured || !products.some((product) => product.featured)) return "";
  return (featured.props.categoryLabel ?? DEFAULT_FAVORITES_LABEL).trim();
}

/** ¿El producto pertenece a la categoría? Entiende la categoría especial de favoritos. */
export const isInCategory = (product, categoryId) =>
  categoryId === FAVORITES_CATEGORY ? Boolean(product.featured) : product.categoryId === categoryId;
