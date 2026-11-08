import van from "vanjs-core";
import Footer from "./components/Footer.js";
import Navbar from "./components/Navbar.js";
import ProductModal from "./components/ProductModal.js";
import { SECTION_COMPONENTS } from "./sections/index.js";
import { TEMPLATE_PAGES, TemplateOverlays } from "./templates/index.js";
import CartDrawer from "./cart/CartDrawer.js";
import MyOrders from "./orders/MyOrders.js";
import { MobileCartBar } from "./cart/CartControls.js";
import { getEnabledSections, getVisibleProducts } from "../core/siteSelectors.js";
import { siteStore } from "../core/siteStore.js";
import { observeReveals } from "./reveal.js";

const { div, main, h1, p, button } = van.tags;

const Loader = () =>
  div({ class: "grid min-h-dvh place-items-center" }, div({ class: "size-8 animate-spin rounded-full border-2 border-foreground/15 border-t-foreground" }));

const Unavailable = () =>
  div(
    { class: "grid min-h-dvh place-items-center px-6 text-center" },
    div(
      h1({ class: "font-heading text-3xl text-foreground" }, "Volvemos en un momento"),
      p({ class: "mt-3 text-muted" }, "No pudimos cargar el sitio. Revisa tu conexión e inténtalo de nuevo."),
      button({ type: "button", class: "btn-primary mt-6", onclick: () => location.reload() }, "Reintentar"),
    ),
  );

function Page(site) {
  return div(
    { "data-motion": "classic" },
    Navbar(site),
    main(
      getEnabledSections(site).map((section, index) => {
        const element = SECTION_COMPONENTS[section.type]?.({ section, site }) ?? null;
        // Las secciones que animan sus propias piezas (título, tarjetas…) no se animan completas: se duplicaría.
        if (element && index > 0 && !element.querySelector("[data-reveal], [data-reveal-stagger]")) element.setAttribute("data-reveal", "");
        return element;
      }),
    ),
    Footer(site),
    MobileCartBar(site, getVisibleProducts(site)),
  );
}

// `?plantilla=market` permite ver otra plantilla sin publicarla.
const TEMPLATE_OVERRIDE = new URLSearchParams(location.search).get("plantilla");
const PAGES = { classic: Page, ...TEMPLATE_PAGES };

function renderTemplate(site) {
  const page = (PAGES[TEMPLATE_OVERRIDE] ?? PAGES[site.theme.template] ?? Page)(site);
  observeReveals();
  return page;
}

export default function App() {
  return div(
    () => {
      if (siteStore.site.val) return renderTemplate(siteStore.site.val);
      return siteStore.hasError.val ? Unavailable() : Loader();
    },
    ProductModal(),
    TemplateOverlays(),
    CartDrawer(),
    MyOrders(),
  );
}
