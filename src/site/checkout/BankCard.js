// Tarjeta «de plástico» con los datos para transferir: banco, número, titular. Toma los colores del tema
// (primario → acento) para verse como parte del sitio. Proporción real de una tarjeta (85.6 × 54 mm).
// Los textos se escalan con el ancho de la tarjeta (unidades cqw), así se ve igual en celular y escritorio.
import van from "vanjs-core";

const { div, p, span } = van.tags;
const { svg, path, rect, circle, defs, linearGradient, stop } = van.tags("http://www.w3.org/2000/svg");

/** Dígitos en grupos de 4: «0121 8000 1234 5678 99». */
export const groupDigits = (value = "") => value.replace(/(\d{4})(?=\d)/g, "$1 ");

// Chip dorado con sus contactos, dibujado (sin imágenes externas).
const Chip = () =>
  svg(
    { viewBox: "0 0 48 36", class: "h-auto w-[13cqw] drop-shadow-sm", "aria-hidden": "true" },
    defs(
      linearGradient(
        { id: "bank-card-chip", x1: 0, y1: 0, x2: 1, y2: 1 },
        stop({ offset: "0%", "stop-color": "#f6e7b0" }),
        stop({ offset: "50%", "stop-color": "#d4af5a" }),
        stop({ offset: "100%", "stop-color": "#b88a2e" }),
      ),
    ),
    rect({ x: 0.5, y: 0.5, width: 47, height: 35, rx: 6, fill: "url(#bank-card-chip)", stroke: "rgba(0,0,0,.25)" }),
    path({ d: "M16 1v34M32 1v34M1 12h15M1 24h15M32 12h15M32 24h15M16 18h16", stroke: "rgba(0,0,0,.28)", "stroke-width": 1.2, fill: "none" }),
  );

// Ondas de pago sin contacto.
const Contactless = () =>
  svg(
    { viewBox: "0 0 24 24", class: "w-[7cqw] opacity-80", fill: "none", stroke: "currentColor", "stroke-width": 2, "stroke-linecap": "round", "aria-hidden": "true" },
    path({ d: "M8.5 7.5a6 6 0 0 1 0 9" }),
    path({ d: "M12 5a9.5 9.5 0 0 1 0 14" }),
    path({ d: "M15.5 2.5a13 13 0 0 1 0 19" }),
  );

// Dos círculos entrelazados, genéricos (no imitan ninguna marca).
const Mark = () =>
  svg(
    { viewBox: "0 0 40 24", class: "w-[12cqw]", "aria-hidden": "true" },
    circle({ cx: 14, cy: 12, r: 10, fill: "currentColor", opacity: 0.55 }),
    circle({ cx: 26, cy: 12, r: 10, fill: "currentColor", opacity: 0.3 }),
  );

/**
 * `payment`: business.payment. Muestra la tarjeta si hay número; si no, la CLABE o la cuenta.
 * Es decorativa para leer de un vistazo: los botones de copiar están en la ventana de pago (PaymentWidget).
 */
export default function BankCard(payment) {
  const { bank, holder, card, clabe, account } = payment;
  const [label, number] = card ? ["Tarjeta de débito", card] : clabe ? ["CLABE interbancaria", clabe] : account ? ["Número de cuenta", account] : ["", ""];

  return div(
    { class: "@container mx-auto w-full max-w-sm [perspective:1000px]" },
    div(
      {
        role: "img",
        "aria-label": [bank && `Banco ${bank}`, label && `${label} ${number}`, holder && `a nombre de ${holder}`].filter(Boolean).join(", "),
        class:
          "group relative aspect-[1.586] w-full overflow-hidden rounded-[5cqw] bg-linear-135 from-primary via-primary to-accent text-on-primary shadow-[0_18px_40px_-12px_rgba(0,0,0,.45)] ring-1 ring-white/10 transition-transform duration-500 [transform-style:preserve-3d] motion-safe:hover:[transform:rotateX(6deg)_rotateY(-8deg)]",
      },
      // Texturas: círculos grandes y un brillo diagonal que se mueve al pasar el mouse.
      span({ class: "pointer-events-none absolute -top-[30%] -right-[20%] size-[80%] rounded-full bg-white/10", "aria-hidden": "true" }),
      span({ class: "pointer-events-none absolute -bottom-[45%] -left-[15%] size-[85%] rounded-full bg-black/10", "aria-hidden": "true" }),
      span({
        class:
          "pointer-events-none absolute inset-0 bg-linear-110 from-transparent via-white/25 to-transparent opacity-60 transition-transform duration-700 [transform:translateX(-60%)] motion-safe:group-hover:[transform:translateX(60%)]",
        "aria-hidden": "true",
      }),
      div(
        { class: "relative flex h-full flex-col justify-between p-[6.5cqw]" },
        div(
          { class: "flex items-start justify-between gap-3" },
          p({ class: "truncate font-heading text-[6.5cqw] leading-none font-semibold tracking-tight" }, bank || "Transferencia"),
          Contactless(),
        ),
        div(
          { class: "space-y-[3cqw]" },
          Chip(),
          label ? p({ class: "text-[3cqw] font-medium tracking-[0.18em] uppercase opacity-70" }, label) : null,
          number
            ? p(
                { class: "-mt-[2cqw] font-mono text-[clamp(0.8rem,6.2cqw,1.6rem)] leading-none font-semibold tracking-[0.06em] whitespace-nowrap tabular-nums [text-shadow:0_1px_1px_rgba(0,0,0,.35)]" },
                groupDigits(number),
              )
            : null,
        ),
        div(
          { class: "flex items-end justify-between gap-3" },
          div(
            { class: "min-w-0" },
            p({ class: "text-[2.6cqw] font-medium tracking-[0.18em] uppercase opacity-70" }, "Titular"),
            p({ class: "truncate text-[4.2cqw] font-semibold tracking-wide uppercase" }, holder || "—"),
          ),
          Mark(),
        ),
      ),
    ),
  );
}
