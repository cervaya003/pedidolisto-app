// Interruptores rápidos del producto, como chips arriba del formulario:
// favorito (con límite), visible en el sitio y precio «Desde».
import van from "vanjs-core";
import Icon from "../../ui/Icon.js";
import { metaStore } from "../../core/metaStore.js";
import { adminStore } from "../adminStore.js";

const { div, button, p, span, ul, li } = van.tags;

const FALLBACK_LIMIT = 10;

const favoritesLimit = () => metaStore.get()?.limits.FEATURED_PRODUCTS ?? FALLBACK_LIMIT;
const favoritesCount = () => (adminStore.draft.val?.products ?? []).filter((product) => product.featured).length;

// Estilo encendido por chip: cada uno con su color para reconocerlo de un vistazo.
const ON_STYLES = {
  amber: "border-amber-400 bg-amber-50 text-amber-800",
  emerald: "border-emerald-400 bg-emerald-50 text-emerald-800",
  sky: "border-sky-400 bg-sky-50 text-sky-800",
};

function Chip({ isOn, onToggle, disabled = () => false, icon, labelOn, labelOff, tone }) {
  return button(
    {
      type: "button",
      role: "switch",
      "aria-checked": () => String(isOn()),
      disabled,
      onclick: onToggle,
      class: () =>
        `inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
          isOn() ? ON_STYLES[tone] : "border-zinc-300 bg-white text-zinc-500 hover:border-zinc-500 hover:text-zinc-800"
        }`,
    },
    () => Icon(typeof icon === "function" ? icon() : icon, "size-4"),
    () => (isOn() ? labelOn : labelOff),
  );
}

/** Chips de estado del producto `index`. */
export default function FavoriteChip(index) {
  const base = `products.${index}`;
  const read = (key) => Boolean(adminStore.draft.val?.products[index]?.[key]);
  const toggle = (key) => () => adminStore.set(`${base}.${key}`, !read(key));

  const isFavorite = () => read("featured");
  const isVisible = () => adminStore.draft.val?.products[index]?.active !== false;
  const favoritesFull = () => !isFavorite() && favoritesCount() >= favoritesLimit();

  // Una línea de ayuda por chip, según su estado.
  const hints = () =>
    [
      isVisible() ? null : "Oculto: no aparece en el sitio (útil si está agotado).",
      read("priceFrom") ? "El precio se muestra como «Desde $…»." : null,
      favoritesFull() ? `Llegaste al límite de ${favoritesLimit()} favoritos. Quita uno para agregar este.` : null,
    ].filter(Boolean);

  return div(
    { class: "mb-5 rounded-2xl border border-zinc-200 bg-white p-3" },
    div(
      { class: "flex flex-wrap items-center gap-2" },
      Chip({ isOn: isFavorite, onToggle: toggle("featured"), disabled: favoritesFull, icon: "star", labelOn: "Favorito", labelOff: "Favorito", tone: "amber" }),
      Chip({
        isOn: isVisible,
        onToggle: () => adminStore.set(`${base}.active`, !isVisible()),
        icon: () => (isVisible() ? "eye" : "eyeOff"),
        labelOn: "Visible",
        labelOff: "Oculto",
        tone: "emerald",
      }),
      Chip({ isOn: () => read("priceFrom"), onToggle: toggle("priceFrom"), icon: "tag", labelOn: "Precio «Desde»", labelOff: "Precio «Desde»", tone: "sky" }),
      span({ class: "ml-auto text-xs font-medium text-zinc-400 tabular-nums" }, () => `★ ${favoritesCount()} de ${favoritesLimit()}`),
    ),
    () => {
      const list = hints();
      return list.length
        ? ul({ class: "mt-2.5 space-y-1 border-t border-zinc-100 pt-2.5 text-xs text-zinc-500" }, list.map((text) => li(text)))
        : div();
    },
  );
}
