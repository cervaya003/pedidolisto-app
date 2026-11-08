// «Mis pedidos»: modal con los pedidos del cliente, igual en las tres plantillas.
// Se consultan en el API con el correo y teléfono que guardó en este navegador.
// En computadora es una ventana centrada; en celular sube desde abajo como hoja.
import van from "vanjs-core";
import Icon from "../../ui/Icon.js";
import { formatPrice, whatsappLink } from "../../core/format.js";
import { getVisibleProducts } from "../../core/siteSelectors.js";
import { siteStore } from "../../core/siteStore.js";
import { savedCustomer } from "../checkout/checkoutStore.js";
import { formatLongDate } from "../checkout/DatePicker.js";
import { describeChoices } from "../product/optionRules.js";
import { syncDialog } from "../templates/dialog.js";
import { closeOrders, isOrdersOpen, loadOrders, openOrders, orders, ordersError, ordersStatus } from "./orderHistory.js";

const { dialog, div, header, h2, h3, p, button, ul, li, img, span, details, summary, dl, dt, dd, a } = van.tags;

const RADIUS = "rounded-[min(var(--site-radius),0.75rem)]";
const RADIUS_SM = "rounded-[min(var(--site-radius),0.5rem)]";
const DELIVERY_ICONS = { home: "home", point: "pin", arrange: "chat" };

/** El perfil guardado en este navegador, si tiene correo (sin correo no hay «Mis pedidos»). */
const profile = () => (savedCustomer.val?.email && savedCustomer.val?.phone ? savedCustomer.val : null);

const countLabel = (count, one, many) => `${count} ${count === 1 ? one : many}`;
const itemCount = (order) => order.items.reduce((sum, item) => sum + item.quantity, 0);

/** "8 nov 2026, 1:42 p. m." */
function formatCreatedAt(iso, locale) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString(locale, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

/** "Sabor: Chocolate", "Indicaciones: …" */
const itemDetails = (item) => [...describeChoices(item.choices).map(({ group, value }) => `${group}: ${value}`), ...(item.note ? [`Indicaciones: ${item.note}`] : [])];

function Thumb(src, name) {
  return div(
    { class: `size-14 shrink-0 overflow-hidden ${RADIUS_SM} bg-surface ring-1 ring-foreground/5` },
    src
      ? img({ src, alt: name, loading: "lazy", decoding: "async", class: "size-full object-cover" })
      : div({ class: "grid size-full place-items-center text-muted" }, Icon("image", "size-5 opacity-50")),
  );
}

function OrderItem(item, business, productsById) {
  const details = itemDetails(item);
  return li(
    { class: "flex gap-3 py-3" },
    Thumb(productsById.get(item.productId)?.imageUrl, item.name),
    div(
      { class: "min-w-0 flex-1" },
      div(
        { class: "flex items-start justify-between gap-3" },
        p({ class: "text-sm font-medium text-foreground" }, item.name),
        p({ class: "shrink-0 text-sm font-semibold text-foreground tabular-nums" }, formatPrice(business, item.subtotal ?? item.unitPrice * item.quantity)),
      ),
      p({ class: "mt-0.5 text-xs text-muted tabular-nums" }, `${item.quantity} × ${formatPrice(business, item.unitPrice)}`),
      details.length ? ul({ class: "mt-1.5 space-y-0.5" }, details.map((detail) => li({ class: "text-xs leading-snug text-foreground/70" }, detail))) : null,
    ),
  );
}

const Meta = (icon, label, value) =>
  div(
    { class: "flex gap-2.5" },
    span({ class: "mt-0.5 text-accent" }, Icon(icon, "size-4")),
    div({ class: "min-w-0" }, dt({ class: "text-[11px] font-semibold tracking-[0.12em] text-muted uppercase" }, label), dd({ class: "mt-0.5 text-sm break-words text-foreground" }, value)),
  );

function OrderCard(order, index, site, productsById) {
  const { business } = site;
  const askHref = whatsappLink(business, `Hola, quiero preguntar por mi pedido ${order.folio}.`);
  const firstItem = order.items[0];

  return li(
    { class: "animate-fade-up", style: `animation-delay:${Math.min(index, 6) * 60}ms` },
    details(
      { class: `group ${RADIUS} border border-foreground/10 bg-background transition-shadow duration-300 open:shadow-lg open:shadow-black/5`, open: index === 0 },
      summary(
        { class: "flex cursor-pointer list-none items-center gap-3 p-4 sm:gap-4 sm:p-5 [&::-webkit-details-marker]:hidden" },
        // Foto del primer producto, con cuántos más lleva.
        firstItem
          ? div(
              { class: "relative hidden shrink-0 sm:block" },
              Thumb(productsById.get(firstItem.productId)?.imageUrl, firstItem.name),
              order.items.length > 1
                ? span(
                    { class: "absolute -right-1.5 -bottom-1.5 grid size-6 place-items-center rounded-full bg-primary text-[10px] font-bold text-on-primary ring-2 ring-background" },
                    `+${order.items.length - 1}`,
                  )
                : null,
            )
          : null,
        div(
          { class: "min-w-0 flex-1" },
          div(
            { class: "flex flex-wrap items-center gap-x-2.5 gap-y-1" },
            h3({ class: "font-heading text-lg leading-none font-medium text-foreground tabular-nums" }, `Folio ${order.folio}`),
            span({ class: "inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-accent" }, Icon("check", "size-3"), "Recibido"),
          ),
          p({ class: "mt-1.5 truncate text-xs text-muted" }, `${formatCreatedAt(order.createdAt, business.locale)} · ${countLabel(itemCount(order), "producto", "productos")}`),
        ),
        div(
          { class: "flex shrink-0 items-center gap-2" },
          div(
            { class: "text-right" },
            order.approximate ? p({ class: "text-[10px] font-medium text-muted uppercase" }, "Aprox.") : null,
            p({ class: "font-semibold text-foreground tabular-nums" }, formatPrice(business, order.total)),
          ),
          span({ class: "text-muted transition-transform duration-300 group-open:rotate-180" }, Icon("chevronDown", "size-4")),
        ),
      ),
      div(
        { class: "border-t border-foreground/10 px-4 pb-4 sm:px-5 sm:pb-5" },
        dl(
          { class: "grid gap-4 py-4 sm:grid-cols-2" },
          order.deliveryDate ? Meta("calendar", "Para el", formatLongDate(order.deliveryDate, business.locale)) : null,
          Meta(DELIVERY_ICONS[order.delivery?.type] ?? "chat", "Entrega", order.delivery?.label ?? ""),
          order.name ? Meta("user", "A nombre de", order.name) : null,
        ),
        ul({ class: `divide-y divide-foreground/10 ${RADIUS_SM} bg-surface/60 px-3` }, order.items.map((item) => OrderItem(item, business, productsById))),
        order.notes ? p({ class: "mt-3 text-xs text-foreground/70" }, span({ class: "font-semibold text-foreground" }, "Notas: "), order.notes) : null,
        div(
          { class: "mt-4 flex flex-wrap items-center justify-between gap-3" },
          p(
            { class: "text-sm text-muted" },
            order.approximate ? "Total aproximado " : "Total ",
            span({ class: "ml-1 font-heading text-xl font-medium text-foreground tabular-nums" }, formatPrice(business, order.total)),
          ),
          askHref ? a({ href: askHref, target: "_blank", rel: "noopener", class: "btn-secondary px-4 py-2" }, Icon("chat", "size-4"), "Preguntar por este pedido") : null,
        ),
      ),
    ),
  );
}

// Tarjetas grises mientras llega la respuesta: mantienen el tamaño y no brinca la ventana.
const Skeleton = () =>
  ul(
    { class: "space-y-3 px-5 py-4 sm:px-6", "aria-hidden": "true" },
    [0, 1, 2].map((index) =>
      li(
        { class: `flex animate-pulse items-center gap-4 ${RADIUS} border border-foreground/10 p-4 sm:p-5`, style: `animation-delay:${index * 120}ms` },
        div({ class: `hidden size-14 shrink-0 ${RADIUS_SM} bg-foreground/10 sm:block` }),
        div({ class: "flex-1 space-y-2" }, div({ class: "h-4 w-32 rounded bg-foreground/10" }), div({ class: "h-3 w-48 max-w-full rounded bg-foreground/10" })),
        div({ class: "h-5 w-16 rounded bg-foreground/10" }),
      ),
    ),
  );

const Message = (icon, title, text, action) =>
  div(
    { class: "grid flex-1 place-items-center px-6 py-14 text-center" },
    div(
      div({ class: "mx-auto grid size-16 animate-badge-pop place-items-center rounded-full bg-accent/10 text-accent" }, Icon(icon, "size-7")),
      h3({ class: "mt-5 font-heading text-xl font-medium text-foreground" }, title),
      p({ class: "mx-auto mt-2 max-w-xs text-sm text-muted" }, text),
      action,
    ),
  );

function Body(site, customer) {
  const status = ordersStatus.val;
  if (status === "idle" || status === "loading") return Skeleton();
  if (status === "error") {
    return Message(
      "receipt",
      "No pudimos cargar tus pedidos",
      ordersError.val,
      button({ type: "button", onclick: () => loadOrders(customer, { force: true }), class: "btn-primary mt-6" }, "Intentar de nuevo"),
    );
  }

  const list = orders.val;
  if (!list.length) {
    return Message(
      "receipt",
      "Aún no tienes pedidos",
      `Cuando hagas un pedido con ${customer.email} lo verás aquí, con su fecha y sus productos.`,
      button({ type: "button", onclick: closeOrders, class: "btn-primary mt-6" }, "Ver productos"),
    );
  }

  const productsById = new Map(getVisibleProducts(site).map((product) => [product.id, product]));
  return ul({ class: "flex-1 space-y-3 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6" }, list.map((order, index) => OrderCard(order, index, site, productsById)));
}

function Content(site, customer) {
  const count = ordersStatus.val === "ready" ? orders.val.length : null;

  return div(
    // El alto máximo va aquí y no en el <dialog>: darle `display:flex` al dialog lo mostraría aun cerrado.
    { class: "flex max-h-[88dvh] flex-col max-sm:max-h-[90dvh]" },
    header(
      { class: "flex items-start gap-3 border-b border-foreground/10 px-5 pt-5 pb-4 sm:px-6" },
      div({ class: "grid size-11 shrink-0 place-items-center rounded-full bg-accent/10 text-accent" }, Icon("receipt", "size-5")),
      div(
        { class: "min-w-0 flex-1" },
        h2({ class: "font-heading text-2xl leading-tight font-medium text-foreground" }, "Mis pedidos"),
        p(
          { class: "mt-0.5 flex min-w-0 items-center gap-1.5 text-sm text-muted" },
          Icon("mail", "size-3.5 shrink-0"),
          span({ class: "truncate" }, count === null ? customer.email : `${countLabel(count, "pedido", "pedidos")} con ${customer.email}`),
        ),
      ),
      button(
        { type: "button", onclick: closeOrders, "aria-label": "Cerrar", class: "grid size-9 shrink-0 place-items-center rounded-full text-foreground transition hover:bg-foreground/5" },
        Icon("close", "size-5"),
      ),
    ),
    Body(site, customer),
    div(
      { class: "flex items-center gap-1.5 border-t border-foreground/10 px-5 py-3.5 text-xs text-muted sm:px-6" },
      Icon("lock", "size-3.5 shrink-0"),
      "Solo se muestran los pedidos hechos con tu correo y teléfono.",
    ),
  );
}

/** Ventana «Mis pedidos». Se crea una sola vez, junto al carrito. Consulta al abrirse. */
export default function MyOrders() {
  const element = dialog(
    {
      "aria-label": "Mis pedidos",
      class:
        "m-auto max-h-[88dvh] w-full max-w-2xl overflow-hidden bg-background p-0 text-foreground shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-[2px] open:animate-fade-up max-sm:mb-0 max-sm:max-h-[90dvh] max-sm:rounded-t-2xl sm:w-[calc(100%-2rem)] sm:rounded-[min(var(--site-radius),0.75rem)]",
    },
    () => {
      const site = siteStore.site.val;
      const customer = profile();
      return site && customer ? Content(site, customer) : div();
    },
  );

  // Al abrir (o si cambia el perfil con la ventana abierta), se consulta el API.
  van.derive(() => {
    const customer = profile();
    if (isOrdersOpen.val && customer) loadOrders(customer);
  });

  // Sin perfil con correo no hay nada que mostrar: la ventana no se abre.
  return syncDialog(element, () => isOrdersOpen.val && profile(), closeOrders);
}

/** Botón para abrir «Mis pedidos». Aparece siempre que haya un correo guardado en este navegador. */
export function OrdersButton(className) {
  return () =>
    profile()
      ? button(
          { type: "button", onclick: openOrders, "aria-label": "Mis pedidos", title: "Mis pedidos", class: `grid animate-fade-down place-items-center rounded-full transition ${className}` },
          Icon("receipt", "size-6"),
        )
      : span({ hidden: true });
}
