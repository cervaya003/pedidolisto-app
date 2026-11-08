// Negocio dividido en apartados con chips (como Apariencia): Identidad, Contacto, Entregas y Región.
import van from "vanjs-core";
import SchemaForm from "../components/SchemaForm.js";
import { FieldGroup, GroupHint, PanelHeader, SectionChips } from "../components/Panel.js";
import { getBusinessGroups } from "../schemas.js";

const { div } = van.tags;

// A nivel de módulo: el apartado elegido se conserva cuando el panel se vuelve a dibujar.
const activeGroup = van.state("Identidad");

export default function BusinessPanel() {
  const groups = Object.fromEntries(getBusinessGroups().map((group) => [group.title, { ...group, label: group.title }]));

  return div(
    PanelHeader("Negocio", "Datos de identidad y contacto que aparecen en todo el sitio."),
    SectionChips(groups, activeGroup, "Apartados del negocio"),
    () => {
      const group = groups[activeGroup.val] ?? Object.values(groups)[0];
      return div({ class: "space-y-4" }, GroupHint(group.icon, group.hint), FieldGroup(group.title, SchemaForm(group.fields, "business")));
    },
  );
}
