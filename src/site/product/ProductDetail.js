// Ficha de producto compartida por las tres plantillas.
// Orden: fotos e ingredientes a la izquierda; a la derecha qué es (nombre, precio, descripción,
// características) y luego cómo lo quieres (personalización). La barra de compra queda fija abajo.
// Cada plantilla aporta su encabezado y su pie.
import van from "vanjs-core";
import Icon from "../../ui/Icon.js";
import { formatPrice } from "../../core/format.js";
import MoreProducts from "./MoreProducts.js";
import ProductGallery from "./ProductGallery.js";
import ProductMosaic from "./ProductMosaic.js";
import { getVisibleProducts } from "../../core/siteSelectors.js";
import { siteStore } from "../../core/siteStore.js";
import { addToCart, openCart, openCheckout } from "../cart/cartStore.js";
import { QuantityStepper } from "../cart/CartControls.js";
import { syncDialog } from "../templates/dialog.js";
import ProductOptions from "./ProductOptions.js";
import { createSelection, describeChoices, isCustomizable, missingOptions, selectionChoices, unitPrice } from "./optionRules.js";

const { dialog, div, span, h2, h3, p, ul, li, button } = van.tags;

const PANEL_RADIUS = "rounded-[min(var(--site-radius),0.75rem)]";

// Misma distribución en las tres plantillas; cambia cómo se presentan las fotos y el título.
const VARIANTS = {
  classic: { gallery: (product) => ProductMosaic(product, { radius: PANEL_RADIUS }), title: "" },
  market: { gallery: (product) => ProductGallery(product, { radius: PANEL_RADIUS, layout: "side" }), title: "" },
  carta: { gallery: (product) => ProductGallery(product, { radius: PANEL_RADIUS, layout: "arch" }), title: "italic" },
};

/** Estado y acciones de compra de una ficha: selección, cantidad, precio, validación. */
function createPurchase(product, { onAdded, onInvalid }) {
  const selection = createSelection(product);
  const quantity = van.state(1);
  const unit = () => unitPrice(product, selectionChoices(product, selection));
  const configuration = () => ({ choices: selectionChoices(product, selection), note: selection.note.val });

  // Si falta algo obligatorio, se marca, se despliega la personalización y se lleva al cliente a la opción pendiente.
  function validate() {
    const [first] = missingOptions(product, selection);
    if (!first) return true;
    selection.showErrors.val = true;
    const wasClosed = onInvalid?.() ?? false;
    // Si el acordeón estaba cerrado, se espera a que termine de abrirse para desplazar.
    setTimeout(
      () => document.querySelector(`[data-option="${CSS.escape(first.name)}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" }),
      wasClosed ? ACCORDION_MS : 0,
    );
    return false;
  }

  return {
    selection,
    quantity,
    unit,
    total: () => unit() * quantity.val,
    add() {
      if (!validate()) return;
      addToCart(product.id, quantity.val, configuration());
      onAdded?.();
      openCart();
    },
    /** «Pedir ahora»: lo agrega y salta directo a los datos del pedido. */
    orderNow() {
      if (!validate()) return;
      addToCart(product.id, quantity.val, configuration());
      onAdded?.();
      openCheckout();
    },
  };
}

const ACCORDION_MS = 300;

/**
 * Personalización plegable. Cerrada muestra un resumen de lo elegido (o «Obligatorio» si falta algo);
 * se abre sola cuando el cliente intenta agregar sin completar lo obligatorio.
 */
function Customization(product, purchase, business, open) {
  const missing = () => missingOptions(product, purchase.selection);
  const summary = () => {
    const chosen = describeChoices(selectionChoices(product, purchase.selection)).map((item) => item.value);
    if (purchase.selection.note.val.trim()) chosen.push("con indicaciones");
    return chosen.join(" · ");
  };
  const panelId = `customize-${product.id}`;

  return div(
    { class: "border-t border-foreground/10 pt-2" },
    button(
      {
        type: "button",
        class: "group flex w-full items-center gap-3 py-3 text-left",
        "aria-expanded": () => String(open.val),
        "aria-controls": panelId,
        onclick: () => (open.val = !open.val),
      },
      div(
        { class: "min-w-0 flex-1" },
        SectionTitle("Personaliza tu pedido"),
        p(
          { class: () => `mt-1 truncate text-sm ${missing().length && purchase.selection.showErrors.val ? "text-red-600" : "text-foreground/70"}` },
          () => {
            if (missing().length) return purchase.selection.showErrors.val ? `Falta elegir: ${missing().map((option) => option.name).join(", ")}` : "Obligatorio · elige tus opciones";
            return summary() || "Opcional · toca para elegir";
          },
        ),
      ),
      span(
        { class: () => `grid size-8 shrink-0 place-items-center rounded-full bg-surface text-foreground transition-transform duration-300 group-hover:bg-foreground/10 ${open.val ? "rotate-180" : ""}` },
        Icon("chevronDown", "size-4"),
      ),
    ),
    div(
      {
        id: panelId,
        class: () => `grid transition-[grid-template-rows,opacity] duration-300 ease-out ${open.val ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`,
        inert: () => !open.val,
      },
      div({ class: "min-h-0 overflow-hidden" }, div({ class: "space-y-5 pt-2 pb-1" }, ProductOptions(product, purchase.selection, business))),
    ),
  );
}

const SectionTitle = (text) => h3({ class: "text-xs font-semibold tracking-[0.18em] text-muted uppercase" }, text);

/** Qué es: etiqueta, nombre, precio, descripción y características. */
function Intro(site, product, purchase, titleClass, title) {
  const customizable = isCustomizable(product);
  const priceNote = customizable
    ? "El precio se ajusta según lo que elijas."
    : product.priceFrom
      ? "El precio final depende del tamaño o la personalización."
      : "";

  return div(
    product.badge ? span({ class: "mb-3 inline-block rounded bg-accent/10 px-2 py-0.5 text-xs font-bold tracking-wide text-accent uppercase" }, product.badge) : null,
    title,
    div(
      { class: "mt-3 flex flex-wrap items-baseline gap-x-2" },
      // «Desde» solo antes de elegir: con opciones elegidas el precio ya es el exacto.
      product.priceFrom
        ? span({ class: () => `text-sm text-muted ${selectionChoices(product, purchase.selection).length ? "hidden" : ""}` }, "Desde")
        : null,
      span({ class: "text-3xl font-light tracking-tight text-foreground tabular-nums sm:text-4xl" }, () => formatPrice(site.business, purchase.unit())),
    ),
    priceNote ? p({ class: "mt-1 text-xs text-muted" }, priceNote) : null,
    product.description ? p({ class: "mt-5 leading-relaxed text-foreground/75" }, product.description) : null,
    product.details?.length
      ? ul(
          { class: "mt-4 flex flex-wrap gap-x-5 gap-y-2", "aria-label": "Características" },
          product.details.map((detail) => li({ class: "flex items-center gap-1.5 text-sm text-foreground/80" }, Icon("check", "size-4 shrink-0 text-accent"), detail)),
        )
      : null,
  );
}

function Ingredients(product) {
  if (!product.ingredients?.length) return null;
  return div(
    SectionTitle("Ingredientes"),
    ul(
      { class: "mt-3 flex flex-wrap gap-2" },
      product.ingredients.map((ingredient) => li({ class: "rounded-full bg-surface px-3 py-1 text-sm text-foreground/80" }, ingredient)),
    ),
  );
}

function Assurances(business) {
  const items = [
    ["shield", "Te confirmamos disponibilidad antes de cobrar"],
    business.hours ? ["clock", business.hours] : null,
    business.address ? ["pin", business.address] : null,
  ].filter(Boolean);
  return ul(
    { class: "flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted" },
    items.map(([icon, text]) => li({ class: "flex items-center gap-1.5" }, Icon(icon, "size-3.5 shrink-0 text-accent"), text)),
  );
}

/**
 * Encabezado fijo arriba de la ficha (nunca se oculta al hacer scroll): lo que aporta la plantilla
 * (categoría, ruta, flechas, cerrar) y, cuando el título grande sale de la vista, el nombre del producto.
 */
function StickyHeader(header, product, title) {
  const titleHidden = van.state(false);
  // Un solo observador por ficha; se desconecta solo cuando el título ya no está en la página.
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry.target.isConnected) return observer.disconnect();
      titleHidden.val = !entry.isIntersecting;
    },
    { rootMargin: "-72px 0px 0px 0px" },
  );
  requestAnimationFrame(() => title.isConnected && observer.observe(title));

  return div(
    {
      class: () =>
        `sticky top-0 z-20 -mx-4 -mt-4 bg-background/95 px-4 py-3 backdrop-blur transition-shadow sm:-mx-6 sm:-mt-6 sm:px-6 lg:-mx-8 lg:-mt-8 lg:px-8 ${
          titleHidden.val ? "shadow-sm" : ""
        }`,
    },
    header,
    div(
      { class: () => `grid transition-[grid-template-rows,opacity] duration-300 ${titleHidden.val ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`, "aria-hidden": () => String(!titleHidden.val) },
      p({ class: "min-h-0 overflow-hidden truncate pt-1 font-heading text-base font-medium text-foreground" }, product.name),
    ),
  );
}

/**
 * Barra fija al pie de la ficha: cantidad, total en vivo y botones. Siempre visible al hacer scroll.
 * Celular: dos filas (total + cantidad arriba, botones abajo a todo lo ancho). Desde `sm`: una sola fila.
 */
function PurchaseBar(site, purchase) {
  const { business } = site;
  return div(
    { class: "sticky bottom-0 z-10 border-t border-foreground/10 bg-background/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8" },
    div(
      { class: "flex flex-wrap items-center gap-x-3 gap-y-2.5" },
      div(
        { class: "min-w-0 flex-1 sm:flex-none" },
        p({ class: "text-xs text-muted" }, "Total"),
        p({ class: "truncate text-lg font-semibold text-foreground tabular-nums sm:text-xl" }, () => formatPrice(business, purchase.total())),
      ),
      QuantityStepper({ value: () => purchase.quantity.val, onChange: (value) => (purchase.quantity.val = value), min: 1, size: "lg" }),
      div(
        { class: "flex w-full items-center gap-2 sm:w-auto sm:flex-1 sm:justify-end sm:gap-3" },
        button(
          { type: "button", onclick: purchase.orderNow, title: "Agregarlo y realizar el pedido", class: "btn-secondary h-11 flex-1 px-3.5 text-sm whitespace-nowrap sm:flex-none" },
          "Pedir ahora",
        ),
        button(
          { type: "button", onclick: purchase.add, class: "btn-primary h-11 min-w-0 flex-1 px-4 text-base whitespace-nowrap sm:max-w-xs" },
          Icon("cart", "size-5 shrink-0"),
          span({ class: "truncate" }, "Agregar"),
        ),
      ),
    ),
  );
}

/** Contenido de la ficha. `header` y `footer` los aporta cada plantilla. */
/** `onSelectProduct(product)` activa «También te puede gustar» para abrir otro producto en la misma ficha. */
export function ProductDetail(site, product, { header, footer, onAdded, onSelectProduct, variant = "classic" } = {}) {
  const style = VARIANTS[variant] ?? VARIANTS.classic;
  const customizeOpen = van.state(false);
  const purchase = createPurchase(product, {
    onAdded,
    // Devuelve si estaba cerrado, para esperar la animación antes de desplazar.
    onInvalid: () => {
      const wasClosed = !customizeOpen.val;
      customizeOpen.val = true;
      return wasClosed;
    },
  });
  const title = h2({ class: `font-heading text-2xl leading-tight font-medium text-balance text-foreground sm:text-3xl ${style.title}` }, product.name);
  const customizable = isCustomizable(product);

  return div(
    div(
      { class: "space-y-6 p-4 sm:p-6 lg:space-y-8 lg:p-8" },
      StickyHeader(header, product, title),
      // Celular: fotos → qué es → personalización → ingredientes. Escritorio: ingredientes bajo las fotos.
      div(
        { class: "grid items-start gap-x-10 gap-y-6 md:grid-cols-[1.1fr_1fr] md:grid-rows-[auto_1fr]" },
        div({ class: "md:col-start-1 md:row-start-1" }, style.gallery(product)),
        div(
          { class: "space-y-6 md:col-start-2 md:row-span-2 md:row-start-1" },
          Intro(site, product, purchase, style.title, title),
          customizable ? Customization(product, purchase, site.business, customizeOpen) : null,
          div({ class: "border-t border-foreground/10 pt-5" }, Assurances(site.business)),
        ),
        div({ class: "md:col-start-1 md:row-start-2" }, Ingredients(product)),
      ),
      onSelectProduct ? MoreProducts(site, product, onSelectProduct) : null,
      footer,
    ),
    PurchaseBar(site, purchase),
  );
}

/** Botón de cerrar para el encabezado de la ficha. */
export const CloseButton = (onclick) =>
  button(
    { type: "button", onclick, "aria-label": "Cerrar", class: "grid size-9 shrink-0 place-items-center rounded-full text-foreground transition hover:bg-foreground/5" },
    Icon("close", "size-5"),
  );

/**
 * Ventana de la ficha de producto. Se crea una sola vez por plantilla.
 * `productId()` devuelve el id abierto (o null); `render(site, product)` arma el contenido.
 */
export function ProductDialog({ productId, close, render }) {
  const findProduct = () => {
    const site = siteStore.site.val;
    const id = productId();
    const product = site && id ? getVisibleProducts(site).find((item) => item.id === id) : null;
    return product ? { site, product } : null;
  };

  const element = dialog(
    {
      "aria-label": "Detalle del producto",
      class:
        "m-auto max-h-[94dvh] w-full max-w-5xl overflow-x-hidden overflow-y-auto xl:max-w-6xl overscroll-contain bg-background p-0 text-foreground shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-[2px] open:animate-fade-up max-sm:mb-0 max-sm:max-h-[92dvh] max-sm:rounded-t-2xl sm:w-[calc(100%-2rem)] sm:rounded-[min(var(--site-radius),0.75rem)]",
    },
    () => {
      const found = findProduct();
      return found ? render(found.site, found.product) : div();
    },
  );

  van.derive(() => {
    if (productId()) element.scrollTop = 0;
  });
  return syncDialog(element, () => productId() && findProduct(), close);
}
