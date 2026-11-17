// Formulario «Realizar pedido» (sin interfaz): estado, validación y envío al API.
// El estado vive a nivel de módulo: si el cliente cierra el carrito y vuelve, no pierde lo escrito.
import van from "vanjs-core";
import { apiClient } from "../../core/apiClient.js";
import { MAX, PATTERNS, PHONE_DIGITS, dialOf, digitCount, formatPhone, splitPhone } from "../../core/textRules.js";
import { IS_PREVIEW } from "../../core/previewChannel.js";
import { cartView, clearCart } from "../cart/cartStore.js";
import { invalidateOrders, resetOrders } from "../orders/orderHistory.js";
import { forgetCustomer, loadCustomer, saveCustomer } from "./customerStore.js";
import { formatLongDate, todayIso } from "./DatePicker.js";

const HOME = "home";
const POINT_PREFIX = "point:";
const ARRANGE = "arrange";

const ADDRESS_KEYS = ["street", "exterior", "interior", "neighborhood", "postalCode", "city", "state", "references"];

export const form = {
  name: van.state(""),
  /** Los 10 dígitos del teléfono (sin lada). */
  phone: van.state(""),
  /** País de la lada: "MX" (por defecto), "US" o "CA". */
  phoneCountry: van.state("MX"),
  email: van.state(""),
  /** Día en que lo quiere: "AAAA-MM-DD" (no se recuerda entre pedidos). */
  date: van.state(""),
  /** "home", "arrange" o "point:<nombre>". */
  delivery: van.state(""),
  address: Object.fromEntries(ADDRESS_KEYS.map((key) => [key, van.state("")])),
  notes: van.state(""),
  remember: van.state(true),
  website: van.state(""),
};

export const errors = van.state({});

export const status = van.state("idle");
export const submitError = van.state("");
/** Datos recordados de un pedido anterior: se muestran como tarjeta en vez del formulario. */
export const savedCustomer = van.state(null);
export const editingContact = van.state(false);
/** Comprobante del último pedido enviado (pantalla de éxito). */
export const receipt = van.state(null);

// Un id por intento de pedido: si se reintenta tras un error de red, el API no lo duplica.
let requestId = null;
const newRequestId = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, "0")).join("");

export const clearError = (key) => {
  if (errors.rawVal[key]) errors.val = { ...errors.rawVal, [key]: "" };
};

/** Formas de entrega que configuró el negocio, en el orden en que se muestran. */
export function deliveryOptions(business) {
  const points = (business.deliveryPoints ?? []).map((point) => ({ value: `${POINT_PREFIX}${point.name}`, type: "point", title: point.name, text: point.details ?? "" }));
  const areas = business.deliveryAreas ?? [];
  const home = business.homeDelivery
    ? [{ value: HOME, type: HOME, title: "A domicilio", text: areas.length ? `Solo en ${areas.map((area) => area.city).join(", ")}` : "Te lo llevamos a tu casa u oficina" }]
    : [];
  return [...points, ...home];
}

/** Si solo hay una forma de entrega (o ninguna), se elige sola. */
function syncDelivery(business) {
  const options = deliveryOptions(business);
  if (!options.length) form.delivery.val = ARRANGE;
  else if (!options.some((option) => option.value === form.delivery.rawVal)) form.delivery.val = options.length === 1 ? options[0].value : "";

  // Con una sola ciudad de cobertura, la ciudad y el estado quedan fijos.
  const areas = business.deliveryAreas ?? [];
  const area = areas.find((item) => item.city === form.address.city.rawVal);
  if (areas.length === 1) {
    form.address.city.val = areas[0].city;
    form.address.state.val = areas[0].state ?? "";
  } else if (areas.length > 1 && !area) {
    form.address.city.val = "";
    form.address.state.val = "";
  } else if (area) {
    form.address.state.val = area.state ?? "";
  }
}

/** Prepara el formulario cada vez que se abre: entrega válida y datos recordados. */
export function prepareCheckout(business) {
  syncDelivery(business);
}

function fillFrom(saved) {
  // El teléfono se guarda completo ("+524421234567"); el formulario lo separa en lada y 10 dígitos.
  const phone = splitPhone(saved.phone ?? "", saved.phoneCountry);
  savedCustomer.val = { ...saved, phone: `${dialOf(phone.country)}${phone.digits}`, phoneCountry: phone.country };
  for (const key of ["name", "email"]) if (!form[key].rawVal && saved[key]) form[key].val = saved[key];
  if (!form.phone.rawVal && phone.digits) {
    form.phone.val = phone.digits;
    form.phoneCountry.val = phone.country;
  }
  if (!form.delivery.rawVal && saved.delivery) form.delivery.val = saved.delivery;
  for (const key of ADDRESS_KEYS) if (!form.address[key].rawVal && saved.address?.[key]) form.address[key].val = saved.address[key];
}

loadCustomer().then((saved) => saved && fillFrom(saved));


/** Revisa todo el formulario en el navegador (el API vuelve a validar todo). Devuelve { campo: mensaje }. */
function collectErrors(business) {
  const next = {};
  const value = (state) => state.rawVal.trim();

  const name = value(form.name);
  if (name.length < 3) next.name = "Escribe tu nombre completo.";
  else if (!PATTERNS.PERSON_NAME.test(name)) next.name = "Usa solo letras en tu nombre (sin números ni símbolos).";
  else if (name.split(/\s+/).length < 2) next.name = "Escribe tu nombre y apellido.";
  else if (name.length > MAX.NAME) next.name = `Máximo ${MAX.NAME} caracteres.`;

  if (!form.phone.rawVal) next.phone = "Escribe tu teléfono.";
  else if (!/^\d+$/.test(form.phone.rawVal) || digitCount(form.phone.rawVal) !== PHONE_DIGITS) next.phone = `El teléfono debe tener ${PHONE_DIGITS} dígitos (llevas ${digitCount(form.phone.rawVal)}).`;

  const email = value(form.email);
  if (email && (!PATTERNS.EMAIL.test(email) || email.length > MAX.EMAIL)) next.email = "Escribe un correo válido, como nombre@correo.com.";

  if (!form.date.rawVal) next.date = "Selecciona el día de entrega";
  else if (form.date.rawVal < todayIso()) next.date = "Ese día ya pasó, selecciona otro";

  if (!form.delivery.rawVal) next.delivery = "Selecciona dónde lo recibes";
  if (form.delivery.rawVal === HOME) {
    const { address } = form;
    const placeError = (text, label) => (!PATTERNS.PLACE.test(text) ? `${label}: solo letras, números y . , # -` : "");

    const street = value(address.street);
    if (street.length < 3) next.street = "Escribe la calle.";
    else if (placeError(street, "Calle")) next.street = placeError(street, "Calle");

    const exterior = value(address.exterior);
    if (!exterior) next.exterior = "Falta el número.";
    else if (!PATTERNS.HOUSE_NUMBER.test(exterior)) next.exterior = "Solo letras y números.";
    if (!PATTERNS.HOUSE_NUMBER.test(value(address.interior))) next.interior = "Solo letras y números.";

    const neighborhood = value(address.neighborhood);
    if (neighborhood.length < 2) next.neighborhood = "Escribe la colonia.";
    else if (placeError(neighborhood, "Colonia")) next.neighborhood = placeError(neighborhood, "Colonia");

    const postalCode = value(address.postalCode);
    if (postalCode && !PATTERNS.POSTAL_CODE.test(postalCode)) next.postalCode = "Código postal de 5 dígitos.";

    const city = value(address.city);
    if (!city) next.city = (business.deliveryAreas ?? []).length ? "Elige tu ciudad." : "Escribe tu ciudad.";
    else if (!PATTERNS.PLACE.test(city)) next.city = "Solo letras.";
    if (!PATTERNS.PLACE.test(value(address.state))) next.state = "Solo letras.";
  }

  return next;
}

/** Muestra los errores (todos, o solo los de `keys`) y devuelve el primer campo con error. */
function showErrors(next, keys) {
  const shown = keys ? Object.fromEntries(Object.entries(next).filter(([key]) => keys.includes(key))) : next;
  errors.val = shown;
  const first = Object.keys(shown)[0];
  // Los datos recordados con algún error se abren para corregirlos.
  if (STEP_FIELDS.contact.includes(first)) editingContact.val = true;
  return first;
}

const validate = (business) => showErrors(collectErrors(business));

// ── Pasos del pedido ─────────────────────────────────────────────────────────────────────────────
// Una pregunta por pantalla: tus datos → fecha → entrega → notas → resumen. En celular no hay que
// recorrer un formulario largo; cada paso se valida antes de avanzar.

/** Campos que se revisan en cada paso (los ids son los mismos que usa `errors`). */
const STEP_FIELDS = {
  contact: ["name", "phone", "email"],
  date: ["date"],
  delivery: ["delivery", "street", "exterior", "interior", "neighborhood", "postalCode", "city", "state"],
  notes: [],
  review: [],
};

/** Pasos de este negocio: sin formas de entrega configuradas no se pregunta dónde (se coordina después). */
export const checkoutSteps = (business) => ["contact", "date", ...(deliveryOptions(business).length ? ["delivery"] : []), "notes", "review"];

export const step = van.state("contact");
/** 1 al avanzar, -1 al regresar: decide hacia dónde se desliza la pantalla. */
export const stepDirection = van.state(1);
/** Se llegó a un paso desde «Cambiar» en el resumen: al continuar se vuelve directo al resumen. */
export const editingFromReview = van.state(false);

/** Paso donde se corrige un campo (para llevar ahí al cliente si el API o la validación final lo rechaza). */
const stepOfField = (key) => Object.keys(STEP_FIELDS).find((name) => STEP_FIELDS[name].includes(key)) ?? "review";

export function goToStep(name, direction = 1) {
  stepDirection.val = direction;
  step.val = name;
}

/** Valida el paso actual y pasa al siguiente. Devuelve el primer campo con error, o null. */
export function nextStep(business) {
  const steps = checkoutSteps(business);
  const current = step.rawVal;
  const invalid = showErrors(collectErrors(business), STEP_FIELDS[current] ?? []);
  if (invalid) return invalid;
  if (editingFromReview.rawVal) {
    editingFromReview.val = false;
    goToStep("review");
    return null;
  }
  goToStep(steps[Math.min(steps.indexOf(current) + 1, steps.length - 1)]);
  return null;
}

/** Regresa un paso. Devuelve false si ya estaba en el primero (entonces se vuelve al carrito). */
export function previousStep(business) {
  const steps = checkoutSteps(business);
  const index = steps.indexOf(step.rawVal);
  if (editingFromReview.rawVal) {
    editingFromReview.val = false;
    goToStep("review", -1);
    return true;
  }
  if (index <= 0) return false;
  errors.val = {};
  goToStep(steps[index - 1], -1);
  return true;
}

/** «Cambiar» desde el resumen. */
export function editStep(name) {
  editingFromReview.val = true;
  if (name === "contact") editingContact.val = true;
  goToStep(name, -1);
}

// Cada vez que se entra a los datos del pedido se empieza desde el principio. Con datos recordados
// se salta «Tus datos» (se ven y se cambian desde el resumen).
let previousView = cartView.rawVal;
van.derive(() => {
  const view = cartView.val;
  if (view === "checkout" && previousView !== "checkout") {
    errors.val = {};
    editingFromReview.val = false;
    stepDirection.val = 1;
    step.val = savedCustomer.rawVal && !editingContact.rawVal ? "date" : "contact";
  }
  previousView = view;
});

function buildPayload(lines) {
  const delivery = form.delivery.rawVal;
  const address = Object.fromEntries(ADDRESS_KEYS.map((key) => [key, form.address[key].rawVal.trim()]));
  return {
    requestId,
    customer: { name: form.name.rawVal.trim(), phone: `${dialOf(form.phoneCountry.rawVal)}${form.phone.rawVal}`, email: form.email.rawVal.trim() },
    deliveryDate: form.date.rawVal,
    delivery: delivery.startsWith(POINT_PREFIX)
      ? { type: "point", point: delivery.slice(POINT_PREFIX.length) }
      : delivery === HOME
        ? { type: HOME, address }
        : { type: ARRANGE },
    items: lines.map((line) => ({ productId: line.productId, quantity: line.quantity, choices: line.choices ?? [], note: line.note ?? "" })),
    notes: form.notes.rawVal.trim(),
    website: form.website.rawVal,
  };
}

/** Entrega elegida en palabras, para el resumen antes de confirmar. */
export const deliveryText = () => describeDelivery(buildPayload([]));

/** Resumen legible de la entrega para la pantalla de éxito. */
function describeDelivery(payload) {
  if (payload.delivery.type === "point") return payload.delivery.point;
  if (payload.delivery.type === HOME) {
    const { street, exterior, interior, neighborhood, city } = payload.delivery.address;
    return [[street, exterior && `#${exterior}`, interior && `int. ${interior}`].filter(Boolean).join(" "), neighborhood, city].filter(Boolean).join(", ");
  }
  return "Te contactaremos para coordinar la entrega";
}

async function rememberOrForget(payload) {
  if (!form.remember.rawVal) {
    savedCustomer.val = null;
    resetOrders(); // sin perfil guardado no hay «Mis pedidos»
    return forgetCustomer();
  }
  const saved = { ...payload.customer, phoneCountry: form.phoneCountry.rawVal, delivery: form.delivery.rawVal, address: payload.delivery.address ?? savedCustomer.rawVal?.address ?? null };
  savedCustomer.val = saved;
  editingContact.val = false;
  return saveCustomer(saved);
}

/** Envía el pedido. Devuelve el id del primer campo inválido, o null. */
export async function submitOrder(business, lines) {
  const locale = business.locale;
  if (status.rawVal === "sending") return null;
  submitError.val = "";
  const invalid = validate(business);
  if (invalid) {
    // Algo quedó mal en un paso anterior: se lleva al cliente a ese paso para corregirlo.
    editingFromReview.val = true;
    goToStep(stepOfField(invalid), -1);
    return invalid;
  }

  if (IS_PREVIEW) {
    submitError.val = "Estás en la vista previa: aquí los pedidos no se envían.";
    return null;
  }

  requestId ??= newRequestId();
  const payload = buildPayload(lines);
  status.val = "sending";
  try {
    const result = await apiClient.post("/orders", payload);
    receipt.val = {
      ...result,
      name: payload.customer.name.split(/\s+/)[0],
      phone: formatPhone(payload.customer.phone),
      delivery: describeDelivery(payload),
      date: formatLongDate(payload.deliveryDate, locale),
      itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
      // Lo que pidió, para mostrarlo en la confirmación (el carrito se vacía enseguida).
      items: lines.map((line) => ({ name: line.product.name, quantity: line.quantity, imageUrl: line.product.imageUrl ?? "", subtotal: line.unitPrice * line.quantity })),
    };
    await rememberOrForget(payload);
    // «Mis pedidos» se lee del API: el pedido nuevo aparece la próxima vez que se abra.
    invalidateOrders();
    requestId = null;
    form.notes.val = "";
    form.date.val = "";
    cartView.val = "done";
    clearCart();
  } catch (error) {
    submitError.val =
      error.status === 0
        ? "No pudimos conectar. Revisa tu internet e inténtalo de nuevo: tu pedido no se duplicará."
        : error.status === 429
          ? "Hiciste muchos intentos seguidos. Espera unos minutos e inténtalo de nuevo."
          : error.status >= 500
            ? "Tuvimos un problema al recibir tu pedido. Inténtalo de nuevo en un momento: no se duplicará."
            : error.message;
    // Si el carrito quedó viejo o los datos cambiaron, el siguiente intento es un pedido nuevo.
    if (error.status >= 400 && error.status < 500) requestId = null;
  } finally {
    status.val = "idle";
  }
  return null;
}

/** «No soy yo / borrar mis datos»: limpia el formulario y lo guardado en este navegador. */
export function forgetMe(business) {
  for (const key of ["name", "phone", "email"]) form[key].val = "";
  form.phoneCountry.val = "MX";
  for (const key of ADDRESS_KEYS) form.address[key].val = "";
  form.delivery.val = "";
  savedCustomer.val = null;
  editingContact.val = true;
  syncDelivery(business);
  resetOrders();
  forgetCustomer();
}

export const DELIVERY = { HOME, ARRANGE };
