import van from "vanjs-core";
import Icon from "../../../ui/Icon.js";
import { getCategoryName } from "../../../core/siteSelectors.js";
import { CloseButton, ProductDetail, ProductDialog } from "../../product/ProductDetail.js";
import { activeCategory, closeProduct, openProduct, scrollToResults, viewedProductId } from "./marketStore.js";

const { div, nav, button } = van.tags;

function Breadcrumb(site, product) {
  const goToCategory = () => {
    closeProduct();
    activeCategory.val = product.categoryId;
    scrollToResults();
  };
  return nav(
    { class: "flex min-w-0 items-center gap-1.5 text-xs text-muted", "aria-label": "Ruta" },
    button({ type: "button", onclick: closeProduct, class: "hover:text-accent" }, "Inicio"),
    Icon("chevronRight", "size-3 shrink-0"),
    button({ type: "button", onclick: goToCategory, class: "truncate hover:text-accent" }, getCategoryName(site, product.categoryId)),
  );
}

/** Ficha de producto tipo marketplace: ruta y ficha compartida (con «También te puede gustar»). Se crea una sola vez. */
export default function MarketProductView() {
  return ProductDialog({
    productId: () => viewedProductId.val,
    close: closeProduct,
    render: (site, product) =>
      ProductDetail(site, product, {
        header: div({ class: "flex items-center justify-between gap-4" }, Breadcrumb(site, product), CloseButton(closeProduct)),
        onAdded: closeProduct,
        onSelectProduct: (item) => openProduct(item.id),
        variant: "market",
      }),
  });
}
