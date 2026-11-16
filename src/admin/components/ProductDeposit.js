// Anticipo de un producto: el dueño decide si hace falta pagar una parte para apartar el pedido
// (pasteles por encargo, piezas especiales…) y cuánto: un porcentaje o una cantidad fija por pieza.
import van from "vanjs-core";
import Icon from "../../ui/Icon.js";
import { adminStore } from "../adminStore.js";

const { section, div, h3, p, label, input, span, button } = van.tags;

const PERCENT_PRESETS = [30, 50, 100];
const money = (value) => `$${Number(value || 0).toLocaleString("es-MX", { maximumFractionDigits: 2 })}`;

export default function ProductDeposit(index) {
  const path = `products.${index}`;
  const product = () => adminStore.draft.val?.products[index] ?? {};
  const type = () => product().depositType ?? "none";
  const isOn = () => type() !== "none";

  // Al cambiar de tipo se propone un valor razonable para que nunca quede en 0 (no se podría publicar).
  function setType(next) {
    adminStore.set(`${path}.depositType`, next);
    if (next === "percent") adminStore.set(`${path}.depositValue`, 50);
    if (next === "fixed") adminStore.set(`${path}.depositValue`, Math.round((product().price || 0) / 2) || 100);
    valueInput.value = adminStore.get(`${path}.depositValue`) || "";
  }

  const valueInput = input({
    class: "field-input pr-10 pl-8 tabular-nums",
    type: "number",
    min: 0,
    step: "any",
    inputmode: "decimal",
    value: adminStore.get(`${path}.depositValue`) || "",
    "aria-label": "Monto del anticipo",
    oninput: (event) => {
      const raw = Math.max(0, Number(event.target.value) || 0);
      adminStore.set(`${path}.depositValue`, type() === "percent" ? Math.min(raw, 100) : raw);
    },
  });

  const preview = () => {
    const { price = 0, depositValue = 0 } = product();
    const amount = type() === "percent" ? (price * Math.min(depositValue, 100)) / 100 : Math.min(depositValue, price);
    if (!(amount > 0)) return "Escribe el monto del anticipo.";
    return `El cliente paga ${money(amount)} por pieza para apartar y ${money(price - amount)} al recibir.`;
  };

  const Segment = (value, text) =>
    button(
      {
        type: "button",
        "aria-pressed": () => String(type() === value),
        onclick: () => setType(value),
        class: () =>
          `flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${type() === value ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-800"}`,
      },
      text,
    );

  return section(
    { class: "mt-4 space-y-4 rounded-2xl border border-zinc-200 bg-white p-4" },
    div(
      h3({ class: "mb-3 text-xs font-semibold tracking-wider text-zinc-400 uppercase" }, "Anticipo"),
      label(
        { class: "flex cursor-pointer items-start gap-3" },
        input({
          type: "checkbox",
          checked: isOn(),
          onchange: (event) => setType(event.target.checked ? "percent" : "none"),
          class: "mt-0.5 size-4 shrink-0 cursor-pointer accent-zinc-900",
        }),
        span(
          span({ class: "block text-sm font-medium text-zinc-800" }, "Pedir anticipo para apartar este producto"),
          span(
            { class: "mt-0.5 block text-xs text-zinc-400" },
            "El pedido queda «Esperando anticipo» hasta que confirmes el pago en Pedidos. Usa los datos de Negocio → Pagos.",
          ),
        ),
      ),
    ),
    div(
      { class: () => `space-y-3 border-t border-zinc-100 pt-4 ${isOn() ? "" : "hidden"}` },
      div({ class: "flex gap-1 rounded-xl bg-zinc-100 p-1", role: "group", "aria-label": "Tipo de anticipo" }, Segment("percent", "Porcentaje"), Segment("fixed", "Cantidad fija")),
      div(
        { class: "flex flex-wrap items-center gap-2" },
        label(
          { class: "relative block w-40" },
          span({ class: "pointer-events-none absolute inset-y-0 left-3 grid place-items-center text-sm text-zinc-400" }, () => (type() === "percent" ? "" : "$")),
          valueInput,
          span({ class: "pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-sm text-zinc-400" }, () => (type() === "percent" ? "%" : "")),
        ),
        () =>
          type() === "percent"
            ? div(
                { class: "flex gap-1.5" },
                PERCENT_PRESETS.map((value) =>
                  button(
                    {
                      type: "button",
                      onclick: () => {
                        adminStore.set(`${path}.depositValue`, value);
                        valueInput.value = value;
                      },
                      class: "rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-zinc-900 hover:text-zinc-900",
                    },
                    `${value} %`,
                  ),
                ),
              )
            : span(),
      ),
      p({ class: "flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800" }, Icon("info", "mt-px size-3.5 shrink-0"), preview),
    ),
  );
}
