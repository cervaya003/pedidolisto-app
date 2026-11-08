import BusinessPanel from "./BusinessPanel.js";
import CategoriesPanel from "./CategoriesPanel.js";
import ProductsPanel from "./ProductsPanel.js";
import SectionsPanel from "./SectionsPanel.js";
import ThemePanel from "./ThemePanel.js";

export const PANELS = {
  products: { label: "Productos", icon: "box", render: ProductsPanel },
  categories: { label: "Categorías", icon: "tag", render: CategoriesPanel },
  sections: { label: "Secciones", icon: "layout", render: SectionsPanel },
  theme: { label: "Apariencia", icon: "palette", render: ThemePanel },
  business: { label: "Negocio", icon: "store", render: BusinessPanel },
};
