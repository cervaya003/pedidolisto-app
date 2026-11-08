import van from "vanjs-core";

const { a, img } = van.tags;

export default function Brand(business, { className = "text-xl", onclick } = {}) {
  return a(
    { href: "#", onclick, class: `font-heading font-semibold tracking-tight text-foreground ${className}` },
    business.logoUrl ? img({ src: business.logoUrl, alt: business.name, class: "h-10 w-auto object-contain" }) : business.name,
  );
}
