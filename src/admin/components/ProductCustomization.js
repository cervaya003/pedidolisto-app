// Editor de personalización de un producto: el dueño decide qué puede elegir el cliente
// (sabor, tamaño, relleno, mensaje…) y cuánto cuesta cada alternativa.
import van from "vanjs-core";
import { withConfirm } from "./ConfirmDialog.js";
import ListActions from "./ListActions.js";
import Icon from "../../ui/Icon.js";
import { metaStore } from "../../core/metaStore.js";
import { moveItem } from "../../core/objectPath.js";
import { adminStore } from "../adminStore.js";

const { section, div, h3, p, label, input, span, select, option, button } = van.tags;

const FALLBACK_TYPES = { single: "Elegir una", multiple: "Elegir varias", text: "Texto libre" };
const choices = (...items) => items.map(([text, price = 0]) => ({ label: text, price }));

// Botones rápidos: crean la opción con ejemplos que luego se editan.
const PRESETS = [
  { name: "Sabor", type: "single", required: true, choices: choices(["Vainilla"], ["Chocolate"], ["Fresa"]) },
  { name: "Tamaño", type: "single", required: true, choices: choices(["Chico"], ["Mediano", 150], ["Grande", 300]) },
  { name: "Relleno", type: "single", required: false, choices: choices(["Cajeta"], ["Nutella", 50], ["Frutos rojos", 60]) },
  { name: "Color", type: "single", required: false, choices: choices(["Blanco"], ["Rosa"], ["Azul"]) },
  { name: "Figura", type: "single", required: false, choices: choices(["Sin figura"], ["Corazón", 80], ["Número", 80]) },
  { name: "Extras", type: "multiple", required: false, choices: choices(["Chispas de chocolate", 20], ["Fresas", 40], ["Velas", 15]) },
  { name: "Mensaje en el pastel", type: "text", required: false, choices: [] },
];

const Checkbox = ({ checked, onchange, text, hint }) =>
  label(
    { class: "flex cursor-pointer items-start gap-3" },
    input({ type: "checkbox", checked, onchange: (event) => onchange(event.target.checked), class: "mt-0.5 size-4 shrink-0 cursor-pointer accent-zinc-900" }),
    span(span({ class: "block text-sm font-medium text-zinc-800" }, text), hint ? span({ class: "mt-0.5 block text-xs text-zinc-400" }, hint) : null),
  );

/** Nombre libre: si ya existe «Sabor», el nuevo se llama «Sabor 2». */
function uniqueName(name, options) {
  const taken = new Set(options.map((item) => item.name));
  if (!taken.has(name)) return name;
  let counter = 2;
  while (taken.has(`${name} ${counter}`)) counter++;
  return `${name} ${counter}`;
}

export default function ProductCustomization(index) {
  const productPath = `products.${index}`;
  const optionsPath = `${productPath}.options`;
  const version = van.state(0);
  // Siempre la lista ACTUAL: incluye lo que se escribió después de dibujar (no usar la copia del render).
  const options = () => adminStore.get(optionsPath) ?? [];
  const commit = (next) => {
    adminStore.set(optionsPath, next);
    version.val++;
  };
  // Dentro de funciones reactivas (clases): se re-evalúa sin redibujar el editor.
  const isOn = () => Boolean(adminStore.draft.val?.products[index]?.customizable);
  const types = metaStore.get()?.optionTypes ?? FALLBACK_TYPES;

  const addPreset = (preset) => commit([...options(), { ...structuredClone(preset), name: uniqueName(preset.name, options()) }]);

  function ChoiceRow(optionIndex, choiceIndex, list) {
    const path = `${optionsPath}.${optionIndex}.choices.${choiceIndex}`;
    return div(
      { class: "grid grid-cols-[1fr_6.5rem_auto] items-center gap-2" },
      input({
        class: "field-input",
        value: list[choiceIndex].label,
        maxlength: 40,
        placeholder: "Ej.: Vainilla",
        "aria-label": "Alternativa",
        oninput: (event) => adminStore.set(`${path}.label`, event.target.value),
      }),
      label(
        { class: "relative block" },
        span({ class: "pointer-events-none absolute inset-y-0 left-3 grid place-items-center text-sm text-zinc-400" }, "+$"),
        input({
          class: "field-input pl-8 tabular-nums",
          type: "number",
          min: 0,
          step: "any",
          value: list[choiceIndex].price || "",
          placeholder: "0",
          "aria-label": "Precio extra",
          oninput: (event) => adminStore.set(`${path}.price`, Math.max(0, Number(event.target.value) || 0)),
        }),
      ),
      button(
        {
          type: "button",
          class: "btn-icon hover:bg-red-50 hover:text-red-600",
          title: "Quitar alternativa",
          "aria-label": "Quitar alternativa",
          onclick: withConfirm(
            () => ({
              title: "¿Quitar esta alternativa?",
              message: `Se quitará «${options()[optionIndex]?.choices[choiceIndex]?.label || "sin nombre"}» de «${options()[optionIndex]?.name || "la opción"}».`,
              confirmLabel: "Quitar",
            }),
            () => commit(options().map((item, position) => (position === optionIndex ? { ...item, choices: item.choices.filter((_, i) => i !== choiceIndex) } : item))),
          ),
        },
        Icon("close", "size-4"),
      ),
    );
  }

  function OptionCard(item, optionIndex, list) {
    const path = `${optionsPath}.${optionIndex}`;
    const isText = item.type === "text";

    return div(
      { class: "space-y-3 rounded-xl border border-zinc-200 bg-zinc-50/70 p-3" },
      div(
        { class: "flex items-center gap-2" },
        input({
          class: "field-input font-medium",
          value: item.name,
          maxlength: 40,
          placeholder: "Nombre de la opción",
          "aria-label": "Nombre de la opción",
          oninput: (event) => adminStore.set(`${path}.name`, event.target.value),
        }),
        ListActions({
          onUp: optionIndex > 0 ? () => commit(moveItem(options(), optionIndex, optionIndex - 1)) : null,
          onDown: optionIndex < list.length - 1 ? () => commit(moveItem(options(), optionIndex, optionIndex + 1)) : null,
          onRemove: withConfirm(
            () => ({
              title: "¿Eliminar esta opción?",
              message: `Se eliminará «${options()[optionIndex]?.name || "Opción sin nombre"}» con todas sus alternativas.`,
            }),
            () => commit(options().filter((_, position) => position !== optionIndex)),
          ),
        }),
      ),
      div(
        { class: "flex flex-wrap items-center gap-x-4 gap-y-2" },
        select(
          {
            class: "field-input w-auto",
            "aria-label": "Cómo elige el cliente",
            onchange: (event) => commit(options().map((current, position) => (position === optionIndex ? { ...current, type: event.target.value } : current))),
          },
          Object.entries(types).map(([value, text]) => option({ value, selected: value === item.type }, text)),
        ),
        Checkbox({ checked: item.required, text: "Obligatorio", onchange: (checked) => adminStore.set(`${path}.required`, checked) }),
      ),
      isText
        ? p({ class: "text-xs text-zinc-500" }, "El cliente verá un campo para escribir (por ejemplo, el texto del pastel).")
        : div(
            { class: "space-y-2" },
            div({ class: "grid grid-cols-[1fr_6.5rem_auto] gap-2 text-[11px] font-medium text-zinc-400" }, span("Alternativas"), span("Precio extra"), span({ class: "w-10 sm:w-8" })),
            item.choices.map((_, choiceIndex) => ChoiceRow(optionIndex, choiceIndex, item.choices)),
            button(
              {
                type: "button",
                class: "inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900",
                onclick: () => commit(options().map((current, position) => (position === optionIndex ? { ...current, choices: [...current.choices, { label: "", price: 0 }] } : current))),
              },
              Icon("plus", "size-4"),
              "Agregar alternativa",
            ),
          ),
    );
  }

  return section(
    { class: "mt-6 space-y-4 rounded-2xl border border-zinc-200 bg-white p-4" },
    div(
      h3({ class: "mb-3 text-xs font-semibold tracking-wider text-zinc-400 uppercase" }, "Personalización"),
      Checkbox({
        checked: Boolean(adminStore.get(`${productPath}.customizable`)),
        text: "El cliente puede personalizar este producto",
        hint: "Sabor, tamaño, relleno, mensaje… Déjalo apagado si se vende tal cual (por ejemplo, galletas).",
        onchange: (checked) => adminStore.set(`${productPath}.customizable`, checked),
      }),
    ),
    div(
      { class: () => `space-y-4 border-t border-zinc-100 pt-4 ${isOn() ? "" : "hidden"}` },
      div(
        p({ class: "mb-2 text-xs font-medium text-zinc-600" }, "Agregar opción"),
        div(
          { class: "flex flex-wrap gap-2" },
          PRESETS.map((preset) =>
            button(
              { type: "button", onclick: () => addPreset(preset), class: "inline-flex items-center gap-1 rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-zinc-900 hover:text-zinc-900" },
              Icon("plus", "size-3.5"),
              preset.name,
            ),
          ),
          button(
            {
              type: "button",
              onclick: () => addPreset({ name: "Nueva opción", type: "single", required: false, choices: [{ label: "", price: 0 }] }),
              class: "inline-flex items-center gap-1 rounded-full border border-dashed border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-500 transition hover:border-zinc-900 hover:text-zinc-900",
            },
            Icon("plus", "size-3.5"),
            "Otra",
          ),
        ),
      ),
      () => {
        version.val;
        const list = options();
        return list.length
          ? div({ class: "space-y-3" }, list.map((item, optionIndex) => OptionCard(item, optionIndex, list)))
          : p({ class: "rounded-xl border border-dashed border-zinc-300 p-4 text-center text-xs text-zinc-500" }, "Toca un botón de arriba para agregar la primera opción.");
      },
      div(
        { class: "border-t border-zinc-100 pt-4" },
        Checkbox({
          checked: Boolean(adminStore.get(`${productPath}.allowNotes`)),
          text: "Permitir indicaciones especiales",
          hint: "El cliente podrá escribir, por ejemplo: «igual al de la foto, pero de vainilla».",
          onchange: (checked) => adminStore.set(`${productPath}.allowNotes`, checked),
        }),
      ),
    ),
  );
}
