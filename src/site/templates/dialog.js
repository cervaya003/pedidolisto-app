import van from "vanjs-core";

/**
 * Mantiene un <dialog> modal sincronizado con un estado: lo abre cuando `isOpen()` es verdadero
 * y llama a `onClose` al cerrarlo con Esc o tocando el fondo.
 */
export function syncDialog(element, isOpen, onClose) {
  van.derive(() => {
    const open = Boolean(isOpen());
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  });
  element.addEventListener("close", onClose);
  element.addEventListener("click", (event) => event.target === element && onClose());
  return element;
}

/** Clases para un <dialog> que entra como panel lateral desde la derecha. */
export const DRAWER_CLASS =
  "m-0 ms-auto h-dvh max-h-dvh w-full max-w-md sm:max-w-xl lg:max-w-[44rem] overflow-hidden bg-background p-0 text-foreground shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-[2px] open:animate-fade-up";
