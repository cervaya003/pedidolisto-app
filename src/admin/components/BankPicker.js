// Banco de la tarjeta para transferir: lista de los más usados (cada uno con su diseño) u «Otro» para
// escribirlo. El color sale del banco, pero el dueño puede cambiarlo. Abajo, la tarjeta tal como la verá el cliente.
import van from "vanjs-core";
import Icon from "../../ui/Icon.js";
import BankCard from "../../site/checkout/BankCard.js";
import { BANK_BRANDS, findBrand } from "../../site/checkout/bankBrands.js";
import { adminStore } from "../adminStore.js";

const { div, label, span, input, select, option, p, button } = van.tags;

const OTHER = "other";
// En el admin no están los colores del tema: sin banco ni color, la vista previa usa este gris oscuro.
const PREVIEW_FALLBACK = { background: "linear-gradient(135deg,#3f3f46 0%,#27272a 55%,#18181b 100%)", text: "#ffffff", decor: "classic" };
const SAMPLE = { card: "4111111111111111", holder: "Nombre del titular" };

/** `field.key` es la ruta del banco (payment.bank); el color vive junto a él (payment.cardColor). */
export default function BankPicker(field, path) {
  const parent = path.split(".").slice(0, -1).join(".");
  const colorPath = parent ? `${parent}.cardColor` : "cardColor";

  const bankName = adminStore.get(path) ?? "";
  const brandKey = van.state(findBrand(bankName)?.key ?? (bankName.trim() ? OTHER : ""));
  const color = van.state(adminStore.get(colorPath) ?? "");
  const brand = () => BANK_BRANDS.find((item) => item.key === brandKey.val) ?? null;

  const setColor = (value) => {
    color.val = value;
    adminStore.set(colorPath, value);
  };

  const nameInput = input({
    class: "field-input",
    style: "padding-left: 2.25rem",
    maxlength: field.maxLength ?? 60,
    value: brandKey.rawVal === OTHER ? bankName : "",
    placeholder: "Banorte, Mercado Pago, HSBC…",
    oninput: (event) => adminStore.set(path, event.target.value),
  });

  const onBankChange = (event) => {
    brandKey.val = event.target.value;
    const chosen = brand();
    // Banco de la lista: su nombre y su color por defecto. «Otro»: lo escribe el dueño.
    adminStore.set(path, chosen ? chosen.label : brandKey.val === OTHER ? nameInput.value : "");
    if (chosen) setColor("");
    if (brandKey.val === OTHER) queueMicrotask(() => nameInput.focus());
  };

  // Color: el del banco (vacío) o uno propio. Se redibuja solo al cambiar de banco: al mover el selector
  // de color, los campos se actualizan sin recrearse (si no, el selector nativo se cerraría).
  const ColorRow = () => {
    const chosen = brand();
    const bankColor = chosen?.color ?? "#3f3f46";
    const swatch = input({ type: "color", value: color.rawVal || bankColor, class: "size-9 shrink-0 cursor-pointer rounded-lg border border-zinc-300 bg-white p-0.5" });
    const hex = input({
      type: "text",
      value: color.rawVal,
      placeholder: chosen ? `${bankColor.toUpperCase()} (del banco)` : "Colores de tu sitio",
      maxlength: 7,
      class: "field-input font-mono uppercase placeholder:normal-case",
    });
    swatch.oninput = () => {
      hex.value = swatch.value;
      setColor(swatch.value);
    };
    hex.oninput = () => {
      if (/^#[0-9a-f]{6}$/i.test(hex.value)) {
        swatch.value = hex.value;
        setColor(hex.value.toLowerCase());
      } else if (!hex.value) setColor("");
    };
    const reset = () => {
      hex.value = "";
      swatch.value = bankColor;
      setColor("");
    };
    return div(
      span({ class: "mb-1.5 block text-xs font-medium text-zinc-600" }, "Color de la tarjeta"),
      div(
        { class: "flex items-center gap-2" },
        swatch,
        hex,
        button({ type: "button", class: () => `btn-secondary shrink-0 whitespace-nowrap ${color.val ? "" : "hidden"}`, onclick: reset }, chosen ? "Usar el del banco" : "Quitar"),
      ),
      p(
        { class: "mt-1.5 text-xs text-zinc-400" },
        chosen ? "Por defecto se usa el color del banco. Cámbialo si tu tarjeta es de otro color." : "Elige el color de tu tarjeta. Sin color, usa los colores de tu sitio.",
      ),
    );
  };

  return div(
    { class: "space-y-4" },
    label(
      { class: "block" },
      span({ class: "mb-1.5 block text-xs font-medium text-zinc-600" }, field.label),
      div(
        { class: "relative" },
        span({ class: "pointer-events-none absolute inset-y-0 left-3 grid place-items-center text-zinc-400" }, Icon(field.icon ?? "store", "size-4")),
        select(
          { class: "field-input", style: "padding-left: 2.25rem", onchange: onBankChange },
          option({ value: "", selected: brandKey.rawVal === "" }, "Elige tu banco…"),
          BANK_BRANDS.map((item) => option({ value: item.key, selected: item.key === brandKey.rawVal }, item.label)),
          option({ value: OTHER, selected: brandKey.rawVal === OTHER }, "Otro (escribirlo)"),
        ),
      ),
    ),
    // El campo de texto se crea una vez (no pierde lo escrito al cambiar de banco); solo se oculta.
    label(
      { class: () => (brandKey.val === OTHER ? "block" : "hidden") },
      span({ class: "mb-1.5 block text-xs font-medium text-zinc-600" }, "Nombre del banco"),
      div(
        { class: "relative" },
        span({ class: "pointer-events-none absolute inset-y-0 left-3 grid place-items-center text-zinc-400" }, Icon("store", "size-4")),
        nameInput,
      ),
    ),
    () => (brandKey.val ? ColorRow() : div()),
    // Vista previa: se redibuja con cada cambio del borrador (número, titular, banco, color).
    () => {
      adminStore.draft.val;
      const payment = adminStore.get(parent) ?? {};
      return div(
        { class: "rounded-xl border border-zinc-200 bg-zinc-50 p-4" },
        p({ class: "mb-3 text-center text-xs font-medium text-zinc-500" }, "Así la verá tu cliente"),
        BankCard({ ...payment, card: payment.card || (payment.clabe || payment.account ? "" : SAMPLE.card), holder: payment.holder || SAMPLE.holder }, { fallback: PREVIEW_FALLBACK }),
      );
    },
  );
}
