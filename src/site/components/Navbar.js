// Encabezado de la plantilla Clásica.
// Movimiento: entra deslizándose desde arriba; al bajar se vuelve de vidrio y más compacto,
// se esconde mientras sigues bajando y reaparece en cuanto subes. Una línea de acento marca
// cuánto llevas de la página y el enlace de la sección visible queda subrayado.
import van from "vanjs-core";
import Icon from "../../ui/Icon.js";
import Brand from "./Brand.js";
import { getNavLinks, getVisibleProducts } from "../../core/siteSelectors.js";
import { CartIconButton } from "../cart/CartControls.js";
import { OrdersButton } from "../orders/MyOrders.js";
import { startOrder } from "../cart/cartStore.js";
import { isScrolled, isScrollingDown, scrollSpy } from "../motion/scroll.js";

const { header, nav, a, button, div, span } = van.tags;

// Estado a nivel de módulo: sobrevive a los re-renderizados de la vista previa.
const isOpen = van.state(false);
const close = () => (isOpen.val = false);

const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";

export default function Navbar(site) {
  const links = [...getNavLinks(site), { href: "#contacto", label: "Contacto" }];
  const products = getVisibleProducts(site);

  // Con el menú de celular abierto nunca se esconde. `:focus-visible` lo mantiene visible al navegar con teclado (no al hacer clic).
  const isHidden = () => isScrollingDown.val && !isOpen.val;
  const isSolid = () => isScrolled.val || isOpen.val;
  const spy = scrollSpy(links.map((link) => link.href.slice(1)));
  const isActive = (link) => spy.active.val === link.href.slice(1);

  return spy.attach(header(
    {
      class: () =>
        `fixed inset-x-0 top-0 z-40 animate-header-in transition-[translate,background-color,box-shadow,backdrop-filter] duration-500 ${EASE} has-[:focus-visible]:translate-y-0 ${
          isHidden() ? "-translate-y-full" : "translate-y-0"
        } ${isSolid() ? "bg-background/80 shadow-[0_1px_0_rgb(0_0_0/0.04),0_8px_24px_-12px_rgb(0_0_0/0.15)] backdrop-blur-xl" : "bg-transparent"}`,
    },
    nav(
      {
        class: () =>
          `mx-auto flex max-w-7xl items-center justify-between px-5 transition-[height] duration-500 sm:px-8 ${EASE} ${isScrolled.val ? "h-14" : "h-16 lg:h-20"}`,
        "aria-label": "Principal",
      },
      Brand(site.business, { onclick: close }),
      div(
        { class: "hidden items-center gap-8 md:flex" },
        links.map((link) =>
          a(
            {
              href: link.href,
              "aria-current": () => String(isActive(link)),
              class: () =>
                `nav-link text-sm font-medium transition-colors duration-300 hover:text-accent ${isActive(link) ? "text-accent" : "text-foreground/75"}`,
            },
            link.label,
          ),
        ),
        button(
          { type: "button", onclick: startOrder, class: "btn-primary transition-transform duration-300 hover:-translate-y-0.5" },
          "Realizar pedido",
        ),
        div({ class: "-ml-2 flex items-center" }, OrdersButton("size-10 text-foreground hover:bg-foreground/5"), CartIconButton(products, "size-10 text-foreground hover:bg-foreground/5")),
      ),
      div(
        { class: "flex items-center gap-1 md:hidden" },
        OrdersButton("size-10 text-foreground hover:bg-foreground/5"),
        CartIconButton(products, "size-10 text-foreground hover:bg-foreground/5"),
        button(
          {
            type: "button",
            class: "grid size-10 place-items-center rounded-full text-foreground transition hover:bg-foreground/5",
            "aria-label": () => (isOpen.val ? "Cerrar menú" : "Abrir menú"),
            "aria-expanded": () => String(isOpen.val),
            "aria-controls": "mobile-menu",
            onclick: () => (isOpen.val = !isOpen.val),
          },
          () => span({ class: "grid animate-fade-down place-items-center" }, Icon(isOpen.val ? "close" : "menu", "size-6")),
        ),
      ),
    ),
    // Menú de celular: los enlaces entran uno tras otro cada vez que se abre.
    div(
      { id: "mobile-menu", class: "border-t border-foreground/5 px-5 pt-2 pb-6 md:hidden", hidden: () => !isOpen.val },
      links.map((link, index) =>
        a(
          {
            href: link.href,
            onclick: close,
            class: "block animate-fade-up border-b border-foreground/5 py-4 font-heading text-2xl text-foreground",
            style: `animation-delay:${60 + index * 50}ms`,
          },
          link.label,
        ),
      ),
      button(
        {
          type: "button",
          onclick: () => {
            close();
            startOrder();
          },
          class: "btn-primary mt-6 w-full animate-fade-up py-3.5 text-base",
          style: `animation-delay:${60 + links.length * 50}ms`,
        },
        Icon("cart", "size-5"),
        "Realizar pedido",
      ),
    ),
    // Progreso de lectura: aparece al empezar a bajar.
    span({
      class: () => `scroll-progress pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-accent transition-opacity duration-500 ${isScrolled.val ? "opacity-100" : "opacity-0"}`,
      "aria-hidden": "true",
    }),
  ));
}
