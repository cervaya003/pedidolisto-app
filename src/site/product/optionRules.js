// Reglas de la personalización de productos (sin interfaz): selección, validación y precio.
// Formato de lo elegido: [{ group: "Sabor", value: "Vainilla" }, …]. Una opción «Elegir varias»
// produce varias entradas del mismo grupo; una de texto libre, una entrada con lo escrito.
import van from "vanjs-core";

export const isCustomizable = (product) => Boolean(product.customizable && (product.options?.length || product.allowNotes));

const activeOptions = (product) => (product.customizable ? (product.options ?? []) : []);

/** Precio extra de una alternativa elegida (0 si ya no existe en el producto). */
function choicePrice(product, { group, value }) {
  const option = activeOptions(product).find((item) => item.name === group);
  return option?.choices?.find((choice) => choice.label === value)?.price ?? 0;
}

export const unitPrice = (product, choices = []) => product.price + choices.reduce((sum, choice) => sum + choicePrice(product, choice), 0);

/** Agrupa lo elegido para mostrarlo: [{ group: "Extras", value: "Fresas, Velas" }]. */
export function describeChoices(choices = []) {
  const groups = new Map();
  for (const { group, value } of choices) groups.set(group, [...(groups.get(group) ?? []), value]);
  return [...groups].map(([group, values]) => ({ group, value: values.join(", ") }));
}

/** Estado editable de la ficha: un estado por opción, más las indicaciones del cliente. */
export function createSelection(product) {
  const values = Object.fromEntries(activeOptions(product).map((option) => [option.name, van.state(option.type === "multiple" ? [] : "")]));
  return { values, note: van.state(""), showErrors: van.state(false) };
}

const isMissing = (option, value) => option.required && (Array.isArray(value) ? !value.length : !String(value).trim());

/** Opciones obligatorias sin responder (lee los estados: se re-evalúa al cambiar). */
export const missingOptions = (product, selection) =>
  activeOptions(product).filter((option) => isMissing(option, selection.values[option.name].val));

/** Convierte la selección al formato del carrito, en el orden en que el dueño definió las opciones. */
export function selectionChoices(product, selection) {
  return activeOptions(product).flatMap((option) => {
    const value = selection.values[option.name].val;
    if (Array.isArray(value)) {
      // Respeta el orden de las alternativas, no el orden en que se tocaron.
      return option.choices.filter((choice) => value.includes(choice.label)).map((choice) => ({ group: option.name, value: choice.label }));
    }
    const text = String(value).trim();
    return text ? [{ group: option.name, value: text }] : [];
  });
}
