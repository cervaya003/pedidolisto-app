// Plantilla «Carta»: menú editorial por capítulos, con renglones nombre ···· precio.
import van from "vanjs-core";
import { getFavoritesLabel, getProductsByCategory, getSectionProps, getVisibleProducts } from "../../../core/siteSelectors.js";
import { MobileCartBar } from "../../cart/CartControls.js";
import CartaChapter from "./CartaChapter.js";
import CartaFooter from "./CartaFooter.js";
import CartaIndex from "./CartaIndex.js";
import CartaMasthead from "./CartaMasthead.js";
import CartaSpotlight from "./CartaSpotlight.js";

const { div, main, p } = van.tags;

export default function CartaPage(site) {
  const products = getVisibleProducts(site);
  const groups = getProductsByCategory(site, products);
  // En la Carta, «★ Favoritos» del índice salta a la sección de destacados: si está oculta, no hay a dónde ir.
  const favoritesLabel = getSectionProps(site, "featured") ? getFavoritesLabel(site, products) : "";

  return div(
    { "data-motion": "carta", class: "min-h-dvh pb-20 md:pb-0" },
    CartaMasthead(site),
    groups.length ? CartaIndex(groups, products, favoritesLabel) : null,
    main(
      CartaSpotlight(site, products),
      div(
        { id: "carta", class: "mx-auto max-w-6xl px-5 sm:px-8" },
        groups.length
          ? groups.map((group, index) => CartaChapter(group, index, site))
          : p({ class: "py-24 text-center font-heading text-xl text-muted italic" }, "Pronto agregaremos productos."),
      ),
    ),
    CartaFooter(site),
    MobileCartBar(site, products),
  );
}
