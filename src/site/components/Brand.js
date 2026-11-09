import van from "vanjs-core";

const { a, img, span } = van.tags;

export default function Brand(business, { className = "text-xl", onclick } = {}) {
  return a(
    { href: "#", onclick, class: `inline-flex items-center gap-2.5 font-heading font-semibold tracking-tight text-foreground ${className}` },
    business.logoUrl ? img({ src: business.logoUrl, alt: "", class: "h-10 w-auto object-contain" }) : null,
    span(business.name),
  );
}
