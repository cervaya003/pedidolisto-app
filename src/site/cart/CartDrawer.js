import van from "vanjs-core";
import Icon from "../../ui/Icon.js";
import { formatPrice } from "../../core/format.js";
import { imageProps } from "../../core/image.js";
import { getVisibleProducts } from "../../core/siteSelectors.js";
import { siteStore } from "../../core/siteStore.js";
import { DRAWER_CLASS, syncDialog } from "../templates/dialog.js";
import CheckoutView from "../checkout/CheckoutView.js";
import OrderSuccess from "../checkout/OrderSuccess.js";
import CartCheckout from "./CartCheckout.js";
import { cartView, closeCart, getCartCount, getCartLines, isCartOpen, lineDetails, setLineQuantity } from "./cartStore.js";
import { QuantityStepper } from "./CartControls.js";
import { confirmAction } from "../components/ConfirmDialog.js";
import DrawerHeader from "./DrawerHeader.js";

const { dialog, div, p, button, ul, li, img, span } = van.tags;

// Quitar un producto (con el bote o bajando la cantidad a 0) siempre se confirma.
async function removeLine(line) {
  const details = lineDetails(line);
  const confirmed = await confirmAction({
    title: "¿Quitar este producto?",
    message: `Se quitará «${line.product.name}»${details.length ? ` (${details.join(" · ")})` : ""} de tu carrito.`,
    confirmLabel: "Sí, quitar",
    cancelLabel: "No, conservarlo",
  });
  if (confirmed) setLineQuantity(line.key, 0);
}

function CartLine(line, business) {
  const { product, quantity } = line;
  return li(
    { class: "flex gap-3 py-4" },
    div(
      { class: "size-16 shrink-0 overflow-hidden rounded-[min(var(--site-radius),0.75rem)] bg-surface" },
      product.imageUrl ? img({ ...imageProps(product.imageUrl, { sizes: "4rem", widths: [160] }), alt: "", class: "size-full object-cover" }) : null,
    ),
    div(
      { class: "min-w-0 flex-1" },
      p({ class: "line-clamp-2 text-sm font-medium text-foreground" }, product.name),
      lineDetails(line).length
        ? ul({ class: "mt-1 space-y-0.5 text-xs text-foreground/70" }, lineDetails(line).map((detail) => li({ class: "line-clamp-2" }, detail)))
        : null,
      p({ class: "mt-0.5 text-xs text-muted" }, `${formatPrice(business, line.unitPrice, product.priceFrom)} c/u`),
      div({ class: "mt-2" }, QuantityStepper({ value: () => quantity, onChange: (value) => (value <= 0 ? removeLine(line) : setLineQuantity(line.key, value)) })),
    ),
    div(
      { class: "flex flex-col items-end justify-between" },
      span({ class: "text-sm font-semibold text-foreground tabular-nums" }, formatPrice(business, line.unitPrice * quantity)),
      button(
        {
          type: "button",
          "aria-label": `Quitar ${product.name}`,
          onclick: () => removeLine(line),
          class: "grid size-8 place-items-center rounded-full text-muted transition hover:bg-foreground/5 hover:text-foreground",
        },
        Icon("trash", "size-4"),
      ),
    ),
  );
}

const EmptyCart = () =>
  div(
    { class: "flex flex-1 flex-col items-center justify-center px-8 text-center" },
    div({ class: "grid size-16 place-items-center rounded-full bg-surface text-muted" }, Icon("cart", "size-7")),
    p({ class: "mt-4 font-semibold text-foreground" }, "Tu carrito está vacío"),
    p({ class: "mt-1 text-sm text-muted" }, "Agrega productos y haz todo en un solo pedido."),
    button({ type: "button", onclick: closeCart, class: "btn-primary mt-6" }, "Ver productos"),
  );

/** Panel lateral del carrito, el mismo para todas las plantillas. Se crea una sola vez. */
/** Tres vistas: productos → datos del pedido → pedido enviado. */
export default function CartDrawer() {
  const element = dialog({ "aria-label": "Carrito", class: DRAWER_CLASS }, () => {
    const site = siteStore.site.val;
    if (!site) return div();
    const lines = getCartLines(getVisibleProducts(site));
    const view = cartView.val;

    if (view === "done") return OrderSuccess(site);
    if (!lines.length) return div({ class: "flex h-full flex-col" }, DrawerHeader("Tu carrito"), EmptyCart());
    if (view === "checkout") return CheckoutView(site, lines);

    return div(
      { class: "flex h-full flex-col" },
      DrawerHeader(["Tu carrito", span({ class: "ml-2 text-sm font-normal text-muted" }, `(${getCartCount(lines)})`)]),
      ul({ class: "flex-1 divide-y divide-foreground/10 overflow-y-auto px-5" }, lines.map((line) => CartLine(line, site.business))),
      CartCheckout(site.business, lines),
    );
  });

  return syncDialog(element, () => isCartOpen.val, closeCart);
}
