// Elegir el día del pedido: Hoy, Mañana u Otra fecha (calendario). Los días anteriores a hoy no se pueden elegir.
// El valor es "AAAA-MM-DD" en la fecha local del cliente.
import van from "vanjs-core";
import Icon from "../../ui/Icon.js";

const { div, button, span, p } = van.tags;

const pad = (number) => String(number).padStart(2, "0");
export const toIsoDate = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
export const fromIsoDate = (value) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};
export const todayIso = () => toIsoDate(new Date());

const addDays = (date, days) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

/** "sábado 12 de diciembre de 2026" */
export const formatLongDate = (value, locale) =>
  value ? fromIsoDate(value).toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" }).replace(",", "") : "";

// La semana empieza en lunes (como en los calendarios en español). 2024-01-01 fue lunes.
const weekdayNames = (locale) => Array.from({ length: 7 }, (_, index) => new Date(2024, 0, 1 + index).toLocaleDateString(locale, { weekday: "narrow" }));

const RADIUS = "rounded-[min(var(--site-radius),0.75rem)]";
const NAV_BUTTON = "grid size-9 place-items-center rounded-full text-foreground transition hover:bg-foreground/5 disabled:pointer-events-none disabled:opacity-25";

/** "12 de diciembre de 2026" */
export const formatChipDate = (value, locale) =>
  value ? fromIsoDate(value).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" }) : "";

/**
 * Botones «Hoy», «Mañana» y «Otra fecha». «Otra fecha» abre un calendario; al elegir un día se cierra
 * y aparece un botón seleccionado con la fecha («12 de diciembre de 2026»), sin quitar «Otra fecha»
 * para poder cambiarla. Los días anteriores a hoy no se pueden elegir.
 * `value`: estado con "AAAA-MM-DD" o "". `hasError()` pinta los botones en rojo.
 */
export default function DatePicker(value, { locale = "es-MX", onChange, maxDaysAhead = 365, hasError = () => false } = {}) {
  const today = new Date();
  const todayValue = toIsoDate(today);
  const tomorrowValue = toIsoDate(addDays(today, 1));
  const lastValue = toIsoDate(addDays(today, maxDaysAhead));
  const firstMonth = startOfMonth(today);
  const lastMonth = startOfMonth(addDays(today, maxDaysAhead));
  const month = van.state(firstMonth);
  const calendarOpen = van.state(false);

  const isOther = () => Boolean(value.val) && value.val !== todayValue && value.val !== tomorrowValue;
  const select = (day) => {
    value.val = day;
    calendarOpen.val = false;
    onChange?.(day);
  };
  const shiftMonth = (step) => (month.val = new Date(month.val.getFullYear(), month.val.getMonth() + step, 1));

  const chipClass = (isSelected) => () =>
    `inline-flex items-center gap-1.5 rounded-button border px-4 py-2 text-sm font-medium transition ${
      isSelected()
        ? "border-primary bg-primary text-on-primary"
        : hasError()
          ? "border-red-500 bg-red-500/5 text-foreground"
          : "border-foreground/15 text-foreground hover:border-foreground/40"
    }`;

  const Shortcut = (label, day) =>
    button(
      {
        type: "button",
        "aria-pressed": () => String(value.val === day),
        onclick: () => select(day),
        class: chipClass(() => value.val === day),
      },
      label,
    );

  const toggleCalendar = () => {
    if (!calendarOpen.val) month.val = startOfMonth(value.val && value.val >= todayValue ? fromIsoDate(value.val) : today);
    calendarOpen.val = !calendarOpen.val;
  };

  // La fecha elegida en el calendario (solo existe si no es hoy ni mañana).
  const ChosenDate = () =>
    isOther()
      ? button(
          { type: "button", "aria-pressed": "true", onclick: toggleCalendar, title: "Cambiar la fecha", class: chipClass(() => true) },
          Icon("check", "size-4"),
          formatChipDate(value.val, locale),
        )
      : span({ hidden: true });

  const OtherDate = () =>
    button(
      { type: "button", "aria-expanded": () => String(calendarOpen.val), onclick: toggleCalendar, class: chipClass(() => false) },
      Icon("calendar", "size-4"),
      "Otra fecha",
    );

  const Day = (date) => {
    const day = toIsoDate(date);
    const disabled = day < todayValue || day > lastValue;
    const isToday = day === todayValue;
    return button(
      {
        type: "button",
        disabled,
        onclick: () => select(day),
        "aria-label": formatLongDate(day, locale),
        "aria-pressed": () => String(value.val === day),
        class: () => {
          const selected = value.val === day;
          return `relative mx-auto grid size-10 place-items-center rounded-full text-sm tabular-nums transition ${
            selected
              ? "bg-primary font-semibold text-on-primary shadow-sm"
              : disabled
                ? "cursor-not-allowed text-foreground/25"
                : "text-foreground hover:bg-foreground/[0.06]"
          } ${isToday && !selected ? "font-semibold text-accent" : ""}`;
        },
      },
      date.getDate(),
      // Puntito bajo el día de hoy.
      isToday ? span({ class: "absolute bottom-1 size-1 rounded-full bg-current", "aria-hidden": "true" }) : null,
    );
  };

  const MonthGrid = () => {
    const current = month.val;
    const offset = (current.getDay() + 6) % 7; // lunes = 0
    const daysInMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
    const cells = [
      ...Array.from({ length: offset }, () => span()),
      ...Array.from({ length: daysInMonth }, (_, index) => Day(new Date(current.getFullYear(), current.getMonth(), index + 1))),
    ];
    return div({ class: "grid grid-cols-7 gap-y-1", role: "group", "aria-label": "Días del mes" }, cells);
  };

  const Calendar = () =>
    div(
      { class: `max-w-sm animate-fade-down ${RADIUS} border border-foreground/10 bg-background p-3 shadow-sm sm:p-4` },
      div(
        { class: "mb-2 flex items-center justify-between" },
        button({ type: "button", "aria-label": "Mes anterior", class: NAV_BUTTON, disabled: () => month.val <= firstMonth, onclick: () => shiftMonth(-1) }, Icon("chevronLeft", "size-5")),
        p({ class: "text-sm font-semibold text-foreground", "aria-live": "polite" }, () => capitalize(month.val.toLocaleDateString(locale, { month: "long", year: "numeric" }))),
        button({ type: "button", "aria-label": "Mes siguiente", class: NAV_BUTTON, disabled: () => month.val >= lastMonth, onclick: () => shiftMonth(1) }, Icon("chevronRight", "size-5")),
      ),
      div(
        { class: "grid grid-cols-7 pb-1 text-center text-[11px] font-semibold tracking-wide text-muted uppercase", "aria-hidden": "true" },
        weekdayNames(locale).map((name) => span({ class: "py-1" }, name)),
      ),
      MonthGrid,
    );

  return div(
    { class: "space-y-3" },
    div({ class: "flex flex-wrap gap-2" }, Shortcut("Hoy", todayValue), Shortcut("Mañana", tomorrowValue), ChosenDate, OtherDate()),
    () => (calendarOpen.val ? Calendar() : span({ hidden: true })),
  );
}
