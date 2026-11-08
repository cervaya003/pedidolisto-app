import van from "vanjs-core";
import { getCategoryName } from "../../core/siteSelectors.js";
import { CloseButton, ProductDetail, ProductDialog } from "../product/ProductDetail.js";
import { closeProduct, openProduct, selectedProduct } from "../uiStore.js";

const { div, p } = van.tags;

/** Ficha de producto de la plantilla Clásica (la ficha compartida). Se crea una sola vez. */
export default function ProductModal() {
  return ProductDialog({
    productId: () => selectedProduct.val?.id ?? null,
    close: closeProduct,
    render: (site, product) =>
      ProductDetail(site, product, {
        header: div(
          { class: "flex items-center justify-between gap-4" },
          p({ class: "truncate text-xs font-semibold tracking-[0.2em] text-accent uppercase" }, getCategoryName(site, product.categoryId)),
          CloseButton(closeProduct),
        ),
        onAdded: closeProduct,
        onSelectProduct: openProduct,
        variant: "classic",
      }),
  });
}
