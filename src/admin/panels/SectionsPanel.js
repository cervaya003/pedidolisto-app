import van from "vanjs-core";
import { withConfirm } from "../components/ConfirmDialog.js";
import ListActions from "../components/ListActions.js";
import SchemaForm from "../components/SchemaForm.js";
import { PanelHeader } from "../components/Panel.js";
import Icon from "../../ui/Icon.js";
import { metaStore } from "../../core/metaStore.js";
import { moveItem } from "../../core/objectPath.js";
import { adminStore } from "../adminStore.js";
import { createSection } from "../factories.js";
import { DEFAULT_TEMPLATE, getSectionFields } from "../schemas.js";

const { div, details, summary, span, select, option, button } = van.tags;

const SECTIONS_PATH = "layout.sections";

// Una sección sin campos para la plantilla elegida es una que esa plantilla no usa (p. ej. «Menú» en Tienda o Carta):
// no se lista ni se ofrece para agregar. Sigue guardada en su lugar y reaparece al volver a la Clásica.
const isUsedBy = (type, template) => getSectionFields(type, template).length > 0;

export default function SectionsPanel() {
  const template = adminStore.get("theme.template") || DEFAULT_TEMPLATE;
  const availableTypes = Object.entries(metaStore.get().sectionTypes).filter(([type]) => isUsedBy(type, template));

  const version = van.state(0);
  const newType = van.state(availableTypes.some(([type]) => type === "menu") ? "menu" : availableTypes[0]?.[0]);
  const sections = () => adminStore.get(SECTIONS_PATH);
  const commit = (next) => {
    adminStore.set(SECTIONS_PATH, next);
    version.val++;
  };

  // `index` es la posición real en la lista completa; `previous` y `next` son las de las secciones visibles vecinas,
  // así las flechas saltan las secciones que no se muestran.
  const SectionItem = (section, index, previous, next) =>
    details(
      { class: `group rounded-2xl border border-zinc-200 bg-white ${section.enabled ? "" : "opacity-60"}` },
      summary(
        { class: "flex cursor-pointer list-none items-center gap-3 p-3 pl-4 [&::-webkit-details-marker]:hidden" },
        Icon("chevronRight", "size-4 shrink-0 text-zinc-400 transition group-open:rotate-90"),
        span(
          { class: "min-w-0 flex-1" },
          span({ class: "block text-sm font-medium text-zinc-900" }, metaStore.get().sectionTypes[section.type]),
          span({ class: "block truncate text-xs text-zinc-400" }, section.props.title || section.props.navLabel || `#${section.id}`),
        ),
        ListActions({
          isVisible: section.enabled,
          onToggle: () => commit(sections().map((item, position) => (position === index ? { ...item, enabled: !item.enabled } : item))),
          onUp: previous !== undefined ? () => commit(moveItem(sections(), index, previous)) : null,
          onDown: next !== undefined ? () => commit(moveItem(sections(), index, next)) : null,
          onRemove: withConfirm(
            {
              title: "¿Eliminar esta sección?",
              message: `Se quitará «${metaStore.get().sectionTypes[section.type]}${section.props.title ? ` · ${section.props.title}` : ""}» de la página con todo su contenido.`,
            },
            () => commit(sections().filter((_, position) => position !== index)),
          ),
        }),
      ),
      div({ class: "border-t border-zinc-100 p-4" }, SchemaForm(getSectionFields(section.type, template), `${SECTIONS_PATH}.${index}.props`)),
    );

  return div(
    PanelHeader("Secciones", "Ordena, oculta y configura cada bloque de la página."),
    () => {
      version.val;
      const visible = sections()
        .map((section, index) => ({ section, index }))
        .filter(({ section }) => isUsedBy(section.type, template));
      return div(
        { class: "space-y-2" },
        visible.map(({ section, index }, position) => SectionItem(section, index, visible[position - 1]?.index, visible[position + 1]?.index)),
      );
    },
    availableTypes.length
      ? div(
          { class: "mt-4 flex gap-2" },
          select(
            { class: "field-input", onchange: (event) => (newType.val = event.target.value) },
            availableTypes.map(([value, label]) => option({ value, selected: value === newType.val }, label)),
          ),
          button(
            { type: "button", class: "btn-primary shrink-0", onclick: () => commit([...sections(), createSection(newType.val)]) },
            Icon("plus", "size-4"),
            "Agregar",
          ),
        )
      : null,
  );
}
