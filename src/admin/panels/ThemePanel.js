import van from "vanjs-core";
import SchemaForm from "../components/SchemaForm.js";
import TemplatePicker from "../components/TemplatePicker.js";
import { FieldGroup, GroupHint, PanelHeader, SectionChips } from "../components/Panel.js";
import { adminStore } from "../adminStore.js";
import { getThemeGroups } from "../schemas.js";
import { THEME_PRESETS } from "../themePresets.js";

const { div, button, span } = van.tags;

// A nivel de módulo: la sub-pestaña elegida se conserva cuando el panel se vuelve a dibujar.
const activeSection = van.state("template");

function applyPreset(preset) {
  adminStore.set("theme", { ...adminStore.get("theme"), ...structuredClone(preset.theme) });
  adminStore.refreshForms();
  adminStore.notify(`Estilo «${preset.name}» aplicado. Guarda para publicarlo.`);
}

const PresetButton = (preset) =>
  button(
    {
      type: "button",
      onclick: () => applyPreset(preset),
      class: "group flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-2.5 text-left transition hover:border-zinc-400",
    },
    span(
      { class: "flex shrink-0 overflow-hidden rounded-lg ring-1 ring-zinc-900/10" },
      ["background", "primary", "accent"].map((key) => span({ class: "block h-8 w-3", style: `background:${preset.theme.colors[key]}` })),
    ),
    span({ class: "text-sm font-medium text-zinc-800" }, preset.name),
  );

const themeGroup = (title) => {
  const group = getThemeGroups().find((item) => item.title === title);
  return FieldGroup(group.title, SchemaForm(group.fields, "theme"));
};

const SECTIONS = {
  template: {
    label: "Plantilla",
    icon: "layout",
    hint: "Elige cómo se acomoda tu sitio. Todas usan los mismos productos.",
    render: () => FieldGroup("Plantilla", TemplatePicker()),
  },
  colors: {
    label: "Colores",
    icon: "palette",
    hint: "Empieza con un estilo rápido y ajusta cada color a tu gusto.",
    render: () => [FieldGroup("Estilos rápidos", div({ class: "grid grid-cols-2 gap-2" }, THEME_PRESETS.map(PresetButton))), themeGroup("Colores")],
  },
  fonts: {
    label: "Tipografía",
    icon: "type",
    hint: "Una letra para los títulos y otra para los textos.",
    render: () => themeGroup("Tipografía"),
  },
  shape: {
    label: "Forma y fondo",
    icon: "image",
    hint: "Qué tan redondeadas son las esquinas y la imagen de fondo.",
    render: () => themeGroup("Forma y fondo"),
  },
};

export default function ThemePanel() {
  return div(
    PanelHeader("Apariencia", "Los cambios se ven al instante en la vista previa."),
    SectionChips(SECTIONS, activeSection, "Apartados de apariencia"),
    () => {
      const section = SECTIONS[activeSection.val];
      return div({ class: "space-y-4" }, GroupHint(section.icon, section.hint), section.render());
    },
  );
}
