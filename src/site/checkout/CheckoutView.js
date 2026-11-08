// «Realizar pedido»: datos del cliente, dónde lo recibe y confirmación. Vive dentro del panel del carrito.
// Los campos leen y escriben estados del módulo (checkoutStore): este componente puede redibujarse
// sin perder lo escrito, y nada aquí lee `.val` fuera de funciones reactivas.
import van from "vanjs-core";
import Icon from "../../ui/Icon.js";
import { formatPrice } from "../../core/format.js";
import { IS_PREVIEW } from "../../core/previewChannel.js";
import { MAX, PHONE_COUNTRIES, PHONE_DIGITS, dialOf, filters, formatPhone } from "../../core/textRules.js";
import { cartView, getCartCount, getCartTotal } from "../cart/cartStore.js";
import DatePicker from "./DatePicker.js";
import DrawerHeader from "../cart/DrawerHeader.js";
import {
  DELIVERY,
  clearError,
  deliveryOptions,
  editingContact,
  errors,
  forgetMe,
  form,
  prepareCheckout,
  savedCustomer,
  status,
  submitError,
  submitOrder,
} from "./checkoutStore.js";

const { form: formTag, div, section, h3, label, span, input, textarea, select, option, p, button, ul, li } = van.tags;

const RADIUS = "rounded-[min(var(--site-radius),0.75rem)]";
const INPUT = `w-full ${RADIUS} border bg-background px-3.5 py-2.5 text-base text-foreground outline-none transition placeholder:text-muted focus:border-foreground/50 sm:text-sm`;
const inputClass = (key) => () => `${INPUT} ${errors.val[key] ? "border-red-500" : "border-foreground/15"}`;

const FieldError = (key) => () =>
  errors.val[key] ? p({ class: "mt-1.5 text-xs font-medium text-red-600", role: "alert" }, errors.val[key]) : span({ hidden: true });

const FieldLabel = (text, optional) =>
  span(
    { class: "mb-1.5 flex items-baseline justify-between gap-2 text-sm font-medium text-foreground" },
    text,
    optional ? span({ class: "text-xs font-normal text-muted" }, "Opcional") : null,
  );

/**
 * Campo de texto ligado a un estado. `key` identifica el error y el lugar al que se hace scroll.
 * `filter` quita al escribir los caracteres que no se aceptan (también al pegar).
 */
function Field(key, state, { label: text, optional = false, multiline = false, filter = filters.safeText, ...attrs }) {
  const control = (multiline ? textarea : input)({
    ...attrs,
    ...(multiline ? { rows: 2 } : { type: attrs.type ?? "text" }),
    value: () => state.val,
    oninput: (event) => {
      const clean = filter(event.target.value);
      if (clean !== event.target.value) event.target.value = clean;
      state.val = clean;
      clearError(key);
    },
    "aria-invalid": () => String(Boolean(errors.val[key])),
    class: multiline ? () => `${inputClass(key)()} resize-y` : inputClass(key),
  });
  return label({ class: "block", "data-field": key }, FieldLabel(text, optional), control, FieldError(key));
}

const SectionTitle = (title) => h3({ class: "text-xs font-semibold tracking-[0.16em] text-muted uppercase" }, title);
const Section = (title, ...children) => section({ class: "space-y-3" }, SectionTitle(title), ...children);

function SavedContact(business) {
  return div(
    { class: `flex items-start gap-3 ${RADIUS} border border-foreground/10 bg-surface/60 p-4` },
    span({ class: "grid size-10 shrink-0 place-items-center rounded-full bg-accent/10 text-accent" }, Icon("user", "size-5")),
    div(
      { class: "min-w-0 flex-1" },
      p({ class: "truncate font-semibold text-foreground" }, () => form.name.val),
      p({ class: "truncate text-sm text-muted" }, () =>
        [form.phone.val && formatPhone(`${dialOf(form.phoneCountry.val)}${form.phone.val}`), form.email.val].filter(Boolean).join(" · "),
      ),
      button({ type: "button", onclick: () => forgetMe(business), class: "mt-1 text-xs text-muted underline-offset-2 hover:text-foreground hover:underline" }, "No soy yo"),
    ),
    button({ type: "button", onclick: () => (editingContact.val = true), class: "shrink-0 text-sm font-semibold text-accent hover:underline" }, "Cambiar"),
  );
}

/**
 * Teléfono: lada (México por defecto, EE. UU. o Canadá) + exactamente 10 dígitos, solo números.
 * El selector muestra «MX +52»; al abrirlo, el nombre del país.
 */
function PhoneField() {
  const countrySelect = select(
    {
      "aria-label": "Lada del país",
      onchange: (event) => (form.phoneCountry.val = event.target.value),
      class: () =>
        `${RADIUS} shrink-0 border bg-surface/60 py-2.5 pr-7 pl-3 text-base font-medium text-foreground outline-none transition focus:border-foreground/50 sm:text-sm ${
          errors.val.phone ? "border-red-500" : "border-foreground/15"
        }`,
    },
    PHONE_COUNTRIES.map((country) =>
      option({ value: country.code, selected: () => form.phoneCountry.val === country.code, title: country.name }, `${country.code} ${country.dial}`),
    ),
  );
  const number = input({
    type: "tel",
    inputmode: "numeric",
    autocomplete: "tel-national",
    maxlength: PHONE_DIGITS,
    placeholder: "10 dígitos",
    "aria-label": "Teléfono (10 dígitos)",
    "aria-invalid": () => String(Boolean(errors.val.phone)),
    value: () => form.phone.val,
    oninput: (event) => {
      // Solo números y como máximo 10 (también al pegar «+52 442 123 4567»: se queda con los últimos 10).
      let digits = filters.digits(event.target.value);
      if (digits.length > PHONE_DIGITS) digits = digits.slice(-PHONE_DIGITS);
      if (digits !== event.target.value) event.target.value = digits;
      form.phone.val = digits;
      clearError("phone");
    },
    class: () => `${inputClass("phone")()} min-w-0 flex-1 tabular-nums tracking-wide`,
  });

  return div(
    { class: "block", "data-field": "phone" },
    FieldLabel("Teléfono"),
    div({ class: "flex gap-2" }, countrySelect, number),
    () =>
      errors.val.phone
        ? p({ class: "mt-1.5 text-xs font-medium text-red-600", role: "alert" }, errors.val.phone)
        : p({ class: "mt-1.5 text-xs text-muted" }, () => `${form.phone.val.length}/${PHONE_DIGITS} dígitos`),
  );
}

const ContactFields = () =>
  div(
    { class: "space-y-3" },
    Field("name", form.name, { label: "Nombre completo", autocomplete: "name", maxlength: MAX.NAME, placeholder: "Nombre y apellido", filter: filters.personName }),
    div(
      { class: "grid gap-3 sm:grid-cols-2" },
      PhoneField(),
      Field("email", form.email, { label: "Correo", type: "email", inputmode: "email", autocomplete: "email", maxlength: MAX.EMAIL, optional: true, placeholder: "tu@correo.com", filter: filters.email }),
    ),
  );

const ContactSection = (business) =>
  Section("Tus datos", () => (savedCustomer.val && !editingContact.val ? SavedContact(business) : ContactFields()));

function CityField(business) {
  const areas = business.deliveryAreas ?? [];
  if (areas.length === 1) {
    const [area] = areas;
    return div(
      { class: `flex items-center gap-2 ${RADIUS} bg-accent/5 px-3.5 py-2.5 text-sm text-foreground/80` },
      Icon("pin", "size-4 shrink-0 text-accent"),
      span(span({ class: "font-medium text-foreground" }, [area.city, area.state].filter(Boolean).join(", ")), " · por ahora solo entregamos aquí"),
    );
  }

  if (areas.length > 1) {
    return label(
      { class: "block", "data-field": "city" },
      FieldLabel("Ciudad"),
      select(
        {
          class: inputClass("city"),
          autocomplete: "address-level2",
          onchange: (event) => {
            const area = areas[Number(event.target.value)];
            form.address.city.val = area?.city ?? "";
            form.address.state.val = area?.state ?? "";
            clearError("city");
          },
        },
        option({ value: "", disabled: true, selected: () => !form.address.city.val }, "Elige tu ciudad"),
        areas.map((area, index) =>
          option({ value: index, selected: () => form.address.city.val === area.city }, [area.city, area.state].filter(Boolean).join(", ")),
        ),
      ),
      FieldError("city"),
    );
  }

  return div(
    { class: "grid grid-cols-2 gap-3" },
    Field("city", form.address.city, { label: "Ciudad", autocomplete: "address-level2", maxlength: MAX.CITY, filter: filters.place }),
    Field("state", form.address.state, { label: "Estado", autocomplete: "address-level1", maxlength: MAX.CITY, filter: filters.place }),
  );
}

function AddressFields(business) {
  const { address } = form;
  return div(
    { class: `space-y-3 ${RADIUS} border border-foreground/10 p-4 animate-fade-down` },
    Field("street", address.street, { label: "Calle", autocomplete: "address-line1", maxlength: MAX.STREET, placeholder: "Av. Constituyentes", filter: filters.place }),
    div(
      { class: "grid grid-cols-2 gap-3" },
      Field("exterior", address.exterior, { label: "Núm. exterior", maxlength: MAX.HOUSE_NUMBER, placeholder: "123", filter: filters.houseNumber }),
      Field("interior", address.interior, { label: "Núm. interior", optional: true, maxlength: MAX.HOUSE_NUMBER, placeholder: "Depto 4", filter: filters.houseNumber }),
    ),
    div(
      { class: "grid grid-cols-[1fr_7rem] gap-3" },
      Field("neighborhood", address.neighborhood, { label: "Colonia", maxlength: MAX.NEIGHBORHOOD, autocomplete: "address-level3", filter: filters.place }),
      Field("postalCode", address.postalCode, { label: "C.P.", optional: true, inputmode: "numeric", autocomplete: "postal-code", maxlength: MAX.POSTAL_CODE, filter: filters.digits }),
    ),
    CityField(business),
    Field("references", address.references, { label: "Referencias", optional: true, multiline: true, maxlength: MAX.REFERENCES, placeholder: "Entre calles, color de la fachada…" }),
  );
}

function DeliveryOption(choice) {
  const isSelected = () => form.delivery.val === choice.value;
  return button(
    {
      type: "button",
      role: "radio",
      "aria-checked": () => String(isSelected()),
      onclick: () => {
        form.delivery.val = choice.value;
        clearError("delivery");
      },
      class: () =>
        `flex w-full items-start gap-3 ${RADIUS} border p-3.5 text-left transition ${
          isSelected()
            ? "border-primary bg-primary/[0.04] ring-1 ring-primary"
            : errors.val.delivery
              ? "border-red-500 bg-red-500/5"
              : "border-foreground/15 hover:border-foreground/40"
        }`,
    },
    span(
      { class: () => `mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 transition ${isSelected() ? "border-primary" : "border-foreground/25"}` },
      span({ class: () => `size-2.5 rounded-full bg-primary transition ${isSelected() ? "scale-100" : "scale-0"}` }),
    ),
    div(
      { class: "min-w-0 flex-1" },
      p({ class: "flex items-center gap-1.5 text-sm font-semibold text-foreground" }, Icon(choice.type === DELIVERY.HOME ? "home" : "pin", "size-4 shrink-0 text-accent"), choice.title),
      choice.text ? p({ class: "mt-0.5 text-xs text-muted" }, choice.text) : null,
    ),
  );
}

/** Sección obligatoria: `data-field` para llevar al cliente aquí si falta, y el aviso en rojo debajo. */
const RequiredSection = (key, title, ...children) => section({ class: "scroll-mt-4 space-y-3", "data-field": key }, SectionTitle(title), ...children, FieldError(key));

function DeliverySection(business) {
  const choices = deliveryOptions(business);
  if (!choices.length) {
    return Section("Entrega", p({ class: "text-sm text-foreground/75" }, "Te contactaremos para coordinar dónde entregarte."));
  }
  return RequiredSection(
    "delivery",
    "¿Dónde lo recibes?",
    div({ role: "radiogroup", "aria-label": "Lugar de entrega", class: "space-y-2" }, choices.map(DeliveryOption)),
    () => (form.delivery.val === DELIVERY.HOME ? AddressFields(business) : span({ hidden: true })),
  );
}

const DateSection = (business) =>
  RequiredSection(
    "date",
    "¿Para cuándo lo quieres?",
    DatePicker(form.date, { locale: business.locale, onChange: () => clearError("date"), hasError: () => Boolean(errors.val.date) }),
  );

function Summary(business, lines) {
  const approximate = lines.some((line) => line.product.priceFrom);
  return Section(
    `Tu pedido (${getCartCount(lines)})`,
    div(
      { class: `${RADIUS} bg-surface/60 p-4` },
      ul(
        { class: "space-y-1.5 text-sm" },
        lines.map((line) =>
          li(
            { class: "flex justify-between gap-3" },
            span({ class: "min-w-0 truncate text-foreground/80" }, `${line.quantity} × ${line.product.name}`),
            span({ class: "shrink-0 text-foreground/80 tabular-nums" }, formatPrice(business, line.unitPrice * line.quantity)),
          ),
        ),
      ),
      div(
        { class: "mt-3 flex items-baseline justify-between border-t border-foreground/10 pt-3" },
        span({ class: "text-sm font-medium text-foreground" }, approximate ? "Total aproximado" : "Total"),
        span({ class: "text-lg font-semibold text-foreground tabular-nums" }, formatPrice(business, getCartTotal(lines))),
      ),
      approximate ? p({ class: "mt-1 text-xs text-muted" }, "Algunos precios son «desde»: te confirmamos el total.") : null,
    ),
  );
}

// Campo trampa para bots: invisible para personas y lectores de pantalla.
const Honeypot = () =>
  div(
    { "aria-hidden": "true", class: "pointer-events-none absolute -left-[9999px] size-px overflow-hidden" },
    input({ type: "text", name: "website", tabindex: -1, autocomplete: "off", oninput: (event) => (form.website.val = event.target.value) }),
  );

/** Lleva al cliente al primer dato pendiente (sube hasta la sección y, si es un campo de texto, lo enfoca). */
function focusField(container, key) {
  const target = container.querySelector(`[data-field="${CSS.escape(key)}"]`);
  if (!target) return;
  const isChoice = key === "date" || key === "delivery";
  target.scrollIntoView({ behavior: "smooth", block: isChoice ? "start" : "center" });
  if (!isChoice) target.querySelector("input, select, textarea")?.focus({ preventScroll: true });
}

export default function CheckoutView(site, lines) {
  const { business } = site;
  prepareCheckout(business);
  const total = formatPrice(business, getCartTotal(lines));
  const isSending = () => status.val === "sending";

  const body = div(
    { class: "flex-1 space-y-7 overflow-y-auto overscroll-contain px-5 py-6" },
    ContactSection(business),
    DateSection(business),
    DeliverySection(business),
    Section("Notas", Field("notes", form.notes, { label: "¿Algo que debamos saber?", optional: true, multiline: true, maxlength: MAX.NOTES, placeholder: "Horario para recibir, para quién es…" })),
    Summary(business, lines),
    label(
      { class: "flex cursor-pointer items-start gap-3 text-sm" },
      input({ type: "checkbox", checked: form.remember.rawVal, onchange: (event) => (form.remember.val = event.target.checked), class: "mt-0.5 size-4 shrink-0 accent-[var(--color-primary)]" }),
      span(
        span({ class: "block font-medium text-foreground" }, "Recordar mis datos en este dispositivo"),
        span({ class: "block text-xs text-muted" }, "Se guardan cifrados solo en este navegador. Así no los vuelves a escribir y, con tu correo, puedes ver tus pedidos en «Mis pedidos»."),
      ),
    ),
    Honeypot(),
  );

  return formTag(
    {
      class: "flex h-full flex-col",
      novalidate: true,
      onsubmit: async (event) => {
        event.preventDefault();
        const invalid = await submitOrder(business, lines);
        if (invalid) requestAnimationFrame(() => focusField(body, invalid));
      },
    },
    DrawerHeader("Datos del pedido", { onBack: () => (cartView.val = "cart") }),
    body,
    div(
      { class: "space-y-3 border-t border-foreground/10 bg-surface/60 p-5" },
      () =>
        submitError.val
          ? p({ role: "alert", class: `${RADIUS} border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-700` }, submitError.val)
          : span({ hidden: true }),
      button(
        { type: "submit", disabled: isSending, class: "btn-primary w-full py-3.5 text-base disabled:cursor-wait disabled:opacity-70" },
        () =>
          isSending()
            ? span({ class: "inline-flex items-center gap-2" }, Icon("loader", "size-5 animate-spin"), "Enviando tu pedido…")
            : span({ class: "inline-flex items-center gap-2" }, "Confirmar pedido", span({ class: "font-normal opacity-80 tabular-nums" }, `· ${total}`)),
      ),
      p(
        { class: "flex items-center justify-center gap-1.5 text-center text-xs text-muted" },
        Icon("lock", "size-3.5 shrink-0"),
        IS_PREVIEW ? "Vista previa: los pedidos no se envían." : "Tus datos solo se usan para entregarte tu pedido.",
      ),
    ),
  );
}
