// Plantilla «Tienda»: catálogo estilo marketplace con buscador, filtros, ficha de producto y carrito.
import van from "vanjs-core";
import { getVisibleProducts } from "../../../core/siteSelectors.js";
import MarketBanner from "./MarketBanner.js";
import MarketCatalog from "./MarketCatalog.js";
import MarketDeals from "./MarketDeals.js";
import MarketFooter from "./MarketFooter.js";
import MarketHeader from "./MarketHeader.js";
import { MobileCartBar } from "../../cart/CartControls.js";

const { div, main } = van.tags;

export default function MarketPage(site) {
  const products = getVisibleProducts(site);

  return div(
    { "data-motion": "market", class: "min-h-dvh bg-surface pb-20 md:pb-0" },
    MarketHeader(site, products),
    main(
      { class: "mx-auto max-w-7xl space-y-4 px-4 py-4 sm:space-y-6 sm:px-6 sm:py-6" },
      MarketBanner(site),
      MarketDeals(site, products),
      MarketCatalog(site, products),
    ),
    MarketFooter(site, products),
    MobileCartBar(site, products),
  );
}
