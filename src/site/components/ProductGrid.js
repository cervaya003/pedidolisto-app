import van from "vanjs-core";
import ProductCard from "./ProductCard.js";

const { ul, li } = van.tags;

// Mapas con clases completas: Tailwind necesita verlas escritas para generarlas.
const MOBILE_COLUMNS = { 1: "grid-cols-1 sm:grid-cols-2", 2: "grid-cols-2" };
const TABLET_COLUMNS = { 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-3", 5: "md:grid-cols-3" };
const DESKTOP_COLUMNS = { 2: "lg:grid-cols-2", 3: "lg:grid-cols-3", 4: "lg:grid-cols-4", 5: "lg:grid-cols-5" };
const ROW_HEIGHTS = {
  sm: "auto-rows-[11rem] sm:auto-rows-[13rem]",
  md: "auto-rows-[13rem] sm:auto-rows-[16rem] lg:auto-rows-[17rem]",
  lg: "auto-rows-[16rem] sm:auto-rows-[20rem] lg:auto-rows-[22rem]",
};
const SIZE_SPANS = {
  1: { wide: "sm:col-span-2", large: "sm:col-span-2 sm:row-span-2" },
  2: { wide: "col-span-2", large: "col-span-2 row-span-2" },
};

export default function ProductGrid({ products, business, props }) {
  const mobileColumns = props.mobileColumns === 1 ? 1 : 2;
  const gridClass = [
    "grid grid-flow-dense gap-3 sm:gap-5",
    MOBILE_COLUMNS[mobileColumns],
    TABLET_COLUMNS[props.columns] ?? TABLET_COLUMNS[4],
    DESKTOP_COLUMNS[props.columns] ?? DESKTOP_COLUMNS[4],
    ROW_HEIGHTS[props.rowHeight] ?? ROW_HEIGHTS.md,
  ].join(" ");

  // Cada tarjeta aparece al llegar a ella con el scroll (también al cambiar de filtro).
  return ul(
    { class: gridClass, "data-reveal-stagger": "" },
    products.map((product) =>
      li(
        { class: SIZE_SPANS[mobileColumns][product.size] ?? "" },
        ProductCard(product, { business, cardStyle: props.cardStyle }),
      ),
    ),
  );
}
