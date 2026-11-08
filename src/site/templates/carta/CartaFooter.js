import van from "vanjs-core";
import Icon from "../../../ui/Icon.js";
import { whatsappLink } from "../../../core/format.js";
import { getSectionProps } from "../../../core/siteSelectors.js";
import { startOrder } from "../../cart/cartStore.js";

const { footer, div, p, h2, h3, ol, li, a, span, button } = van.tags;

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
const LINK_CLASS = "underline-offset-4 transition-colors hover:text-on-inverse hover:underline";

function HowToOrder(site) {
  const steps = getSectionProps(site, "steps");
  if (!steps?.items?.length) return null;

  return div(
    { "data-reveal": "", class: "border-b border-on-inverse/10 pb-16" },
    p({ class: "text-xs font-semibold tracking-[0.35em] text-on-inverse/60 uppercase" }, steps.eyebrow || "Cómo pedir"),
    h2({ class: "mt-4 max-w-xl font-heading text-3xl font-medium text-balance sm:text-4xl" }, steps.title),
    ol(
      { class: "mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-3" },
      steps.items.map((item, index) =>
        li(
          span({ class: "font-heading text-3xl text-on-inverse/50 italic" }, ROMAN[index] ?? index + 1),
          h3({ class: "mt-3 font-heading text-xl" }, item.title),
          p({ class: "mt-2 text-sm leading-relaxed text-on-inverse/70" }, item.text),
        ),
      ),
    ),
  );
}

const InfoColumn = (title, items) =>
  items.length
    ? div(
        p({ class: "text-xs font-semibold tracking-[0.25em] text-on-inverse/50 uppercase" }, title),
        div({ class: "mt-4 space-y-2 text-sm text-on-inverse/80" }, items),
      )
    : null;

/** Cierre en tono oscuro: cómo pedir, datos de contacto y el nombre como firma. */
export default function CartaFooter(site) {
  const { business } = site;
  const orderHref = whatsappLink(business);
  const external = (href, label) => a({ href, target: "_blank", rel: "noopener", class: `block ${LINK_CLASS}` }, label);

  const contact = [
    orderHref ? external(orderHref, "WhatsApp") : null,
    business.email ? a({ href: `mailto:${business.email}`, class: `block ${LINK_CLASS}` }, business.email) : null,
    business.instagram ? external(business.instagram, "Instagram") : null,
    business.facebook ? external(business.facebook, "Facebook") : null,
  ].filter(Boolean);
  const visit = [business.address ? p(business.address) : null, business.hours ? p(business.hours) : null].filter(Boolean);

  return footer(
    { id: "contacto", class: "bg-inverse text-on-inverse" },
    div(
      { class: "mx-auto max-w-6xl space-y-16 px-5 py-20 sm:px-8" },
      HowToOrder(site),
      div(
        { class: "grid gap-10 sm:grid-cols-3" },
        InfoColumn("Visítanos", visit),
        InfoColumn("Contacto", contact),
        div({ class: "sm:text-right" }, button({ type: "button", onclick: startOrder, class: "btn-inverse px-6 py-3" }, Icon("cart", "size-4"), "Realizar pedido")),
      ),
      div(
        { class: "border-t border-on-inverse/10 pt-10" },
        p({ class: "truncate font-heading text-5xl leading-none font-medium text-on-inverse/15 sm:text-8xl", "aria-hidden": "true" }, business.name),
        p({ class: "mt-6 text-xs text-on-inverse/50" }, `© ${new Date().getFullYear()} ${business.name}`),
      ),
    ),
  );
}
