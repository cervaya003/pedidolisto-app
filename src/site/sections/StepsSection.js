import van from "vanjs-core";
import SectionHeading from "../components/SectionHeading.js";
import Icon from "../../ui/Icon.js";
import { getMenuHref } from "../../core/siteSelectors.js";

const { section, div, ol, li, span, h3, p, a } = van.tags;

const GRID_COLUMNS = { 1: "", 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-2 lg:grid-cols-4" };

export default function StepsSection({ section: config, site }) {
  const { props } = config;
  const items = props.items ?? [];

  return section(
    { id: config.id, class: "bg-inverse py-20 sm:py-28" },
    div(
      { class: "mx-auto max-w-7xl px-5 sm:px-8" },
      SectionHeading({ ...props, text: "", align: "center", tone: "inverse" }),
      ol(
        { "data-reveal-stagger": "", class: `mt-14 grid gap-4 sm:gap-6 ${GRID_COLUMNS[Math.min(items.length, 4)] ?? ""}` },
        items.map((item, index) =>
          li(
            { class: "rounded-card border border-on-inverse/10 bg-on-inverse/[0.03] p-7 sm:p-8" },
            span({ class: "font-heading text-5xl font-light text-accent" }, String(index + 1).padStart(2, "0")),
            h3({ class: "mt-6 font-heading text-2xl text-on-inverse" }, item.title),
            p({ class: "mt-3 leading-relaxed text-on-inverse/70" }, item.text),
          ),
        ),
      ),
      props.ctaLabel
        ? div({ class: "mt-14 text-center" }, a({ href: getMenuHref(site), class: "btn-inverse px-8 py-4 text-base" }, props.ctaLabel, Icon("arrowRight", "size-5")))
        : null,
    ),
  );
}
