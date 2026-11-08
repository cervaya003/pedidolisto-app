// Estado de la plantilla «Carta». A nivel de módulo para sobrevivir a los re-renderizados de la vista previa.
import van from "vanjs-core";

export const openProductId = van.state(null);

export const openProduct = (id) => (openProductId.val = id);
export const closeProduct = () => (openProductId.val = null);

export const FAVORITES_ANCHOR = "favoritos";
export const chapterId = (categoryId) => `capitulo-${categoryId}`;
export const chapterNumber = (index) => String(index + 1).padStart(2, "0");
