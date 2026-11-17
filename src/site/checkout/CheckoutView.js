// «Realizar pedido» en pasos cortos: tus datos → ¿para cuándo? → ¿dónde? → notas → resumen y confirmar.
// Vive dentro del panel del carrito. Una pregunta por pantalla para que en celular no sea un formulario largo.
// Los campos leen y escriben estados del módulo (checkoutStore): este componente puede redibujarse
// sin perder lo escrito, y nada aquí lee `.val` fuera de funciones reactivas.
import van from "vanjs-core";
import Icon from "../../ui/Icon.js";
import { formatPrice } from "../../core/format.js";
import { imageProps } from "../../core/image.js";
import { IS_PREVIEW } from "../../core/previewChannel.js";
import { MAX, PHONE_COUNTRIES, PHONE_DIGITS, dialOf, filters, formatPhone } from "../../core/textRules.js";
import { cartView, getCartCount, getCartDeposit, getCartTotal } from "../cart/cartStore.js";
import DatePicker, { formatLongDate } from "./DatePicker.js";
import DrawerHeader from "../cart/DrawerHeader.js";
import {
  DELIVERY,
  checkoutSteps,
  clearError,
  deliveryOptions,
  deliveryText,
  editStep,
  editingContact,
  editingFromReview,
  errors,
  forgetMe,
  form,
  nextStep,
  prepareCheckout,
  previousStep,
  savedCustomer,
  status,
  step,
  stepDirection,
  submitError,
  submitOrder,
} from "./checkoutStore.js";

const { form: formTag, div, section, h3, label, span, input, textarea, select, option, p, button, ul, li, img } = van.tags;

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

const ContactSection = (business) => div(() => (savedCustomer.val && !editingContact.val ? SavedContact(business) : ContactFields()));

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
const RequiredSection = (key, ...children) => section({ class: "scroll-mt-4 space-y-3", "data-field": key }, ...children, FieldError(key));

function DeliverySection(business) {
  const choices = deliveryOptions(business);
  return RequiredSection(
    "delivery",
    div({ role: "radiogroup", "aria-label": "Lugar de entrega", class: "space-y-2" }, choices.map(DeliveryOption)),
    () => (form.delivery.val === DELIVERY.HOME ? AddressFields(business) : span({ hidden: true })),
  );
}

const DateSection = (business) =>
  RequiredSection(
    "date",
    DatePicker(form.date, { locale: business.locale, onChange: () => clearError("date"), hasError: () => Boolean(errors.val.date) }),
  );

function Summary(business, lines) {
  const approximate = lines.some((line) => line.product.priceFrom);
  return Section(
    `Productos (${getCartCount(lines)})`,
    div(
      { class: `${RADIUS} bg-surface/60 p-4` },
      ul(
        { class: "space-y-3 text-sm" },
        lines.map((line) =>
          li(
            { class: "flex items-center gap-3" },
            div(
              { class: "size-12 shrink-0 overflow-hidden rounded-[min(var(--site-radius),0.5rem)] bg-surface ring-1 ring-foreground/5" },
              line.product.imageUrl ? img({ ...imageProps(line.product.imageUrl, { sizes: "3rem", widths: [160] }), alt: "", class: "size-full object-cover" }) : null,
            ),
            span({ class: "min-w-0 flex-1 text-foreground" }, span({ class: "font-medium" }, line.product.name), span({ class: "text-muted" }, ` × ${line.quantity}`)),
            span({ class: "shrink-0 font-medium text-foreground tabular-nums" }, formatPrice(business, line.unitPrice * line.quantity)),
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
    DepositNotice(business, lines),
  );
}

/** Aviso antes de enviar: este pedido se aparta con anticipo. Sin sorpresas al terminar. */
function DepositNotice(business, lines) {
  const deposit = getCartDeposit(lines, business);
  if (!(deposit > 0)) return null;
  const hours = business.payment.depositHours ?? 24;
  const names = lines.filter((line) => line.product.depositType && line.product.depositType !== "none").map((line) => line.product.name);
  return div(
    { class: `mt-3 ${RADIUS} border border-accent/30 bg-accent/5 p-4` },
    div(
      { class: "flex items-start gap-3" },
      span({ class: "grid size-9 shrink-0 place-items-center rounded-full bg-accent/15 text-accent" }, Icon("card", "size-4")),
      div(
        { class: "min-w-0 flex-1" },
        div(
          { class: "flex flex-wrap items-baseline justify-between gap-x-3" },
          p({ class: "text-sm font-semibold text-foreground" }, "Anticipo para apartar"),
          p({ class: "font-heading text-xl font-medium text-accent tabular-nums" }, formatPrice(business, deposit)),
        ),
        p(
          { class: "mt-1 text-xs leading-relaxed text-foreground/75" },
          `${[...new Set(names)].join(", ")} se prepara${names.length > 1 ? "n" : ""} por encargo. Al enviar verás los datos para transferir; tienes ${hours < 24 ? `${hours} horas` : hours === 24 ? "24 horas" : `${hours / 24} días`} para pagar el anticipo. El resto (${formatPrice(business, getCartTotal(lines) - deposit)}) lo pagas al recibir.`,
        ),
      ),
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

// ── Pasos ─────────────────────────────────────────────────────────────────────────────────────────

const STEPS = {
  contact: { label: "Tus datos", title: "¿A nombre de quién va?", hint: "Te escribimos a este teléfono para confirmar tu pedido." },
  date: { label: "Fecha", title: "¿Para cuándo lo quieres?", hint: "Elige el día en que quieres recibirlo." },
  delivery: { label: "Entrega", title: "¿Dónde lo recibes?", hint: "Elige cómo te lo entregamos." },
  notes: { label: "Notas", title: "¿Algo que debamos saber?", hint: "Horario para recibir, para quién es, un mensaje especial… Es opcional." },
  review: { label: "Confirmar", title: "Revisa tu pedido", hint: "Si todo está bien, confírmalo. Puedes cambiar cualquier dato." },
};

const currentStep = (steps) => (steps.includes(step.val) ? step.val : steps[0]);

/** Barra de avance: un segmento por paso, más «Paso 2 de 5 · Fecha». */
const Progress = (steps) =>
  div(
    { class: "border-b border-foreground/10 px-5 pt-3 pb-3.5" },
    div(
      { class: "flex gap-1.5", role: "progressbar", "aria-valuemin": 1, "aria-valuemax": steps.length, "aria-valuenow": () => steps.indexOf(currentStep(steps)) + 1 },
      steps.map((_, index) =>
        span({ class: () => `h-1 flex-1 rounded-full transition-colors duration-500 ${index <= steps.indexOf(currentStep(steps)) ? "bg-primary" : "bg-foreground/10"}` }),
      ),
    ),
    p({ class: "mt-2 text-xs font-medium text-muted" }, () => {
      const name = currentStep(steps);
      return `Paso ${steps.indexOf(name) + 1} de ${steps.length} · ${STEPS[name].label}`;
    }),
  );

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

/** Renglón del resumen: qué es, el dato y «Cambiar» para volver a ese paso. */
const ReviewRow = (icon, title, value, onEdit) =>
  div(
    { class: "flex items-start gap-3 py-3.5" },
    span({ class: "grid size-9 shrink-0 place-items-center rounded-full bg-accent/10 text-accent" }, Icon(icon, "size-4")),
    div({ class: "min-w-0 flex-1" }, p({ class: "text-xs text-muted" }, title), div({ class: "mt-0.5 text-sm font-medium break-words text-foreground" }, value)),
    onEdit
      ? button({ type: "button", onclick: onEdit, "aria-label": `Cambiar ${title.toLowerCase()}`, class: "shrink-0 py-1 text-sm font-semibold text-accent hover:underline" }, "Cambiar")
      : null,
  );

/** La «cartita» final: a nombre de quién, cuándo, dónde, notas, productos y total. Lee `rawVal`: se arma al entrar al paso. */
function ReviewStep(business, lines, steps) {
  const phone = form.phone.rawVal && formatPhone(`${dialOf(form.phoneCountry.rawVal)}${form.phone.rawVal}`);
  const notes = form.notes.rawVal.trim();
  return div(
    { class: "space-y-6" },
    div(
      { class: `divide-y divide-foreground/10 ${RADIUS} border border-foreground/10 bg-background px-4 shadow-sm` },
      ReviewRow(
        "user",
        "A nombre de",
        [p(form.name.rawVal.trim()), p({ class: "font-normal text-muted" }, [phone, form.email.rawVal.trim()].filter(Boolean).join(" · "))],
        () => editStep("contact"),
      ),
      ReviewRow("calendar", "Lo recibes el", capitalize(formatLongDate(form.date.rawVal, business.locale)), () => editStep("date")),
      ReviewRow("pin", "Entrega", deliveryText(), steps.includes("delivery") ? () => editStep("delivery") : null),
      ReviewRow("chat", "Notas", notes || span({ class: "font-normal text-muted" }, "Sin notas"), () => editStep("notes")),
    ),
    Summary(business, lines),
    label(
      { class: "flex cursor-pointer items-start gap-3 text-sm" },
      input({ type: "checkbox", checked: form.remember.rawVal, onchange: (event) => (form.remember.val = event.target.checked), class: "mt-0.5 size-4 shrink-0 accent-[var(--color-primary)]" }),
      span(
        span({ class: "block font-medium text-foreground" }, "Recordar mis datos en este dispositivo"),
        span({ class: "block text-xs text-muted" }, "Se guardan cifrados solo en este navegador. Así no los vuelves a escribir y, con tu correo, puedes ver tus pedidos en «Mis pedidos»."),
      ),
    ),
  );
}

function StepContent(name, business, lines, steps) {
  if (name === "contact") return ContactSection(business);
  if (name === "date") return DateSection(business);
  if (name === "delivery") return DeliverySection(business);
  if (name === "notes")
    return Field("notes", form.notes, { label: "Notas para el negocio", optional: true, multiline: true, maxlength: MAX.NOTES, placeholder: "Ej. Entregar después de las 4 p.m., es para mi mamá…" });
  return ReviewStep(business, lines, steps);
}

export default function CheckoutView(site, lines) {
  const { business } = site;
  prepareCheckout(business);
  const steps = checkoutSteps(business);
  const total = formatPrice(business, getCartTotal(lines));
  const count = getCartCount(lines);
  const isSending = () => status.val === "sending";
  const isReview = () => currentStep(steps) === "review";

  const body = div({ class: "flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-5 py-6" });
  van.add(body, () => {
    const name = currentStep(steps);
    const meta = STEPS[name];
    const heading = h3({ tabindex: -1, class: "font-heading text-2xl font-medium text-balance text-foreground outline-none" }, meta.title);
    const view = div(
      { class: stepDirection.rawVal < 0 ? "animate-step-back" : "animate-step-next" },
      heading,
      p({ class: "mt-1.5 mb-6 text-sm text-muted" }, meta.hint),
      StepContent(name, business, lines, steps),
    );
    // Cada paso empieza arriba y el lector de pantalla anuncia la nueva pregunta.
    setTimeout(() => {
      body.scrollTop = 0;
      if (heading.isConnected && (body.contains(document.activeElement) || document.activeElement === document.body)) heading.focus({ preventScroll: true });
    });
    return view;
  });

  const showInvalid = (invalid) => invalid && setTimeout(() => focusField(body, invalid), 60);

  const primaryLabel = () => {
    if (isSending()) return span({ class: "inline-flex items-center gap-2" }, Icon("loader", "size-5 animate-spin"), "Enviando tu pedido…");
    if (isReview()) return span({ class: "inline-flex items-center gap-2" }, "Confirmar pedido", span({ class: "font-normal opacity-80 tabular-nums" }, `· ${total}`));
    if (editingFromReview.val) return span({ class: "inline-flex items-center gap-2" }, "Guardar y volver al resumen");
    const skip = currentStep(steps) === "notes" && !form.notes.val.trim();
    return span({ class: "inline-flex items-center gap-2" }, skip ? "Omitir" : "Continuar", Icon("arrowRight", "size-5"));
  };

  return formTag(
    {
      class: "flex h-full flex-col",
      novalidate: true,
      onsubmit: async (event) => {
        event.preventDefault();
        if (!isReview()) return showInvalid(nextStep(business));
        showInvalid(await submitOrder(business, lines));
      },
    },
    DrawerHeader("Realizar pedido", {
      onBack: () => {
        if (!previousStep(business)) cartView.val = "cart";
      },
      backLabel: "Regresar",
    }),
    Progress(steps),
    body,
    div(
      { class: "space-y-3 border-t border-foreground/10 bg-surface/60 p-5" },
      () =>
        submitError.val && isReview()
          ? p({ role: "alert", class: `${RADIUS} border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-700` }, submitError.val)
          : span({ hidden: true }),
      button({ type: "submit", disabled: isSending, class: "btn-primary w-full py-3.5 text-base disabled:cursor-wait disabled:opacity-70" }, primaryLabel),
      () =>
        isReview()
          ? p(
              { class: "flex items-center justify-center gap-1.5 text-center text-xs text-muted" },
              Icon("lock", "size-3.5 shrink-0"),
              IS_PREVIEW ? "Vista previa: los pedidos no se envían." : "Tus datos solo se usan para entregarte tu pedido.",
            )
          : p({ class: "text-center text-xs text-muted tabular-nums" }, `${count} ${count === 1 ? "producto" : "productos"} · ${total}`),
    ),
    Honeypot(),
  );
}
