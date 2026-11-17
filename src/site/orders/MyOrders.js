// «Mis pedidos»: panel lateral (como el carrito) con los pedidos del cliente, igual en las tres plantillas.
// Se consultan en el API con el correo y teléfono que guardó en este navegador.
// Dos pantallas: la lista (ligera, un renglón por pedido) y el detalle de un pedido. En celular ocupa
// toda la pantalla. Si falta el anticipo, lo más visible del detalle es subir el comprobante.
import van from "vanjs-core";
import Icon from "../../ui/Icon.js";
import { formatPrice, whatsappLink } from "../../core/format.js";
import { getVisibleProducts } from "../../core/siteSelectors.js";
import { siteStore } from "../../core/siteStore.js";
import { savedCustomer } from "../checkout/checkoutStore.js";
import { formatLongDate } from "../checkout/DatePicker.js";
import { DepositBanner, formatDue } from "../checkout/OrderSuccess.js";
import { ProofContacts, openPayment, paymentNumber } from "../payment/PaymentWidget.js";
import ProofUpload from "../checkout/ProofUpload.js";
import { describeChoices } from "../product/optionRules.js";
import { DRAWER_CLASS, syncDialog } from "../templates/dialog.js";
import { closeOrders, isOrdersOpen, loadOrders, openOrders, orders, ordersError, ordersStatus, selectedOrder } from "./orderHistory.js";

const { dialog, div, header, h2, h3, p, button, ul, li, img, span, dl, dt, dd, a, section } = van.tags;

const RADIUS = "rounded-[min(var(--site-radius),0.75rem)]";
const RADIUS_SM = "rounded-[min(var(--site-radius),0.5rem)]";
const DELIVERY_ICONS = { home: "home", point: "pin", arrange: "chat" };
const ICON_BUTTON = "grid size-9 shrink-0 place-items-center rounded-full text-foreground transition hover:bg-foreground/5";
const PROOF_INPUT_ID = "order-proof-input";

// Botones grandes a todo lo ancho: principal con el color del negocio, secundario en tono suave.
const BIG_BUTTON = `flex w-full items-center justify-center gap-2 ${RADIUS} px-5 py-4 text-base font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`;
const PRIMARY = `${BIG_BUTTON} bg-primary text-on-primary hover:bg-primary/90 active:scale-[0.99]`;
const SECONDARY = `${BIG_BUTTON} bg-primary/10 text-foreground hover:bg-primary/15`;

// Cómo ve el cliente cada estado de su pedido.
const STATUS = {
  awaiting_deposit: { label: "Falta anticipo", icon: "clock", tone: "bg-amber-500/15 text-amber-700" },
  new: { label: "Recibido", icon: "check", tone: "bg-accent/10 text-accent" },
  confirmed: { label: "Confirmado", icon: "check", tone: "bg-emerald-500/15 text-emerald-700" },
  delivered: { label: "Entregado", icon: "box", tone: "bg-foreground/10 text-foreground/70" },
  cancelled: { label: "Cancelado", icon: "close", tone: "bg-red-500/10 text-red-700" },
};

const StatusBadge = (status) => {
  const info = STATUS[status] ?? STATUS.new;
  return span({ class: `inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${info.tone}` }, Icon(info.icon, "size-3"), info.label);
};

/** El perfil guardado en este navegador, si tiene correo (sin correo no hay «Mis pedidos»). */
const profile = () => (savedCustomer.val?.email && savedCustomer.val?.phone ? savedCustomer.val : null);

const countLabel = (count, one, many) => `${count} ${count === 1 ? one : many}`;
const itemCount = (order) => order.items.reduce((sum, item) => sum + item.quantity, 0);
const needsDeposit = (order) => order.status === "awaiting_deposit" && order.deposit > 0;
/**
 * ¿Mostrar «Transfiere» y «Sube tu comprobante»? Con anticipo pendiente, siempre. Sin anticipo, mientras el
 * pedido sigue «Recibido» y el negocio tiene datos para transferir (el API acepta comprobantes en esos dos estados).
 */
const canPay = (order, business) => needsDeposit(order) || (order.status === "new" && !(order.deposit > 0) && Boolean(paymentNumber(business.payment)));

/** "8 nov 2026, 1:42 p. m." */
function formatCreatedAt(iso, locale) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString(locale, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

/** "Sabor: Chocolate", "Indicaciones: …" */
const itemDetails = (item) => [...describeChoices(item.choices).map(({ group, value }) => `${group}: ${value}`), ...(item.note ? [`Indicaciones: ${item.note}`] : [])];

function Thumb(src, name, size = "size-14") {
  return div(
    { class: `${size} shrink-0 overflow-hidden ${RADIUS_SM} bg-surface ring-1 ring-foreground/5` },
    src
      ? img({ src, alt: name, loading: "lazy", decoding: "async", class: "size-full object-cover" })
      : div({ class: "grid size-full place-items-center text-muted" }, Icon("image", "size-5 opacity-50")),
  );
}

const SectionTitle = (text) => h3({ class: "mb-3 text-xs font-semibold tracking-[0.16em] text-muted uppercase" }, text);

// ── Lista ───────────────────────────────────────────────────────────────────────────────────────

let listScroll = 0; // para volver a la lista en el mismo lugar

/** Un renglón por pedido: foto, folio, estado y total. Ligero aunque haya muchos pedidos. */
function OrderRow(order, site, productsById) {
  const { business } = site;
  const firstItem = order.items[0];
  const pending = needsDeposit(order);
  return li(
    button(
      {
        type: "button",
        onclick: (event) => {
          listScroll = event.currentTarget.closest("[data-scroll]")?.scrollTop ?? 0;
          selectedOrder.val = order.publicId;
        },
        class: `flex w-full items-center gap-3 ${RADIUS} border bg-background p-3.5 text-left transition hover:border-foreground/30 hover:shadow-md hover:shadow-black/5 sm:gap-4 sm:p-4 ${
          pending ? "border-amber-500/50 bg-amber-500/[0.03]" : "border-foreground/10"
        }`,
      },
      firstItem
        ? div(
            { class: "relative shrink-0" },
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
        div({ class: "flex flex-wrap items-center gap-x-2 gap-y-1" }, p({ class: "font-heading text-base leading-none font-medium text-foreground tabular-nums" }, `Folio ${order.folio}`), StatusBadge(order.status)),
        p({ class: "mt-1.5 truncate text-xs text-muted" }, `${formatCreatedAt(order.createdAt, business.locale)} · ${countLabel(itemCount(order), "producto", "productos")}`),
        pending
          ? p({ class: "mt-1 flex items-center gap-1 text-xs font-semibold text-amber-700" }, Icon("image", "size-3.5"), order.proofCount ? "Comprobante enviado · en revisión" : "Sube tu comprobante")
          : null,
      ),
      div(
        { class: "flex shrink-0 items-center gap-1.5" },
        p({ class: "text-sm font-semibold text-foreground tabular-nums" }, formatPrice(business, order.total)),
        span({ class: "text-muted" }, Icon("chevronRight", "size-4")),
      ),
    ),
  );
}

function OrderList(site, customer) {
  const productsById = new Map(getVisibleProducts(site).map((product) => [product.id, product]));
  const list = ul(
    { "data-scroll": "", class: "flex-1 space-y-2.5 overflow-y-auto overscroll-contain px-4 py-4 animate-step-back sm:px-6" },
    orders.val.map((order) => OrderRow(order, site, productsById)),
  );
  setTimeout(() => (list.scrollTop = listScroll));
  return div(
    { class: "flex h-full flex-col" },
    header(
      { class: "flex items-start gap-3 border-b border-foreground/10 px-5 pt-5 pb-4 sm:px-6" },
      div({ class: "grid size-11 shrink-0 place-items-center rounded-full bg-accent/10 text-accent" }, Icon("receipt", "size-5")),
      div(
        { class: "min-w-0 flex-1" },
        h2({ class: "font-heading text-2xl leading-tight font-medium text-foreground" }, "Mis pedidos"),
        p(
          { class: "mt-0.5 flex min-w-0 items-center gap-1.5 text-sm text-muted" },
          Icon("mail", "size-3.5 shrink-0"),
          span({ class: "truncate" }, `${countLabel(orders.val.length, "pedido", "pedidos")} con ${customer.email}`),
        ),
      ),
      button({ type: "button", onclick: closeOrders, "aria-label": "Cerrar", class: ICON_BUTTON }, Icon("close", "size-5")),
    ),
    list,
    Footnote(),
  );
}

const Footnote = () =>
  div({ class: "flex items-center gap-1.5 border-t border-foreground/10 px-5 py-3.5 text-xs text-muted sm:px-6" }, Icon("lock", "size-3.5 shrink-0"), "Solo se muestran los pedidos hechos con tu correo y teléfono.");

// ── Detalle ─────────────────────────────────────────────────────────────────────────────────────

/** Paso numerado del pago: 1 transfiere, 2 sube el comprobante. */
const Step = (number, title, ...children) =>
  div(
    { class: "flex gap-3" },
    span({ class: "grid size-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-on-primary" }, number),
    div({ class: "min-w-0 flex-1" }, p({ class: "pt-0.5 text-sm font-semibold text-foreground" }, title), ...children),
  );

/** Anticipo pendiente: monto, plazo y los dos pasos. Subir el comprobante es lo más visible. */
function PayDeposit(order, business) {
  const isDeposit = needsDeposit(order);
  const overdue = isDeposit && order.depositDueAt && new Date(order.depositDueAt).getTime() < Date.now();
  const canTransfer = Boolean(paymentNumber(business.payment));
  const amount = formatPrice(business, isDeposit ? order.deposit : order.total);
  const contacts = ProofContacts(business, order.folio);

  return section(
    { class: "space-y-5" },
    isDeposit
      ? DepositBanner(business, order)
      : div(
          { class: `${RADIUS} border border-accent/30 bg-accent/5 p-4 text-center` },
          p({ class: "text-xs font-semibold tracking-[0.16em] text-accent uppercase" }, order.approximate ? "Total aproximado" : "Total a pagar"),
          p({ class: "mt-1 font-heading text-4xl font-medium tracking-tight text-foreground tabular-nums" }, amount),
          order.approximate ? p({ class: "mt-2 text-xs text-muted" }, "Algunos precios son «desde»: espera a que te confirmemos el monto final antes de transferir.") : null,
        ),
    overdue
      ? p(
          { class: `${RADIUS_SM} bg-red-500/10 px-3 py-2 text-xs text-red-700` },
          `El plazo terminó el ${formatDue(order.depositDueAt, business.locale)}. Si ya pagaste, sube tu comprobante o escríbenos.`,
        )
      : null,
    canTransfer
      ? Step(
          1,
          `Transfiere ${amount}`,
          p({ class: "mt-0.5 text-xs text-muted" }, `Usa tu folio ${order.folio} como concepto.`),
          button({ type: "button", onclick: () => openPayment({ amount, folio: order.folio }), class: `${SECONDARY} mt-2.5 py-3 text-sm` }, Icon("card", "size-4"), "Ver tarjeta y copiar número"),
        )
      : null,
    Step(
      canTransfer ? 2 : 1,
      "Sube tu comprobante",
      ProofUpload({
        publicId: order.publicId,
        count: order.proofCount ?? 0,
        prominent: true,
        inputId: PROOF_INPUT_ID,
        onUploaded: (count) => (order.proofCount = count),
      }),
    ),
    // Otras formas de enviarlo: visibles, pero al final.
    contacts ? div({ class: "border-t border-foreground/10 pt-4" }, p({ class: "mb-2.5 text-xs text-muted" }, "¿Prefieres enviarlo por otro medio?"), contacts) : null,
  );
}

function DepositPaid(order, business) {
  if (!(order.deposit > 0 && order.depositPaidAt)) return null;
  return p(
    { class: `flex flex-wrap items-center justify-between gap-2 ${RADIUS_SM} bg-emerald-500/10 px-3.5 py-3 text-sm text-emerald-800` },
    span({ class: "flex items-center gap-2 font-medium" }, Icon("check", "size-4"), `Anticipo de ${formatPrice(business, order.deposit)} recibido`),
    span({ class: "text-xs" }, `Resta ${formatPrice(business, order.total - order.deposit)}`),
  );
}

function OrderItem(item, business, productsById) {
  const details = itemDetails(item);
  return li(
    { class: "flex gap-3.5 py-3.5" },
    Thumb(productsById.get(item.productId)?.imageUrl, item.name, "size-16 sm:size-20"),
    div(
      { class: "min-w-0 flex-1" },
      div(
        { class: "flex items-start justify-between gap-3" },
        p({ class: "text-sm font-semibold text-foreground sm:text-base" }, item.name),
        p({ class: "shrink-0 text-sm font-semibold text-foreground tabular-nums" }, formatPrice(business, item.subtotal ?? item.unitPrice * item.quantity)),
      ),
      p({ class: "mt-0.5 text-xs text-muted tabular-nums" }, `${item.quantity} × ${formatPrice(business, item.unitPrice)}`),
      details.length ? ul({ class: "mt-1.5 space-y-0.5" }, details.map((detail) => li({ class: "text-xs leading-snug text-foreground/70" }, detail))) : null,
    ),
  );
}

const Meta = (icon, label, value) =>
  div(
    { class: "flex gap-3 py-3" },
    span({ class: "grid size-8 shrink-0 place-items-center rounded-full bg-accent/10 text-accent" }, Icon(icon, "size-4")),
    div({ class: "min-w-0" }, dt({ class: "text-xs text-muted" }, label), dd({ class: "mt-0.5 text-sm font-medium break-words text-foreground" }, value)),
  );

/** ¿La zona de subir comprobante del detalle está visible? */
const uploadZoneVisible = van.state(false);
let zoneObserver = null;

function watchUploadZone(scroller) {
  zoneObserver?.disconnect();
  uploadZoneVisible.val = false;
  setTimeout(() => {
    const zone = scroller.querySelector(`#${PROOF_INPUT_ID}`)?.closest("label");
    if (!zone) return;
    zoneObserver = new IntersectionObserver(([entry]) => (uploadZoneVisible.val = entry.isIntersecting), { root: scroller, threshold: 0.5 });
    zoneObserver.observe(zone);
  });
}

function OrderDetail(order, site) {
  const { business } = site;
  const productsById = new Map(getVisibleProducts(site).map((product) => [product.id, product]));
  const askHref = whatsappLink(business, `Hola, quiero preguntar por mi pedido ${order.folio}.`);
  const pending = canPay(order, business);

  const scroller = div(
    { class: "flex-1 space-y-7 overflow-y-auto overscroll-contain px-5 py-6 animate-step-next sm:px-6" },
    pending ? PayDeposit(order, business) : DepositPaid(order, business),
    section(
      SectionTitle(`Lo que pediste (${itemCount(order)})`),
      ul({ class: "divide-y divide-foreground/10" }, order.items.map((item) => OrderItem(item, business, productsById))),
      div(
        { class: "mt-2 flex items-baseline justify-between border-t border-foreground/10 pt-3.5" },
        span({ class: "text-sm text-muted" }, order.approximate ? "Total aproximado" : "Total"),
        span({ class: "font-heading text-2xl font-medium text-foreground tabular-nums" }, formatPrice(business, order.total)),
      ),
    ),
    section(
      SectionTitle("Entrega"),
      dl(
        { class: `divide-y divide-foreground/10 ${RADIUS} border border-foreground/10 px-4` },
        order.deliveryDate ? Meta("calendar", "Para el", formatLongDate(order.deliveryDate, business.locale)) : null,
        Meta(DELIVERY_ICONS[order.delivery?.type] ?? "chat", "Dónde", order.delivery?.label ?? ""),
        order.name ? Meta("user", "A nombre de", order.name) : null,
        order.notes ? Meta("chat", "Notas", order.notes) : null,
      ),
    ),
    askHref ? a({ href: askHref, target: "_blank", rel: "noopener", class: `${SECONDARY} py-3.5 text-sm` }, Icon("chat", "size-4"), "Preguntar por este pedido") : null,
  );

  if (pending) watchUploadZone(scroller);

  return div(
    { class: "flex h-full flex-col" },
    header(
      { class: "flex items-center gap-2 border-b border-foreground/10 px-4 py-3.5 sm:px-5" },
      button({ type: "button", onclick: () => (selectedOrder.val = ""), "aria-label": "Regresar a mis pedidos", class: ICON_BUTTON }, Icon("arrowLeft", "size-5")),
      div(
        { class: "min-w-0 flex-1" },
        div({ class: "flex flex-wrap items-center gap-2" }, h2({ class: "font-heading text-xl leading-tight font-medium text-foreground tabular-nums" }, `Folio ${order.folio}`), StatusBadge(order.status)),
        p({ class: "mt-0.5 truncate text-xs text-muted" }, `Pedido el ${formatCreatedAt(order.createdAt, business.locale)}`),
      ),
      button({ type: "button", onclick: closeOrders, "aria-label": "Cerrar", class: ICON_BUTTON }, Icon("close", "size-5")),
    ),
    scroller,
    // Acción principal a la vista mientras falta el anticipo. Se oculta cuando la zona grande de
    // «Sube tu comprobante» ya está en pantalla, para no mostrar dos botones que hacen lo mismo.
    pending
      ? div(
          { class: () => `border-t border-foreground/10 bg-background p-4 sm:p-5 ${uploadZoneVisible.val ? "hidden" : ""}` },
          button(
            {
              type: "button",
              onclick: () => {
                const input = document.getElementById(PROOF_INPUT_ID);
                if (input && !input.disabled) input.click();
                else input?.closest("label")?.scrollIntoView({ behavior: "smooth", block: "center" });
              },
              class: PRIMARY,
            },
            Icon("image", "size-5"),
            "Subir comprobante",
          ),
        )
      : Footnote(),
  );
}

// ── Estados de carga ────────────────────────────────────────────────────────────────────────────

// Renglones grises mientras llega la respuesta: mantienen el tamaño y no brinca el panel.
const Skeleton = () =>
  ul(
    { class: "space-y-2.5 px-4 py-4 sm:px-6", "aria-hidden": "true" },
    [0, 1, 2, 3].map((index) =>
      li(
        { class: `flex animate-pulse items-center gap-4 ${RADIUS} border border-foreground/10 p-4`, style: `animation-delay:${index * 120}ms` },
        div({ class: `size-14 shrink-0 ${RADIUS_SM} bg-foreground/10` }),
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

const SimpleHeader = () =>
  header(
    { class: "flex items-center justify-between gap-3 border-b border-foreground/10 px-5 py-4 sm:px-6" },
    h2({ class: "font-heading text-2xl font-medium text-foreground" }, "Mis pedidos"),
    button({ type: "button", onclick: closeOrders, "aria-label": "Cerrar", class: ICON_BUTTON }, Icon("close", "size-5")),
  );

function Content(site, customer) {
  const status = ordersStatus.val;
  if (status === "idle" || status === "loading") return div({ class: "flex h-full flex-col" }, SimpleHeader(), Skeleton());
  if (status === "error") {
    return div(
      { class: "flex h-full flex-col" },
      SimpleHeader(),
      Message("receipt", "No pudimos cargar tus pedidos", ordersError.val, button({ type: "button", onclick: () => loadOrders(customer, { force: true }), class: "btn-primary mt-6" }, "Intentar de nuevo")),
    );
  }
  if (!orders.val.length) {
    return div(
      { class: "flex h-full flex-col" },
      SimpleHeader(),
      Message("receipt", "Aún no tienes pedidos", `Cuando hagas un pedido con ${customer.email} lo verás aquí, con su fecha y sus productos.`, button({ type: "button", onclick: closeOrders, class: "btn-primary mt-6" }, "Ver productos")),
    );
  }

  const order = selectedOrder.val && orders.val.find((item) => item.publicId === selectedOrder.val);
  return order ? OrderDetail(order, site) : OrderList(site, customer);
}

/** Panel «Mis pedidos». Se crea una sola vez, junto al carrito. Consulta al abrirse. */
export default function MyOrders() {
  const element = dialog({ "aria-label": "Mis pedidos", class: DRAWER_CLASS }, () => {
    const site = siteStore.site.val;
    const customer = profile();
    return site && customer ? Content(site, customer) : div();
  });

  // Al abrir (o si cambia el perfil con el panel abierto), se consulta el API.
  van.derive(() => {
    const customer = profile();
    if (isOrdersOpen.val && customer) loadOrders(customer);
  });

  // Sin perfil con correo no hay nada que mostrar: el panel no se abre.
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
