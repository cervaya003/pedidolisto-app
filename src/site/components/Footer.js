import van from "vanjs-core";
import Icon from "../../ui/Icon.js";
import Brand from "./Brand.js";
import { whatsappLink } from "../../core/format.js";

const { footer, div, a, p, h3, ul, li, span } = van.tags;

const LINK_CLASS = "transition-colors hover:text-accent";

const ColumnTitle = (text) => h3({ class: "text-xs font-semibold tracking-[0.18em] text-muted uppercase" }, text);

const InfoItem = (icon, content) =>
  li({ class: "flex items-start gap-3" }, span({ class: "mt-0.5 text-accent" }, Icon(icon, "size-4")), content);

const ExternalLink = (href, label) => a({ href, target: "_blank", rel: "noopener", class: LINK_CLASS }, label);

export default function Footer(site) {
  const { business } = site;
  const orderHref = whatsappLink(business);

  const visitItems = [
    business.address ? InfoItem("pin", business.address) : null,
    business.hours ? InfoItem("clock", business.hours) : null,
  ].filter(Boolean);

  const contactItems = [
    orderHref ? InfoItem("chat", ExternalLink(orderHref, "WhatsApp")) : null,
    business.email ? InfoItem("mail", a({ href: `mailto:${business.email}`, class: LINK_CLASS }, business.email)) : null,
    business.instagram ? InfoItem("instagram", ExternalLink(business.instagram, "Instagram")) : null,
    business.facebook ? InfoItem("facebook", ExternalLink(business.facebook, "Facebook")) : null,
  ].filter(Boolean);

  return footer(
    { id: "contacto", class: "bg-surface" },
    div(
      { class: "mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr]" },
      div(
        Brand(business, { className: "text-2xl" }),
        business.description ? p({ class: "mt-4 max-w-sm text-sm leading-relaxed text-foreground/75" }, business.description) : null,
      ),
      visitItems.length
        ? div(ColumnTitle("Visítanos"), ul({ class: "mt-5 space-y-3 text-sm text-foreground/75" }, visitItems))
        : null,
      contactItems.length
        ? div(ColumnTitle("Contacto"), ul({ class: "mt-5 space-y-3 text-sm text-foreground/75" }, contactItems))
        : null,
    ),
    div(
      { class: "border-t border-foreground/10" },
      p(
        { class: "mx-auto max-w-7xl px-5 py-6 text-xs text-muted sm:px-8" },
        `© ${new Date().getFullYear()} ${business.name}. Todos los derechos reservados.`,
      ),
    ),
  );
}
