import van from "vanjs-core";
import Icon from "../../ui/Icon.js";
import { imageProps } from "../../core/image.js";
import { getMenuHref } from "../../core/siteSelectors.js";
import { startOrder } from "../cart/cartStore.js";

const { section, div, p, h1, em, a, img, span, ul, li, button } = van.tags;

function HeroMedia(props) {
  return div(
    { class: "relative mx-auto w-full max-w-md animate-fade-up [animation-delay:150ms] lg:max-w-none" },
    div(
      { class: "aspect-[4/5] overflow-hidden rounded-card bg-surface shadow-2xl shadow-black/15" },
      img({
        ...imageProps(props.imageUrl, { sizes: "(min-width: 1024px) 45vw, 90vw" }),
        alt: props.title,
        fetchpriority: "high",
        class: "size-full object-cover",
      }),
    ),
    props.secondaryImageUrl
      ? div(
          {
            class:
              "absolute -bottom-8 -left-3 w-32 overflow-hidden rounded-card border-4 border-background bg-surface shadow-xl sm:-left-10 sm:w-44",
          },
          img({
            ...imageProps(props.secondaryImageUrl, { sizes: "11rem", widths: [240, 480] }),
            alt: "",
            loading: "lazy",
            class: "aspect-square size-full object-cover",
          }),
        )
      : null,
    props.badgeTitle
      ? div(
          {
            class:
              "absolute top-6 -right-3 flex items-center gap-3 rounded-2xl bg-background/95 px-4 py-3 shadow-lg shadow-black/10 backdrop-blur sm:-right-8",
          },
          span({ class: "grid size-9 place-items-center rounded-full bg-accent/10 text-accent" }, Icon("sparkle")),
          div(
            p({ class: "text-sm font-semibold text-foreground" }, props.badgeTitle),
            props.badgeText ? p({ class: "text-xs text-muted" }, props.badgeText) : null,
          ),
        )
      : null,
  );
}

export default function HeroSection({ section: config, site }) {
  const { props } = config;
  const hasImage = Boolean(props.imageUrl);

  return section(
    { id: config.id, class: "relative overflow-hidden pt-28 pb-20 sm:pt-36 lg:pt-32 lg:pb-24" },
    div({ class: "pointer-events-none absolute -top-48 -right-40 size-[36rem] rounded-full bg-accent/15 blur-3xl", "aria-hidden": "true" }),
    div({ class: "pointer-events-none absolute -bottom-48 -left-40 size-[32rem] rounded-full bg-primary/10 blur-3xl", "aria-hidden": "true" }),
    div(
      {
        class: `relative mx-auto grid max-w-7xl items-center gap-14 px-5 sm:px-8 ${hasImage ? "lg:grid-cols-[1.05fr_1fr] lg:gap-16" : "text-center"}`,
      },
      div(
        { class: `animate-fade-up ${hasImage ? "" : "mx-auto max-w-3xl"}` },
        props.eyebrow
          ? p(
              {
                class:
                  "inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-surface px-3 py-1 text-xs font-semibold tracking-[0.18em] text-foreground/75 uppercase",
              },
              span({ class: "size-1.5 rounded-full bg-accent" }),
              props.eyebrow,
            )
          : null,
        h1(
          {
            class:
              "mt-6 font-heading text-[2.6rem] leading-[1.05] font-medium tracking-tight text-balance text-foreground sm:text-6xl lg:text-[3.75rem] xl:text-[4.25rem]",
          },
          props.title,
          props.highlight ? [" ", em({ class: "font-normal text-accent" }, props.highlight)] : null,
        ),
        props.text ? p({ class: `mt-6 text-base leading-relaxed text-foreground/75 sm:text-lg ${hasImage ? "max-w-xl" : ""}` }, props.text) : null,
        div(
          { class: `mt-9 flex flex-col gap-3 sm:flex-row ${hasImage ? "" : "sm:justify-center"}` },
          props.ctaLabel
            ? a({ href: getMenuHref(site), class: "btn-primary px-7 py-3.5 text-base" }, props.ctaLabel, Icon("arrowRight", "size-4"))
            : null,
          button({ type: "button", onclick: startOrder, class: "btn-secondary px-7 py-3.5 text-base" }, Icon("cart", "size-4"), "Realizar pedido"),
        ),
        props.highlights?.length
          ? ul(
              { class: `mt-12 grid max-w-lg grid-cols-3 gap-4 border-t border-foreground/10 pt-6 ${hasImage ? "" : "mx-auto"}` },
              props.highlights.map((item) =>
                li(
                  p({ class: "font-heading text-xl text-foreground sm:text-2xl" }, item.title),
                  p({ class: "mt-1 text-xs text-muted sm:text-sm" }, item.text),
                ),
              ),
            )
          : null,
      ),
      hasImage ? HeroMedia(props) : null,
    ),
  );
}
