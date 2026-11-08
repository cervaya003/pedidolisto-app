import van from "vanjs-core";

const { div, p, h2 } = van.tags;

export default function SectionHeading({ eyebrow, title, text, align = "left", tone = "default" }) {
  const isInverse = tone === "inverse";

  return div(
    { "data-reveal": "", class: align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl" },
    eyebrow ? p({ class: "text-xs font-semibold tracking-[0.2em] text-accent uppercase" }, eyebrow) : null,
    title
      ? h2(
          {
            class: `mt-3 font-heading text-3xl leading-tight font-medium tracking-tight text-balance sm:text-5xl ${isInverse ? "text-on-inverse" : "text-foreground"}`,
          },
          title,
        )
      : null,
    text
      ? p(
          { class: `mt-4 text-base leading-relaxed sm:text-lg ${isInverse ? "text-on-inverse/70" : "text-foreground/75"}` },
          text,
        )
      : null,
  );
}
