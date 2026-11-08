import van from "vanjs-core";
import Icon from "../../../ui/Icon.js";
import { getCategoryName, getProductsByCategory } from "../../../core/siteSelectors.js";
import { CloseButton, ProductDetail, ProductDialog } from "../../product/ProductDetail.js";
import { closeProduct, openProduct, openProductId } from "./cartaStore.js";

const { div, p, span, button } = van.tags;

const NavButton = (icon, label, product) =>
  button(
    {
      type: "button",
      "aria-label": label,
      disabled: !product,
      onclick: () => product && openProduct(product.id),
      class: "grid size-9 place-items-center rounded-full text-foreground transition hover:bg-foreground/5 disabled:opacity-25 disabled:hover:bg-transparent",
    },
    Icon(icon, "size-4"),
  );

/** Encabezado editorial: capítulo, posición en la carta y navegación anterior/siguiente. */
function Header(site, product) {
  const ordered = getProductsByCategory(site).flatMap((group) => group.products);
  const position = ordered.findIndex((item) => item.id === product.id);

  return div(
    { class: "flex items-center justify-between gap-4 border-b border-foreground/10 pb-4" },
    p(
      { class: "flex min-w-0 items-baseline gap-3" },
      span({ class: "truncate text-xs font-semibold tracking-[0.3em] text-accent uppercase" }, getCategoryName(site, product.categoryId)),
      span({ class: "shrink-0 font-heading text-sm text-muted italic tabular-nums" }, `${position + 1} de ${ordered.length}`),
    ),
    div(
      { class: "flex shrink-0 items-center gap-1" },
      NavButton("chevronLeft", "Anterior", ordered[position - 1]),
      NavButton("chevronRight", "Siguiente", ordered[position + 1]),
      span({ class: "mx-1 h-5 w-px bg-foreground/10", "aria-hidden": "true" }),
      CloseButton(closeProduct),
    ),
  );
}

/** Ficha de producto de la Carta (la ficha compartida con encabezado propio). Se crea una sola vez. */
export default function CartaDrawer() {
  return ProductDialog({
    productId: () => openProductId.val,
    close: closeProduct,
    render: (site, product) =>
      ProductDetail(site, product, { header: Header(site, product), onAdded: closeProduct, onSelectProduct: (item) => openProduct(item.id), variant: "carta" }),
  });
}
