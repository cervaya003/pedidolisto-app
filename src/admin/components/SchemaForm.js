import van from "vanjs-core";
import { withConfirm } from "./ConfirmDialog.js";
import FontPicker from "./FontPicker.js";
import GalleryField from "./GalleryField.js";
import ImageField from "./ImageField.js";
import ListActions from "./ListActions.js";
import Icon from "../../ui/Icon.js";
import { moveItem } from "../../core/objectPath.js";
import { adminStore } from "../adminStore.js";
import { formatListInput, toListItems } from "../listFormatting.js";

const { div, label, span, input, textarea, select, option, p, button } = van.tags;

// Los campos no se vuelven a dibujar al escribir (perderían el foco):
// leen el valor inicial y solo escriben en el borrador.

/** Ícono dentro del campo, a la izquierda (si el campo define `icon`). */
const withIcon = (field, control) =>
  field.icon
    ? div(
        { class: "relative" },
        span({ class: "pointer-events-none absolute inset-y-0 left-3 grid place-items-center text-zinc-400" }, Icon(field.icon, "size-4")),
        control,
      )
    : control;
const ICON_PADDING = "padding-left: 2.25rem";

const Field = (field, control, tag = label) =>
  tag(
    { class: "block" },
    span({ class: "mb-1.5 block text-xs font-medium text-zinc-600" }, field.label),
    control,
    field.hint ? p({ class: "mt-1.5 text-xs text-zinc-400" }, field.hint) : null,
  );

// Largos máximos (iguales a los del API) para los campos sin `maxLength` propio.
const KEY_MAX_LENGTH = {
  tagline: 120,
  description: 600,
  email: 120,
  address: 200,
  hours: 120,
  details: 200,
  city: 60,
  state: 60,
  navLabel: 40,
  eyebrow: 60,
  title: 160,
  highlight: 80,
  text: 600,
  ctaLabel: 40,
  categoryLabel: 40,
  badgeTitle: 60,
  badgeText: 80,
  instagram: 2048,
  facebook: 2048,
};
const maxLengthOf = (field) => field.maxLength ?? KEY_MAX_LENGTH[field.key];

// `field.filter` limpia lo escrito (p. ej. WhatsApp: solo dígitos).
const write = (path, field) => (event) => {
  const value = field?.filter ? field.filter(event.target.value) : event.target.value;
  if (value !== event.target.value) event.target.value = value;
  adminStore.set(path, value);
};

const RENDERERS = {
  text: (field, path) =>
    Field(
      field,
      withIcon(
        field,
        input({
          class: "field-input",
          style: field.icon ? ICON_PADDING : "",
          type: field.inputType ?? "text",
          inputmode: field.inputmode,
          maxlength: maxLengthOf(field),
          value: adminStore.get(path) ?? "",
          placeholder: field.placeholder ?? "",
          oninput: write(path, field),
        }),
      ),
    ),

  textarea: (field, path) =>
    Field(field, textarea({ class: "field-input min-h-20 resize-y", rows: 3, maxlength: maxLengthOf(field), value: adminStore.get(path) ?? "", oninput: write(path, field) })),

  number: (field, path) =>
    Field(
      field,
      input({
        class: "field-input",
        type: "number",
        min: field.min,
        step: "any",
        value: adminStore.get(path) ?? 0,
        oninput: (event) => adminStore.set(path, event.target.value === "" ? 0 : Number(event.target.value)),
      }),
    ),

  lines: (field, path) =>
    Field(
      field,
      textarea({
        class: "field-input min-h-20 resize-y",
        rows: 3,
        value: (adminStore.get(path) ?? []).join("\n"),
        oninput: (event) => {
          // Coma, punto o doble espacio pasan a nueva línea (no mientras se compone un acento).
          if (!event.isComposing) formatListInput(event.target);
          adminStore.set(path, toListItems(event.target.value));
        },
      }),
    ),

  select: (field, path) => {
    const current = String(adminStore.get(path));
    return Field(
      field,
      withIcon(
        field,
        select(
          {
            class: "field-input",
            style: field.icon ? ICON_PADDING : "",
            onchange: (event) => adminStore.set(path, field.numeric ? Number(event.target.value) : event.target.value),
          },
          field.options.map((item) => option({ value: item.value, selected: String(item.value) === current }, item.label)),
        ),
      ),
    );
  },

  toggle: (field, path) =>
    label(
      { class: "flex cursor-pointer items-start justify-between gap-4" },
      span(
        { class: "flex items-start gap-3" },
        field.icon ? span({ class: "mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-zinc-100 text-zinc-500" }, Icon(field.icon, "size-4")) : null,
        span(span({ class: "block text-sm font-medium text-zinc-800" }, field.label), field.hint ? span({ class: "mt-0.5 block text-xs text-zinc-400" }, field.hint) : null),
      ),
      span(
        { class: "relative mt-0.5 shrink-0" },
        input({ type: "checkbox", class: "peer sr-only", checked: Boolean(adminStore.get(path)), onchange: (event) => adminStore.set(path, event.target.checked) }),
        span({ class: "block h-6 w-11 rounded-full bg-zinc-300 transition peer-checked:bg-zinc-900 peer-focus-visible:ring-2 peer-focus-visible:ring-zinc-900/30" }),
        span({ class: "absolute top-1 left-1 size-4 rounded-full bg-white shadow transition peer-checked:translate-x-5" }),
      ),
    ),

  color: (field, path) => {
    const value = adminStore.get(path) ?? "#000000";
    const swatch = input({ type: "color", value, class: "size-9 shrink-0 cursor-pointer rounded-lg border border-zinc-300 bg-white p-0.5" });
    const hex = input({ type: "text", value, maxlength: 7, class: "field-input font-mono uppercase" });

    swatch.oninput = () => {
      hex.value = swatch.value;
      adminStore.set(path, swatch.value);
    };
    hex.oninput = () => {
      if (!/^#[0-9a-f]{6}$/i.test(hex.value)) return;
      swatch.value = hex.value;
      adminStore.set(path, hex.value);
    };

    return Field(field, div({ class: "flex items-center gap-2" }, swatch, hex), div);
  },

  font: (field, path) => Field(field, FontPicker(field, path), div),
  image: (field, path) => ImageField(field, path),
  gallery: (field, path) => GalleryField(field, path),

  items: (field, path) => {
    const version = van.state(0);
    const items = () => adminStore.get(path) ?? [];
    const commit = (next) => {
      adminStore.set(path, next);
      version.val++;
    };

    return Field(
      field,
      () => {
        version.val;
        const list = items();
        return div(
          { class: "space-y-3" },
          list.map((_, index) =>
            div(
              { class: "space-y-3 rounded-xl border border-zinc-200 bg-zinc-50/60 p-3" },
              div(
                { class: "flex items-center justify-between" },
                span(
                  { class: "inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400" },
                  field.itemIcon ? Icon(field.itemIcon, "size-3.5") : null,
                  `#${index + 1}`,
                ),
                ListActions({
                  onUp: index > 0 ? () => commit(moveItem(items(), index, index - 1)) : null,
                  onDown: index < list.length - 1 ? () => commit(moveItem(items(), index, index + 1)) : null,
                  onRemove: withConfirm(
                    () => {
                      const item = items()[index] ?? {};
                      const name = item.name || item.city || item.title;
                      return { title: "¿Eliminar este elemento?", message: name ? `Se eliminará «${name}» de «${field.label}».` : `Se eliminará el #${index + 1} de «${field.label}».` };
                    },
                    () => commit(items().filter((__, position) => position !== index)),
                  ),
                }),
              ),
              SchemaForm(field.itemFields, `${path}.${index}`),
            ),
          ),
          button(
            { type: "button", class: "btn-secondary w-full border-dashed", onclick: () => commit([...items(), structuredClone(field.newItem)]) },
            Icon("plus", "size-4"),
            field.addLabel,
          ),
        );
      },
      div,
    );
  },
};

export default function SchemaForm(fields, basePath) {
  return div(
    { class: "space-y-4" },
    fields.map((field) => RENDERERS[field.type](field, basePath ? `${basePath}.${field.key}` : field.key)),
  );
}
