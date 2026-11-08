import van from "vanjs-core";
import { confirmDelete } from "../components/ConfirmDialog.js";
import FavoriteChip from "../components/FavoriteChip.js";
import ListActions from "../components/ListActions.js";
import ProductCustomization from "../components/ProductCustomization.js";
import SchemaForm from "../components/SchemaForm.js";
import { PanelHeader } from "../components/Panel.js";
import Icon from "../../ui/Icon.js";
import { formatPrice } from "../../core/format.js";
import { moveItem } from "../../core/objectPath.js";
import { adminStore } from "../adminStore.js";
import { createProduct } from "../factories.js";
import { getProductFields } from "../schemas.js";

const { div, button, img, span, p } = van.tags;

export default function ProductsPanel() {
  const selectedId = van.state(null);
  const version = van.state(0);
  const products = () => adminStore.get("products");
  const commit = (next) => {
    adminStore.set("products", next);
    version.val++;
  };

  function add() {
    const [firstCategory] = adminStore.get("categories");
    if (!firstCategory) return adminStore.notify("Crea una categoría antes de agregar productos.", "error");
    const product = createProduct(firstCategory.id);
    commit([...products(), product]);
    selectedId.val = product.id;
  }

  async function remove(id) {
    const product = products().find((item) => item.id === id);
    const confirmed = await confirmDelete({
      title: "¿Eliminar este producto?",
      message: `Se eliminará «${product?.name || "Producto sin nombre"}» con sus fotos y opciones.`,
      confirmLabel: "Eliminar producto",
    });
    if (!confirmed) return;
    commit(products().filter((item) => item.id !== id));
    selectedId.val = null;
  }

  const ProductRow = (product, index, list) =>
    div(
      { class: `flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-2 ${product.active ? "" : "opacity-50"}` },
      button(
        { type: "button", class: "flex min-w-0 flex-1 items-center gap-3 text-left", onclick: () => (selectedId.val = product.id) },
        div(
          { class: "grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-zinc-100 text-zinc-300" },
          product.imageUrl ? img({ src: `${product.imageUrl}${product.imageUrl.includes("unsplash") ? "?w=120&q=60" : ""}`, alt: "", class: "size-full object-cover" }) : Icon("image"),
        ),
        span(
          { class: "min-w-0" },
          span({ class: "block truncate text-sm font-medium text-zinc-900" }, product.name),
          span({ class: "block text-xs text-zinc-500" }, formatPrice(adminStore.get("business"), product.price, product.priceFrom), product.featured ? " · ★ Favorito" : "", product.customizable ? " · Personalizable" : ""),
        ),
      ),
      ListActions({
        onUp: index > 0 ? () => commit(moveItem(products(), index, index - 1)) : null,
        onDown: index < list.length - 1 ? () => commit(moveItem(products(), index, index + 1)) : null,
      }),
    );

  const ProductList = () =>
    div(
      PanelHeader("Productos", "Toca un producto para editarlo. El orden aquí es el orden del menú.", button({ type: "button", class: "btn-primary shrink-0", onclick: add }, Icon("plus", "size-4"), "Nuevo")),
      () => {
        version.val;
        const list = products();
        return list.length
          ? div({ class: "space-y-2" }, list.map((product, index) => ProductRow(product, index, list)))
          : p({ class: "rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500" }, "Aún no hay productos.");
      },
    );

  const ProductEditor = (index) =>
    div(
      button({ type: "button", class: "mb-5 inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900", onclick: () => (selectedId.val = null) }, Icon("arrowLeft", "size-4"), "Todos los productos"),
      FavoriteChip(index),
      SchemaForm(getProductFields(adminStore.get("categories"), adminStore.get("theme.template")), `products.${index}`),
      ProductCustomization(index),
      button({ type: "button", class: "btn-secondary mt-8 w-full text-red-600 hover:border-red-300 hover:text-red-700", onclick: () => remove(selectedId.rawVal) }, Icon("trash", "size-4"), "Eliminar producto"),
    );

  return div(() => {
    version.val;
    adminStore.formVersion.val;
    const index = products().findIndex((product) => product.id === selectedId.val);
    return index >= 0 ? ProductEditor(index) : ProductList();
  });
}
