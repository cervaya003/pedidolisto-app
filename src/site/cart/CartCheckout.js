// Pie del carrito: total y botón para continuar con los datos del pedido.
import van from "vanjs-core";
import Icon from "../../ui/Icon.js";
import { formatPrice } from "../../core/format.js";
import { clearCart, getCartCount, getCartTotal, openCheckout } from "./cartStore.js";
import { confirmAction } from "../components/ConfirmDialog.js";

const { div, span, p, button } = van.tags;

// Vaciar borra productos ya personalizados: siempre se confirma antes.
async function confirmClear(lines) {
  const count = getCartCount(lines);
  const confirmed = await confirmAction({
    title: "¿Vaciar tu carrito?",
    text: `Se quitará${count === 1 ? " tu producto" : `n tus ${count} productos`}, junto con todo lo que personalizaste. Esto no se puede deshacer.`,
    confirmLabel: "Sí, vaciar",
    cancelLabel: "No, conservarlo",
  });
  if (confirmed) clearCart();
}

export default function CartCheckout(business, lines) {
  const hasFromPrices = lines.some((line) => line.product.priceFrom);

  return div(
    { class: "space-y-3 border-t border-foreground/10 bg-surface/60 p-5" },
    div(
      { class: "flex items-baseline justify-between" },
      span({ class: "text-sm text-foreground/75" }, hasFromPrices ? "Total aproximado" : "Total"),
      span({ class: "text-2xl font-semibold text-foreground tabular-nums" }, formatPrice(business, getCartTotal(lines))),
    ),
    hasFromPrices ? p({ class: "text-xs text-muted" }, "Algunos productos tienen precio «desde»: te confirmamos el total al revisar tu pedido.") : null,
    button({ type: "button", onclick: openCheckout, class: "btn-primary w-full py-3.5 text-base" }, "Realizar pedido", Icon("arrowRight", "size-5")),
    button({ type: "button", onclick: () => confirmClear(lines), class: "w-full text-center text-sm text-muted transition hover:text-foreground" }, "Vaciar carrito"),
  );
}
