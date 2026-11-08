import van from "vanjs-core";
import { confirmDelete } from "../components/ConfirmDialog.js";
import ListActions from "../components/ListActions.js";
import { PanelHeader } from "../components/Panel.js";
import Icon from "../../ui/Icon.js";
import { moveItem } from "../../core/objectPath.js";
import { adminStore } from "../adminStore.js";
import { createCategory } from "../factories.js";

const { div, input, span, button, p } = van.tags;

export default function CategoriesPanel() {
  const version = van.state(0);
  const categories = () => adminStore.get("categories");
  const commit = (next) => {
    adminStore.set("categories", next);
    version.val++;
  };

  const remove = async (category) => {
    const inUse = adminStore.get("products").filter((product) => product.categoryId === category.id).length;
    if (inUse) return adminStore.notify(`«${category.name}» tiene ${inUse} producto(s). Muévelos antes de eliminarla.`, "error");
    const confirmed = await confirmDelete({ title: "¿Eliminar esta categoría?", message: `Se eliminará la categoría «${category.name || "sin nombre"}».` });
    if (confirmed) commit(categories().filter((item) => item.id !== category.id));
  };

  return div(
    PanelHeader(
      "Categorías",
      "Agrupan los productos y forman los filtros del menú.",
      button({ type: "button", class: "btn-primary shrink-0", onclick: () => commit([...categories(), createCategory()]) }, Icon("plus", "size-4"), "Nueva"),
    ),
    () => {
      version.val;
      const list = categories();
      const products = adminStore.get("products");
      if (!list.length) return p({ class: "rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500" }, "Aún no hay categorías.");

      return div(
        { class: "space-y-2" },
        list.map((category, index) =>
          div(
            { class: "flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white p-2 pl-3" },
            input({
              class: "field-input border-transparent shadow-none focus:border-zinc-900",
              value: category.name,
              maxlength: 60,
              "aria-label": "Nombre de la categoría",
              oninput: (event) => adminStore.set(`categories.${index}.name`, event.target.value),
            }),
            span({ class: "shrink-0 text-xs text-zinc-400 tabular-nums" }, products.filter((product) => product.categoryId === category.id).length),
            ListActions({
              onUp: index > 0 ? () => commit(moveItem(categories(), index, index - 1)) : null,
              onDown: index < list.length - 1 ? () => commit(moveItem(categories(), index, index + 1)) : null,
              onRemove: () => remove(category),
            }),
          ),
        ),
      );
    },
  );
}
