// Lo que ve el cliente para personalizar: chips para elegir, campo de texto y sus indicaciones.
import van from "vanjs-core";
import Icon from "../../ui/Icon.js";
import { formatPrice } from "../../core/format.js";
import { MAX, filters } from "../../core/textRules.js";
import { missingOptions } from "./optionRules.js";

const { div, fieldset, legend, span, button, input, label, textarea, p } = van.tags;

const TEXT_MAX = MAX.OPTION_TEXT;
const NOTE_MAX = MAX.ITEM_NOTE;

// Quita al escribir (o pegar) los símbolos que el API no acepta.
const cleanInput = (event) => {
  const clean = filters.safeText(event.target.value);
  if (clean !== event.target.value) event.target.value = clean;
  return clean;
};

const chipClass = (isSelected) =>
  `inline-flex items-center gap-1.5 rounded-button border px-3.5 py-2 text-sm font-medium transition ${
    isSelected ? "border-primary bg-primary text-on-primary" : "border-foreground/15 bg-background text-foreground hover:border-foreground/40"
  }`;

const optionHint = (option) => {
  if (option.type === "multiple") return option.required ? "Elige al menos una" : "Elige las que quieras";
  return option.required ? "Obligatorio" : "Opcional";
};

function Choices(option, value, business) {
  const isMultiple = option.type === "multiple";
  const isSelected = (choiceLabel) => (isMultiple ? value.val.includes(choiceLabel) : value.val === choiceLabel);
  const toggle = (choiceLabel) => {
    if (isMultiple) value.val = isSelected(choiceLabel) ? value.val.filter((item) => item !== choiceLabel) : [...value.val, choiceLabel];
    else value.val = isSelected(choiceLabel) && !option.required ? "" : choiceLabel;
  };

  return div(
    { class: "flex flex-wrap gap-2", role: isMultiple ? "group" : "radiogroup", "aria-label": option.name },
    option.choices.map((choice) =>
      button(
        {
          type: "button",
          role: isMultiple ? "checkbox" : "radio",
          "aria-checked": () => String(isSelected(choice.label)),
          onclick: () => toggle(choice.label),
          class: () => chipClass(isSelected(choice.label)),
        },
        isMultiple ? () => (isSelected(choice.label) ? Icon("check", "size-3.5") : span({ class: "size-3.5 rounded-sm border border-current opacity-40" })) : null,
        choice.label,
        choice.price ? span({ class: "text-xs opacity-70" }, `+${formatPrice(business, choice.price)}`) : null,
      ),
    ),
  );
}

const TextField = (option, value) =>
  input({
    type: "text",
    maxlength: TEXT_MAX,
    value: value.rawVal,
    placeholder: "Escribe aquí…",
    "aria-label": option.name,
    oninput: (event) => (value.val = cleanInput(event)),
    class: "w-full rounded-[min(var(--site-radius),0.75rem)] border border-foreground/15 bg-background px-3.5 py-2.5 text-base text-foreground outline-none placeholder:text-muted focus:border-foreground/40 sm:text-sm",
  });

/** Opciones de personalización de un producto. `selection` viene de createSelection(product). */
export default function ProductOptions(product, selection, business) {
  const missing = () => new Set(missingOptions(product, selection).map((option) => option.name));
  const options = product.customizable ? (product.options ?? []) : [];

  return div(
    { class: "space-y-5" },
    options.map((option) => {
      const value = selection.values[option.name];
      return fieldset(
        { "data-option": option.name },
        legend(
          { class: "mb-2.5 flex w-full items-baseline justify-between gap-3" },
          span({ class: "text-sm font-semibold text-foreground" }, option.name),
          span({ class: "text-xs text-muted" }, optionHint(option)),
        ),
        option.type === "text" ? TextField(option, value) : Choices(option, value, business),
        p(
          { class: () => `mt-1.5 text-xs font-medium text-red-600 ${selection.showErrors.val && missing().has(option.name) ? "" : "hidden"}`, role: "alert" },
          option.type === "text" ? "Completa este campo." : "Elige una opción para continuar.",
        ),
      );
    }),
    product.customizable && product.allowNotes
      ? label(
          { class: "block" },
          span({ class: "mb-2.5 flex items-baseline justify-between gap-3" }, span({ class: "text-sm font-semibold text-foreground" }, "Indicaciones especiales"), span({ class: "text-xs text-muted" }, "Opcional")),
          textarea({
            rows: 3,
            maxlength: NOTE_MAX,
            placeholder: "Ej.: igual al de la foto, pero de vainilla y con letras doradas.",
            oninput: (event) => (selection.note.val = cleanInput(event)),
            class: "w-full resize-y rounded-[min(var(--site-radius),0.75rem)] border border-foreground/15 bg-background px-3.5 py-2.5 text-base text-foreground outline-none placeholder:text-muted focus:border-foreground/40 sm:text-sm",
          }),
        )
      : null,
  );
}
