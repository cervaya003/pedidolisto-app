import van from "vanjs-core";
import Icon from "../../ui/Icon.js";

const { div, h2, p, section, h3, nav, button } = van.tags;

export const PanelHeader = (title, description, action = null) =>
  div(
    { class: "mb-6 flex items-start justify-between gap-4" },
    div(h2({ class: "text-lg font-semibold text-zinc-900" }, title), description ? p({ class: "mt-1 text-sm text-zinc-500" }, description) : null),
    action,
  );

export const FieldGroup = (title, ...children) =>
  section(
    { class: "rounded-2xl border border-zinc-200 bg-white p-4" },
    h3({ class: "mb-4 text-xs font-semibold tracking-wider text-zinc-400 uppercase" }, title),
    ...children,
  );

/**
 * Chips para dividir un panel en apartados. `sections`: { clave: { label, icon? } }; `active`: estado con la clave elegida.
 * En pantallas angostas bajan a otra línea.
 */
export const SectionChips = (sections, active, label) =>
  nav(
    // Bajan a otra línea si no caben: siempre se ven todos los apartados.
    { class: "mb-4 flex flex-wrap gap-2", "aria-label": label },
    Object.entries(sections).map(([key, item]) =>
      button(
        {
          type: "button",
          "aria-pressed": () => String(active.val === key),
          onclick: () => (active.val = key),
          class: () =>
            `inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition ${
              active.val === key ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400 hover:text-zinc-900"
            }`,
        },
        item.icon ? Icon(item.icon, "size-4") : null,
        item.label,
      ),
    ),
  );

/** Título de grupo con ícono, para los apartados con chips. */
export const GroupHint = (icon, text) =>
  p({ class: "flex items-center gap-2 text-sm text-zinc-500" }, icon ? Icon(icon, "size-4 shrink-0 text-zinc-400") : null, text);
