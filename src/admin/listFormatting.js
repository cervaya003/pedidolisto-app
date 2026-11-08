// Escritura rápida de listas (Características, Ingredientes): coma, punto o doble espacio = nueva línea.
// Un punto o coma entre números se respeta (1.5 kg, 1,000 g). Un espacio normal no cambia nada.

const DIGIT = /\d/;

/** Convierte separadores en saltos de línea. Función pura: se puede probar sin navegador. */
export function toListText(text) {
  return text
    .replace(/[ \t]{2,}/g, "\n")
    .replace(/[ \t]*[,.][ \t]*/g, (match, offset, full) => {
      const markIndex = offset + match.search(/[,.]/);
      const before = full[markIndex - 1];
      const after = full[markIndex + 1];
      // «1.» al final puede ser «1.5»: se espera a ver la siguiente letra.
      const isNumber = DIGIT.test(before ?? "") && (after === undefined || DIGIT.test(after));
      return isNumber ? match : "\n";
    })
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .replace(/^\n+/, "");
}

/** Aplica el formato a un <textarea> conservando la posición del cursor. */
export function formatListInput(textarea) {
  const { value, selectionStart } = textarea;
  const formatted = toListText(value);
  if (formatted === value) return;
  const caret = toListText(value.slice(0, selectionStart)).length;
  textarea.value = formatted;
  textarea.setSelectionRange(caret, caret);
}

export const toListItems = (text) =>
  text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
