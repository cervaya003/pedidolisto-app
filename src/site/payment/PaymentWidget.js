// Datos para transferir, a la mano en todo el sitio:
// - Una burbuja flotante (abajo a la derecha) abre una ventana con la tarjeta animada y botones para copiar.
// - `PaymentHowTo` explica en el carrito y en «Mis pedidos» cómo pagar y a dónde mandar el comprobante,
//   con un botón que abre esa misma ventana (la tarjeta vive en un solo lugar).
import van from "vanjs-core";
import Icon from "../../ui/Icon.js";
import { formatPrice, whatsappLink } from "../../core/format.js";
import { imageProps } from "../../core/image.js";
import { siteStore } from "../../core/siteStore.js";
import { isCartOpen } from "../cart/cartStore.js";
import BankCard from "../checkout/BankCard.js";
import { syncDialog } from "../templates/dialog.js";

const { dialog, div, header, h2, p, button, span, a, img, details, summary } = van.tags;

const RADIUS = "rounded-[min(var(--site-radius),0.75rem)]";
const COPIED_MS = 1800;

export const isPaymentOpen = van.state(false);
/** Monto y folio a mostrar en la ventana (cuando se abre desde un pedido). */
const context = van.state({ amount: "", folio: "" });

export function openPayment({ amount = "", folio = "" } = {}) {
  context.val = { amount, folio };
  isPaymentOpen.val = true;
}
const closePayment = () => (isPaymentOpen.val = false);

/** ¿El negocio tiene datos para recibir transferencias? Devuelve [etiqueta, número] o null. */
export function paymentNumber(payment) {
  if (!payment?.enabled) return null;
  if (payment.card) return ["número de tarjeta", payment.card];
  if (payment.clabe) return ["CLABE", payment.clabe];
  if (payment.account) return ["número de cuenta", payment.account];
  return null;
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function CopyButton(label, value, { primary = false } = {}) {
  const copied = van.state(false);
  return button(
    {
      type: "button",
      class: () =>
        `${primary ? "btn-primary" : "btn-secondary"} w-full py-3 transition ${copied.val ? "!bg-emerald-600 !text-white border-emerald-600" : ""}`,
      onclick: async () => {
        if (!(await copyText(value))) return;
        copied.val = true;
        navigator.vibrate?.(15);
        setTimeout(() => (copied.val = false), COPIED_MS);
      },
    },
    () => Icon(copied.val ? "check" : "copy", "size-4"),
    () => (copied.val ? "¡Copiado!" : `Copiar ${label}`),
  );
}

/** A dónde mandar el comprobante: WhatsApp y/o correo del negocio. */
function ProofContacts(business, folio) {
  const message = folio ? `Hola, te envío el comprobante de mi pedido ${folio}.` : "Hola, te envío el comprobante de mi transferencia.";
  const whatsapp = whatsappLink(business, message);
  const email = business.email
    ? `mailto:${business.email}?subject=${encodeURIComponent(folio ? `Comprobante del pedido ${folio}` : "Comprobante de transferencia")}`
    : null;
  if (!whatsapp && !email) return null;
  return div(
    { class: "flex flex-col gap-2 sm:flex-row" },
    whatsapp ? a({ href: whatsapp, target: "_blank", rel: "noopener", class: "btn-secondary flex-1 py-2.5" }, Icon("chat", "size-4"), "Enviar por WhatsApp") : null,
    email ? a({ href: email, class: "btn-secondary flex-1 py-2.5" }, Icon("mail", "size-4"), "Enviar por correo") : null,
  );
}

const contactText = (business) => {
  const phone = business.whatsapp ? `+${business.whatsapp}` : "";
  if (phone && business.email) return `por WhatsApp al ${phone} o al correo ${business.email}`;
  if (phone) return `por WhatsApp al ${phone}`;
  if (business.email) return `al correo ${business.email}`;
  return "";
};

// ── Ventana con la tarjeta ──────────────────────────────────────────────────────────────────

function Content(business) {
  const payment = business.payment;
  const found = paymentNumber(payment);
  if (!found) return div();
  const [label, number] = found;
  const { amount, folio } = context.val;
  const contacts = contactText(business);

  return div(
    { class: "flex max-h-[90dvh] flex-col" },
    header(
      { class: "flex items-start gap-3 px-5 pt-5 pb-3 sm:px-6" },
      div(
        { class: "min-w-0 flex-1" },
        h2({ class: "font-heading text-2xl leading-tight font-medium text-foreground" }, "Paga por transferencia"),
        p(
          { class: "mt-0.5 text-sm text-muted" },
          amount ? ["Monto: ", span({ class: "font-semibold text-foreground tabular-nums" }, amount), folio ? ` · Pedido ${folio}` : ""] : "Desde la app de tu banco, a esta tarjeta.",
        ),
      ),
      button(
        { type: "button", onclick: closePayment, "aria-label": "Cerrar", class: "grid size-9 shrink-0 place-items-center rounded-full text-foreground transition hover:bg-foreground/5" },
        Icon("close", "size-5"),
      ),
    ),
    div(
      { class: "flex-1 overflow-y-auto overscroll-contain px-5 pb-5 sm:px-6 sm:pb-6" },
      // La tarjeta entra con giro cada vez que se abre la ventana (el contenido se vuelve a dibujar).
      div({ class: "animate-card-in px-1 pt-3 pb-1" }, BankCard(payment)),
      div(
        { class: "mx-auto mt-6 grid max-w-sm gap-2 animate-fade-up [animation-delay:250ms]" },
        CopyButton(label, number, { primary: true }),
        payment.holder ? CopyButton("nombre del titular", payment.holder) : null,
      ),
      payment.qrUrl
        ? details(
            { class: `group mx-auto mt-3 max-w-sm ${RADIUS} border border-foreground/10` },
            summary(
              { class: "flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-foreground [&::-webkit-details-marker]:hidden" },
              span({ class: "flex items-center gap-2" }, Icon("grid", "size-4 text-accent"), "Pagar con código QR"),
              span({ class: "text-muted transition-transform group-open:rotate-180" }, Icon("chevronDown", "size-4")),
            ),
            div(
              { class: "border-t border-foreground/10 p-4 text-center" },
              img({ ...imageProps(payment.qrUrl, { sizes: "240px" }), alt: "Código QR para pagar", loading: "lazy", class: "mx-auto w-full max-w-60 rounded-lg bg-white object-contain p-2" }),
            ),
          )
        : null,
      contacts || payment.instructions
        ? div(
            { class: `mx-auto mt-5 max-w-sm space-y-3 ${RADIUS} bg-surface/70 p-4 animate-fade-up [animation-delay:350ms]` },
            p(
              { class: "flex items-start gap-2 text-sm text-foreground/80" },
              Icon("receipt", "mt-0.5 size-4 shrink-0 text-accent"),
              span(contacts ? `Al transferir, envía tu comprobante ${contacts}${folio ? ` con tu folio ${folio}` : ""}.` : payment.instructions),
            ),
            contacts && payment.instructions ? p({ class: "text-xs text-muted" }, payment.instructions) : null,
            ProofContacts(business, folio),
          )
        : null,
    ),
  );
}

/** La ventana: hoja desde abajo en celular, centrada en computadora. Se crea una vez, junto al carrito. */
export function PaymentDialog() {
  const element = dialog(
    {
      "aria-label": "Datos para transferir",
      class:
        "m-auto w-full max-w-md overflow-hidden bg-background p-0 text-foreground shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-[3px] open:animate-fade-up max-sm:mb-0 max-sm:max-w-none max-sm:rounded-t-3xl sm:w-[calc(100%-2rem)] sm:rounded-[min(var(--site-radius),1rem)]",
    },
    () => {
      const site = siteStore.site.val;
      // Se lee `isPaymentOpen` para redibujar (y repetir la animación de la tarjeta) en cada apertura.
      return site && isPaymentOpen.val ? Content(site.business) : div();
    },
  );
  return syncDialog(element, () => isPaymentOpen.val && paymentNumber(siteStore.site.val?.business.payment), closePayment);
}

// ── Burbuja flotante ────────────────────────────────────────────────────────────────────────

/**
 * Acceso a los datos para transferir, siempre a la mano:
 * - Celular: pestaña delgada pegada a la orilla derecha (como las barras laterales de Android). Ocupa poco
 *   ancho, no tapa el contenido ni choca con la barra del carrito; asoma un poco más al tocarla.
 * - Computadora: burbuja abajo a la derecha con el texto «Pagar por transferencia».
 */
export function PaymentBubble() {
  return () => {
    const site = siteStore.site.val;
    if (!site || !paymentNumber(site.business.payment) || isCartOpen.val) return span({ hidden: true });

    return div(
      // Pestaña lateral (celular).
      button(
        {
          type: "button",
          onclick: () => openPayment(),
          "aria-label": "Ver datos para transferir",
          title: "Datos para transferir",
          class:
            "fixed top-[68%] right-0 z-30 flex w-8 translate-x-1 flex-col items-center gap-1.5 rounded-l-xl bg-primary py-3 pl-0.5 text-on-primary shadow-[-6px_8px_20px_-8px_rgba(0,0,0,.45)] transition-transform duration-300 hover:translate-x-0 active:translate-x-0 focus-visible:translate-x-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:hidden",
        },
        Icon("card", "size-4 shrink-0"),
        span({ class: "text-[11px] font-semibold tracking-wider [writing-mode:vertical-rl] rotate-180" }, "Pagar"),
      ),
      // Burbuja (computadora).
      button(
        {
          type: "button",
          onclick: () => openPayment(),
          "aria-label": "Ver datos para transferir",
          title: "Datos para transferir",
          class:
            "group fixed right-6 bottom-6 z-30 hidden animate-bubble-float items-center gap-2.5 rounded-full bg-primary p-1.5 pr-5 text-on-primary shadow-[0_12px_30px_-8px_rgba(0,0,0,.45)] ring-4 ring-background/70 transition hover:shadow-[0_16px_40px_-8px_rgba(0,0,0,.55)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent md:flex",
        },
        // Mini tarjeta dentro de la burbuja. Fondo claro translúcido: contrasta con cualquier color primario.
        span(
          { class: "relative grid size-11 place-items-center overflow-hidden rounded-full bg-white/15 ring-1 ring-white/20" },
          span(
            { class: "relative h-5 w-7 rounded-[4px] border border-white/60 bg-white/15 transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-110" },
            span({ class: "absolute top-1 left-1 h-1.5 w-2 rounded-[2px] bg-amber-300/90" }),
            span({ class: "absolute right-1 bottom-1 h-[2px] w-3 rounded bg-white/70" }),
          ),
          // Pulso suave para llamar la atención sin molestar.
          span({ class: "absolute inset-0 animate-ping rounded-full bg-white/10 [animation-duration:2.5s]", "aria-hidden": "true" }),
        ),
        span({ class: "text-sm font-semibold whitespace-nowrap" }, "Pagar por transferencia"),
      ),
    );
  };
}

// ── Cómo pagar (carrito y «Mis pedidos») ────────────────────────────────────────────────────

/**
 * Texto breve: a dónde transferir y a dónde mandar el comprobante, con un botón que abre la tarjeta.
 * `amount` (número) y `folio` son opcionales.
 */
export function PaymentHowTo(business, { amount, folio } = {}) {
  const payment = business.payment;
  if (!paymentNumber(payment)) return null;
  const amountText = amount > 0 ? formatPrice(business, amount) : "";
  const contacts = contactText(business);

  return div(
    { class: `mt-6 ${RADIUS} border border-foreground/10 p-4` },
    p({ class: "flex items-center gap-2 text-xs font-semibold tracking-[0.16em] text-muted uppercase" }, Icon("card", "size-4"), "Cómo pagar"),
    p(
      { class: "mt-2 text-sm leading-relaxed text-foreground/80" },
      "Transfiere",
      amountText ? [" ", span({ class: "font-semibold text-foreground tabular-nums" }, amountText)] : "",
      payment.bank ? ` a la tarjeta ${payment.bank}` : " a nuestra tarjeta",
      payment.holder ? [" a nombre de ", span({ class: "font-semibold text-foreground" }, payment.holder)] : "",
      contacts ? `, y envía tu comprobante ${contacts}${folio ? ` con tu folio ${folio}` : ""}.` : ".",
    ),
    button(
      { type: "button", onclick: () => openPayment({ amount: amountText, folio }), class: "btn-primary mt-3 w-full py-3" },
      Icon("card", "size-4"),
      "Ver tarjeta y copiar número",
    ),
    div({ class: "mt-2" }, ProofContacts(business, folio)),
  );
}
