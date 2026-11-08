import van from "vanjs-core";
import Icon from "../../ui/Icon.js";

const { div, button } = van.tags;

// preventDefault: dentro de un <summary> (Secciones), tocar un botón no debe abrir/cerrar el bloque.
const ActionButton = (icon, label, onclick, extraClass = "") =>
  button(
    {
      type: "button",
      class: `btn-icon ${extraClass}`,
      title: label,
      "aria-label": label,
      disabled: !onclick,
      onclick: onclick
        ? (event) => {
            event.preventDefault();
            onclick(event);
          }
        : null,
    },
    Icon(icon, "size-4"),
  );

/** Botones de subir, bajar, mostrar/ocultar y eliminar. Pasa null para deshabilitar uno. */
export default function ListActions({ onUp, onDown, onRemove, onToggle, isVisible }) {
  return div(
    { class: "flex items-center gap-0.5" },
    onToggle ? ActionButton(isVisible ? "eye" : "eyeOff", isVisible ? "Ocultar" : "Mostrar", onToggle) : null,
    ActionButton("arrowUp", "Subir", onUp),
    ActionButton("arrowDown", "Bajar", onDown),
    onRemove !== undefined ? ActionButton("trash", "Eliminar", onRemove, "hover:bg-red-50 hover:text-red-600") : null,
  );
}
