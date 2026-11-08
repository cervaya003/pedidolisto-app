// Confirmación después de enviar: folio, resumen y qué sigue. Da certeza de que el pedido llegó.
import van from "vanjs-core";
import Icon from "../../ui/Icon.js";
import { formatPrice } from "../../core/format.js";
import { closeCart } from "../cart/cartStore.js";
import DrawerHeader from "../cart/DrawerHeader.js";
import { receipt, savedCustomer } from "./checkoutStore.js";
import { openOrders } from "../orders/orderHistory.js";

const { div, h2, p, dl, dt, dd, ol, li, span, button } = van.tags;

const RADIUS = "rounded-[min(var(--site-radius),0.75rem)]";

const Row = (label, value) =>
  div({ class: "flex justify-between gap-4 py-2.5" }, dt({ class: "shrink-0 text-muted" }, label), dd({ class: "text-right font-medium text-foreground" }, value));

const NEXT_STEPS = [
  "Revisamos tu pedido y la disponibilidad.",
  "Te contactamos para confirmar el total y la entrega.",
  "Recibes tu pedido donde elegiste.",
];

export default function OrderSuccess(site) {
  const order = receipt.val;
  if (!order) {
    return div({ class: "flex h-full flex-col" }, DrawerHeader("Pedido enviado"), div({ class: "p-8 text-center text-muted" }, "Tu pedido fue enviado."));
  }

  return div(
    { class: "flex h-full flex-col" },
    DrawerHeader("Pedido enviado"),
    div(
      { class: "flex-1 overflow-y-auto px-6 py-8" },
      div(
        { class: "text-center" },
        div({ class: "mx-auto grid size-20 animate-badge-pop place-items-center rounded-full bg-accent/10 text-accent" }, Icon("check", "size-10")),
        h2({ class: "mt-5 font-heading text-2xl font-medium text-balance text-foreground" }, `¡Gracias, ${order.name}! Recibimos tu pedido`),
        p({ class: "mt-4 text-xs font-semibold tracking-[0.18em] text-muted uppercase" }, "Folio"),
        p({ class: "font-heading text-4xl font-medium tracking-tight text-foreground tabular-nums" }, order.folio),
        p({ class: "mx-auto mt-3 max-w-xs text-sm text-foreground/75" }, "Te contactaremos al ", span({ class: "font-semibold text-foreground" }, order.phone), " para confirmarlo."),
      ),
      dl(
        { class: `mt-7 divide-y divide-foreground/10 ${RADIUS} border border-foreground/10 px-4 text-sm` },
        order.date ? Row("Para el", order.date) : null,
        Row("Entrega", order.delivery),
        Row("Productos", String(order.itemCount)),
        Row(order.approximate ? "Total aproximado" : "Total", formatPrice(site.business, order.total)),
      ),
      div(
        { class: "mt-7" },
        p({ class: "text-xs font-semibold tracking-[0.16em] text-muted uppercase" }, "¿Qué sigue?"),
        ol(
          { class: "mt-3 space-y-3" },
          NEXT_STEPS.map((text, index) =>
            li(
              { class: "flex items-start gap-3 text-sm text-foreground/80" },
              span({ class: "grid size-6 shrink-0 place-items-center rounded-full bg-surface text-xs font-semibold text-foreground" }, index + 1),
              text,
            ),
          ),
        ),
      ),
      p({ class: "mt-7 text-center text-xs text-muted" }, "Guarda tu folio por si necesitas preguntar por tu pedido."),
    ),
    div(
      { class: "space-y-2 border-t border-foreground/10 p-5" },
      button({ type: "button", onclick: closeCart, class: "btn-primary w-full py-3.5 text-base" }, "Seguir viendo productos"),
      // Solo si hay perfil con correo en este navegador (con él se consultan sus pedidos).
      savedCustomer.val?.email
        ? button(
            {
              type: "button",
              onclick: () => {
                closeCart();
                openOrders();
              },
              class: "btn-secondary w-full py-3",
            },
            Icon("receipt", "size-4"),
            "Ver mis pedidos",
          )
        : null,
    ),
  );
}
