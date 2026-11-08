import van from "vanjs-core";
import Icon from "../../../ui/Icon.js";
import { whatsappLink } from "../../../core/format.js";
import { getProductsByCategory } from "../../../core/siteSelectors.js";
import { activeCategory, scrollToResults } from "./marketStore.js";

const { footer, div, h3, p, ul, li, a, button } = van.tags;

const LINK_CLASS = "transition-colors hover:text-accent";
const Column = (title, items) =>
  items.length ? div(h3({ class: "text-sm font-semibold text-foreground" }, title), ul({ class: "mt-3 space-y-2 text-sm text-foreground/70" }, items)) : null;

const External = (href, label, icon) =>
  li(a({ href, target: "_blank", rel: "noopener", class: `inline-flex items-center gap-2 ${LINK_CLASS}` }, Icon(icon, "size-4"), label));

export default function MarketFooter(site, products) {
  const { business } = site;
  const orderHref = whatsappLink(business);

  const categoryItems = getProductsByCategory(site, products).map(({ category }) =>
    li(
      button(
        {
          type: "button",
          class: LINK_CLASS,
          onclick: () => {
            activeCategory.val = category.id;
            scrollToResults();
          },
        },
        category.name,
      ),
    ),
  );

  const contactItems = [
    orderHref ? External(orderHref, "WhatsApp", "chat") : null,
    business.email ? li(a({ href: `mailto:${business.email}`, class: `inline-flex items-center gap-2 ${LINK_CLASS}` }, Icon("mail", "size-4"), business.email)) : null,
    business.instagram ? External(business.instagram, "Instagram", "instagram") : null,
    business.facebook ? External(business.facebook, "Facebook", "facebook") : null,
  ].filter(Boolean);

  const visitItems = [
    business.hours ? li({ class: "flex gap-2" }, Icon("clock", "size-4 shrink-0"), business.hours) : null,
    business.address ? li({ class: "flex gap-2" }, Icon("pin", "size-4 shrink-0"), business.address) : null,
  ].filter(Boolean);

  return footer(
    { id: "contacto", class: "mt-10 border-t border-foreground/10 bg-background" },
    div(
      { class: "mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4" },
      div(
        p({ class: "font-heading text-xl font-bold text-foreground" }, business.name),
        business.description ? p({ class: "mt-2 text-sm leading-relaxed text-foreground/70" }, business.description) : null,
      ),
      Column("Categorías", categoryItems),
      Column("Contacto", contactItems),
      Column("Visítanos", visitItems),
    ),
    p(
      { class: "border-t border-foreground/10 px-4 py-5 text-center text-xs text-muted" },
      `© ${new Date().getFullYear()} ${business.name}. Precios sujetos a confirmación.`,
    ),
  );
}
