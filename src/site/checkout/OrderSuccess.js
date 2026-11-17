// Confirmación después de enviar: folio, anticipo, entrega, productos y total. Da certeza de que el pedido
// llegó. Una sola acción abajo: con anticipo, «Transferir anticipo» lleva al detalle del pedido en
// «Mis pedidos», donde están los pasos para pagar y subir el comprobante.
import van from "vanjs-core";
import Icon from "../../ui/Icon.js";
import { formatPrice } from "../../core/format.js";
import { imageProps } from "../../core/image.js";
import { closeCart } from "../cart/cartStore.js";
import DrawerHeader from "../cart/DrawerHeader.js";
import { receipt, savedCustomer } from "./checkoutStore.js";
import { openOrders } from "../orders/orderHistory.js";
import { openPayment, paymentNumber } from "../payment/PaymentWidget.js";

const { div, h2, p, dl, dt, dd, ol, ul, li, span, button, img } = van.tags;

const RADIUS = "rounded-[min(var(--site-radius),0.75rem)]";
const RADIUS_SM = "rounded-[min(var(--site-radius),0.5rem)]";

const Row = (label, value) =>
  div({ class: "flex justify-between gap-4 py-2.5" }, dt({ class: "shrink-0 text-muted" }, label), dd({ class: "text-right font-medium text-foreground" }, value));

const NEXT_STEPS = ["Revisamos tu pedido y la disponibilidad.", "Te contactamos para confirmar el total y la entrega.", "Recibes tu pedido donde elegiste."];

/** "martes 10 de noviembre, 1:00 p.m." en la hora del cliente. */
export function formatDue(iso, locale = "es-MX") {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(locale, { weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit" });
}

/** Recuadro del anticipo: monto, plazo y lo que resta. Se usa también en «Mis pedidos». */
export function DepositBanner(business, { deposit, total, depositDueAt }) {
  return div(
    { class: `${RADIUS} border border-accent/30 bg-accent/5 p-4 text-center` },
    p({ class: "text-xs font-semibold tracking-[0.16em] text-accent uppercase" }, "Anticipo para confirmar"),
    p({ class: "mt-1 font-heading text-4xl font-medium tracking-tight text-foreground tabular-nums" }, formatPrice(business, deposit)),
    depositDueAt
      ? p({ class: "mt-1.5 text-sm text-foreground/80" }, "Antes del ", span({ class: "font-semibold text-foreground" }, formatDue(depositDueAt, business.locale)))
      : null,
    p({ class: "mt-2 text-xs text-muted" }, `Resta ${formatPrice(business, total - deposit)} al recibir tu pedido.`),
  );
}

/** Lo que pidió: foto, nombre, cantidad y subtotal. */
function Items(business, items) {
  if (!items?.length) return null;
  return ul(
    { class: "divide-y divide-foreground/10" },
    items.map((item) =>
      li(
        { class: "flex items-center gap-3 py-2.5" },
        div(
          { class: `size-12 shrink-0 overflow-hidden ${RADIUS_SM} bg-surface ring-1 ring-foreground/5` },
          item.imageUrl ? img({ ...imageProps(item.imageUrl, { sizes: "3rem", widths: [160] }), alt: "", class: "size-full object-cover" }) : null,
        ),
        p({ class: "min-w-0 flex-1 text-sm text-foreground" }, span({ class: "font-medium" }, item.name), span({ class: "text-muted" }, ` × ${item.quantity}`)),
        p({ class: "shrink-0 text-sm font-medium text-foreground tabular-nums" }, formatPrice(business, item.subtotal)),
      ),
    ),
  );
}

// Botón grande a todo lo ancho con el color del negocio.
const PRIMARY = `flex w-full items-center justify-center gap-2 ${RADIUS} bg-primary px-5 py-4 text-base font-semibold text-on-primary transition hover:bg-primary/90 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`;

/**
 * Pie con una sola acción. Lleva al detalle del pedido en «Mis pedidos» (pasos para pagar y subir el
 * comprobante). Sin correo guardado no hay «Mis pedidos»: entonces abre la tarjeta para transferir.
 * Para salir está la X de arriba.
 */
function Footer(business, order, hasDeposit) {
  const canSeeOrder = Boolean(savedCustomer.val?.email && order.publicId);
  const canTransfer = Boolean(paymentNumber(business.payment));
  const amount = hasDeposit ? formatPrice(business, order.deposit) : "";

  const goToOrder = () => {
    closeCart();
    openOrders(order.publicId);
  };

  // Con datos para transferir, la acción es «Transferir» (con o sin anticipo): lleva al detalle del pedido.
  const total = formatPrice(business, order.total);
  let action = null;
  if (canTransfer) {
    action = button(
      { type: "button", onclick: canSeeOrder ? goToOrder : () => openPayment({ amount: hasDeposit ? amount : total, folio: order.folio }), class: PRIMARY },
      Icon("card", "size-5"),
      hasDeposit ? "Transferir anticipo" : "Transferir",
      span({ class: "font-normal opacity-85 tabular-nums" }, `· ${hasDeposit ? amount : total}`),
    );
  } else if (canSeeOrder) {
    action = button({ type: "button", onclick: goToOrder, class: PRIMARY }, Icon("receipt", "size-5"), "Ver mi pedido");
  }
  return action ? div({ class: "border-t border-foreground/10 bg-background p-4 sm:p-5" }, action) : null;
}

export default function OrderSuccess(site) {
  const order = receipt.val;
  if (!order) {
    return div({ class: "flex h-full flex-col" }, DrawerHeader("Pedido enviado"), div({ class: "p-8 text-center text-muted" }, "Tu pedido fue enviado."));
  }

  const { business } = site;
  const hasDeposit = order.deposit > 0;

  return div(
    { class: "flex h-full flex-col" },
    DrawerHeader(hasDeposit ? "Pedido apartado" : "Pedido enviado"),
    div(
      { class: "flex-1 overflow-y-auto overscroll-contain px-6 py-8" },
      div(
        { class: "text-center" },
        div(
          { class: "mx-auto grid size-20 animate-badge-pop place-items-center rounded-full bg-accent/10 text-accent" },
          Icon(hasDeposit ? "clock" : "check", "size-10"),
        ),
        h2(
          { class: "mt-5 font-heading text-2xl font-medium text-balance text-foreground" },
          hasDeposit ? `¡Gracias, ${order.name}! Tu pedido está apartado` : `¡Gracias, ${order.name}! Recibimos tu pedido`,
        ),
        p({ class: "mt-4 text-xs font-semibold tracking-[0.18em] text-muted uppercase" }, "Folio"),
        p({ class: "font-heading text-4xl font-medium tracking-tight text-foreground tabular-nums" }, order.folio),
        p(
          { class: "mx-auto mt-3 max-w-xs text-sm text-foreground/75" },
          hasDeposit
            ? "Para confirmarlo, transfiere tu anticipo antes de que venza el plazo."
            : ["Te contactaremos al ", span({ class: "font-semibold text-foreground" }, order.phone), " para confirmarlo."],
        ),
      ),
      hasDeposit ? div({ class: "mt-7" }, DepositBanner(business, order)) : null,
      div(
        { class: `mt-7 ${RADIUS} border border-foreground/10 px-4 text-sm` },
        Items(business, order.items),
        dl(
          { class: `divide-y divide-foreground/10 ${order.items?.length ? "border-t border-foreground/10" : ""}` },
          order.date ? Row("Para el", order.date) : null,
          Row("Entrega", order.delivery),
          order.items?.length ? null : Row("Productos", String(order.itemCount)),
          Row(order.approximate ? "Total aproximado" : "Total", formatPrice(business, order.total)),
        ),
      ),
      // Sin anticipo no hay que pagar ahora: solo se explica qué sigue.
      hasDeposit
        ? null
        : div(
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
    Footer(business, order, hasDeposit),
  );
}
