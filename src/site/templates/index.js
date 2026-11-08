// Plantillas alternativas del sitio público. La «Clásica» vive en App.js con sus componentes originales.
// Un id nuevo también debe existir en TEMPLATES del API (catalog.js).
import CartaDrawer from "./carta/CartaDrawer.js";
import CartaPage from "./carta/CartaPage.js";
import MarketPage from "./market/MarketPage.js";
import MarketProductView from "./market/MarketProductView.js";

export const TEMPLATE_PAGES = {
  market: MarketPage,
  carta: CartaPage,
};

/** Ventanas de cada plantilla. Se crean una sola vez y solo se abren desde su plantilla. */
export const TemplateOverlays = () => [MarketProductView(), CartaDrawer()];
