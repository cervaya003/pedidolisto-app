import van from "vanjs-core";
import Icon from "../../../ui/Icon.js";
import { imageProps } from "../../../core/image.js";
import { getSectionProps } from "../../../core/siteSelectors.js";
import { startOrder } from "../../cart/cartStore.js";

const { header, div, p, h1, a, img, em, span, dl, dt, dd, button } = van.tags;
const { svg, defs, path, text, textPath } = van.tags("http://www.w3.org/2000/svg");

const SEAL_MAX_CHARS = 34;
const SEAL_PATH_ID = "carta-seal-path";

// Retraso escalonado para que los textos de la portada entren uno tras otro.
const stagger = (step) => ({ style: `animation-delay:${step * 90}ms` });

function TopBar(business) {
  const info = [business.hours, business.address].filter(Boolean);

  return div(
    { class: "animate-fade-down border-b border-foreground/10" },
    div(
      { class: "mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-5 sm:px-8" },
      a(
        { href: "#", class: "flex min-w-0 items-center gap-2.5 font-heading text-xl font-medium tracking-tight text-foreground" },
        business.logoUrl ? img({ src: business.logoUrl, alt: "", class: "h-9 w-auto shrink-0 object-contain" }) : null,
        span({ class: "truncate" }, business.name),
      ),
      info.length
        ? p(
            { class: "hidden items-center gap-5 text-[11px] font-medium tracking-[0.18em] text-muted uppercase lg:flex" },
            info.map((item, index) => [index ? span({ class: "size-1 rounded-full bg-accent/60", "aria-hidden": "true" }) : null, span(item)]),
          )
        : null,
      button(
        {
          type: "button",
          onclick: startOrder,
          class: "inline-flex shrink-0 items-center gap-2 border-b border-foreground/30 pb-0.5 text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent",
        },
        Icon("cart", "size-4"),
        "Realizar pedido",
      ),
    ),
  );
}

/** Sello circular con texto que gira lentamente (solo transform: barato para el teléfono). */
function Seal(label) {
  const content = `${label.toUpperCase().slice(0, SEAL_MAX_CHARS)} · `;

  return div(
    {
      class:
        "absolute -bottom-7 -left-4 grid size-28 place-items-center rounded-full bg-background text-foreground shadow-xl shadow-black/10 ring-1 ring-foreground/5 sm:-left-8 sm:size-32",
      "aria-hidden": "true",
    },
    svg(
      { viewBox: "0 0 100 100", class: "absolute inset-1.5 animate-spin-slow" },
      defs(path({ id: SEAL_PATH_ID, d: "M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" })),
      text(
        { "font-size": "8.2", "letter-spacing": "1.2", fill: "currentColor", class: "font-body font-semibold" },
        textPath({ href: `#${SEAL_PATH_ID}`, textLength: "236", lengthAdjust: "spacing" }, content),
      ),
    ),
    span({ class: "grid size-11 place-items-center rounded-full bg-accent/10 text-accent" }, Icon("sparkle", "size-5")),
  );
}

/** Foto en forma de arco, con marco desplazado y el sello. */
function ArchMedia(hero, sealLabel) {
  return div(
    { class: "relative mx-auto w-full max-w-sm sm:max-w-md lg:mr-0 lg:max-w-[28rem]" },
    div({ class: "absolute inset-0 translate-x-3 translate-y-3 rounded-t-full rounded-b-card border border-accent/40 sm:translate-x-5 sm:translate-y-5", "aria-hidden": "true" }),
    div(
      { class: "relative aspect-[4/5] overflow-hidden rounded-t-full rounded-b-card bg-surface shadow-2xl shadow-black/15" },
      img({
        ...imageProps(hero.imageUrl, { sizes: "(min-width: 1024px) 28rem, (min-width: 640px) 28rem, 90vw" }),
        alt: "",
        fetchpriority: "high",
        class: "size-full animate-image-reveal object-cover",
      }),
    ),
    sealLabel ? Seal(sealLabel) : null,
  );
}

function Highlights(items, centered) {
  if (!items?.length) return null;
  return dl(
    {
      ...stagger(5),
      class: `mt-10 grid max-w-md animate-fade-up grid-cols-3 divide-x divide-foreground/10 border-t border-foreground/10 pt-6 ${centered ? "mx-auto" : ""}`,
    },
    items.slice(0, 3).map((item) =>
      div(
        { class: "px-3 first:pl-0 last:pr-0" },
        dt({ class: "font-heading text-2xl leading-none text-foreground sm:text-3xl" }, item.title),
        dd({ class: "mt-2 text-xs leading-snug text-muted" }, item.text),
      ),
    ),
  );
}

/** Portada editorial: título con palabras resaltadas, llamada a la carta y foto en arco. */
export default function CartaMasthead(site) {
  const { business } = site;
  const hero = getSectionProps(site, "hero");
  // Portada oculta en «Secciones»: queda solo la barra superior con el logo y el botón de pedido.
  if (!hero) return header(TopBar(business));

  const hasImage = Boolean(hero.imageUrl);
  const centered = !hasImage;
  const eyebrow = hero.eyebrow || business.tagline;
  const lead = hero.text || business.description;
  const sealLabel = [hero.badgeTitle, hero.badgeText].filter(Boolean).join(" · ") || business.tagline || business.name;

  return header(
    TopBar(business),
    div(
      {
        class: `relative mx-auto grid max-w-6xl items-center gap-14 px-5 pt-12 pb-20 sm:px-8 sm:pt-16 lg:gap-16 lg:pt-20 lg:pb-24 ${
          hasImage ? "lg:grid-cols-[1.1fr_1fr]" : "text-center"
        }`,
      },
      div(
        { class: centered ? "mx-auto max-w-3xl" : "" },
        eyebrow
          ? p(
              { ...stagger(0), class: `flex animate-fade-up items-center gap-3 text-xs font-semibold tracking-[0.3em] text-accent uppercase ${centered ? "justify-center" : ""}` },
              span({ class: "h-px w-10 bg-current", "aria-hidden": "true" }),
              eyebrow,
            )
          : null,
        h1(
          {
            ...stagger(1),
            class: "mt-6 animate-fade-up font-heading text-[2.6rem] leading-[1.04] font-medium tracking-tight text-balance text-foreground sm:text-6xl lg:text-[4.25rem]",
          },
          hero.title || business.name,
          hero.title && hero.highlight ? [" ", em({ class: "font-normal text-accent" }, hero.highlight)] : null,
        ),
        lead
          ? p({ ...stagger(2), class: `mt-6 max-w-lg animate-fade-up text-base leading-relaxed text-foreground/70 sm:text-lg ${centered ? "mx-auto" : ""}` }, lead)
          : null,
        div(
          { ...stagger(3), class: `mt-9 flex animate-fade-up flex-col gap-3 sm:flex-row ${centered ? "sm:justify-center" : ""}` },
          a({ href: "#carta", class: "btn-primary px-7 py-3.5 text-base" }, hero.ctaLabel || "Ver la carta", Icon("arrowDown", "size-4")),
          button({ type: "button", onclick: startOrder, class: "btn-secondary px-7 py-3.5 text-base" }, Icon("cart", "size-4"), "Realizar pedido"),
        ),
        Highlights(hero.highlights, centered),
      ),
      hasImage ? ArchMedia(hero, sealLabel) : null,
    ),
  );
}
