// Compara lo publicado con el borrador y describe cada cambio en lenguaje simple,
// agrupado como las pestañas del panel. Lo usa la ventana «Revisar y publicar».
import { metaStore } from "../core/metaStore.js";
import { formatPrice } from "../core/format.js";
import { getBusinessGroups, getSectionFields } from "./schemas.js";
import { THEME_PRESETS } from "./themePresets.js";

const meta = () => metaStore.get() ?? {};
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const byId = (list = []) => new Map(list.map((item) => [item.id, item]));

/** Texto corto y legible de un valor para mostrar «antes → después». */
function show(value) {
  if (value === true) return "Sí";
  if (value === false) return "No";
  if (value === "" || value == null) return "vacío";
  if (Array.isArray(value)) return value.length ? `${value.length} elemento${value.length === 1 ? "" : "s"}` : "vacío";
  const text = String(value);
  if (/^https?:\/\//.test(text)) return "imagen";
  return text.length > 40 ? `${text.slice(0, 40)}…` : text;
}

/** «A → B» solo para valores cortos; con imágenes o listas basta con decir que cambió. */
function fromTo(before, after) {
  const isPlain = (value) => typeof value !== "object" && !/^https?:\/\//.test(String(value ?? ""));
  return isPlain(before) && isPlain(after) ? `${show(before)} → ${show(after)}` : "";
}

/** ¿Cambió el orden de los elementos que existen en ambas versiones? */
function orderChanged(before = [], after = []) {
  const common = new Set(before.map((item) => item.id).filter((id) => after.some((item) => item.id === id)));
  const a = before.filter((item) => common.has(item.id)).map((item) => item.id);
  const b = after.filter((item) => common.has(item.id)).map((item) => item.id);
  return !same(a, b);
}

const PRODUCT_LABELS = {
  name: "nombre",
  categoryId: "categoría",
  price: "precio",
  priceFrom: "precio «desde»",
  imageUrl: "fotos",
  gallery: "fotos",
  description: "descripción",
  details: "características",
  ingredients: "ingredientes",
  badge: "etiqueta",
  size: "tamaño en el grid",
  featured: "favorito",
  active: "visibilidad",
  customizable: "personalización",
  allowNotes: "personalización",
  options: "personalización",
};

function productChanges(before = [], after = [], business, categories) {
  const changes = [];
  const old = byId(before);
  const now = byId(after);
  const categoryName = (id) => categories.find((category) => category.id === id)?.name ?? "sin categoría";

  for (const product of after) {
    const previous = old.get(product.id);
    if (!previous) {
      changes.push({ kind: "added", title: product.name, detail: `${formatPrice(business, product.price, product.priceFrom)} · ${categoryName(product.categoryId)}` });
      continue;
    }
    if (same(previous, product)) continue;

    const keys = Object.keys({ ...previous, ...product }).filter((key) => key !== "id" && !same(previous[key], product[key]));
    const details = [];
    if (keys.includes("price")) details.push(`precio ${formatPrice(business, previous.price)} → ${formatPrice(business, product.price)}`);
    if (keys.includes("categoryId")) details.push(`categoría ${categoryName(previous.categoryId)} → ${categoryName(product.categoryId)}`);
    if (keys.includes("active")) details.push(product.active ? "ahora visible" : "oculto en el menú");
    if (keys.includes("featured")) details.push(product.featured ? "marcado como favorito" : "ya no es favorito");
    const handled = new Set(["price", "categoryId", "active", "featured", "name"]);
    const rest = [...new Set(keys.filter((key) => !handled.has(key)).map((key) => PRODUCT_LABELS[key] ?? key))];
    if (rest.length) details.push(rest.join(", "));

    const renamed = keys.includes("name");
    changes.push({
      kind: "modified",
      title: renamed ? `${previous.name} → ${product.name}` : product.name,
      detail: details.join(" · ") || (renamed ? "nombre" : ""),
    });
  }

  for (const product of before) {
    if (!now.has(product.id)) changes.push({ kind: "removed", title: product.name });
  }
  if (orderChanged(before, after)) changes.push({ kind: "moved", title: "Orden del menú", detail: "Cambió el orden de los productos" });
  return changes;
}

function categoryChanges(before = [], after = []) {
  const changes = [];
  const old = byId(before);
  const now = byId(after);
  for (const category of after) {
    const previous = old.get(category.id);
    if (!previous) changes.push({ kind: "added", title: category.name });
    else if (previous.name !== category.name) changes.push({ kind: "modified", title: category.name, detail: `Antes: ${previous.name}` });
  }
  for (const category of before) {
    if (!now.has(category.id)) changes.push({ kind: "removed", title: category.name });
  }
  if (orderChanged(before, after)) changes.push({ kind: "moved", title: "Orden de categorías", detail: "Cambió el orden" });
  return changes;
}

function sectionChanges(before = [], after = [], template) {
  const changes = [];
  const old = byId(before);
  const now = byId(after);
  const typeName = (section) => meta().sectionTypes?.[section.type] ?? section.type;

  for (const section of after) {
    const previous = old.get(section.id);
    if (!previous) {
      changes.push({ kind: "added", title: typeName(section), detail: section.props?.title ?? "" });
      continue;
    }
    if (same(previous, section)) continue;

    const details = [];
    if (previous.enabled !== section.enabled) details.push(section.enabled ? "ahora visible" : "oculta");
    const labels = new Map(getSectionFields(section.type, template).map((field) => [field.key, field.label.toLowerCase()]));
    const props = Object.keys({ ...previous.props, ...section.props }).filter((key) => !same(previous.props?.[key], section.props?.[key]));
    if (props.length) details.push([...new Set(props.map((key) => labels.get(key) ?? key))].join(", "));
    changes.push({ kind: "modified", title: typeName(section), detail: details.join(" · ") });
  }

  for (const section of before) {
    if (!now.has(section.id)) changes.push({ kind: "removed", title: typeName(section), detail: section.props?.title ?? "" });
  }
  if (orderChanged(before, after)) changes.push({ kind: "moved", title: "Orden de secciones", detail: "Cambió el orden en la página" });
  return changes;
}

/** Colores representativos de una paleta para la vista previa en la lista. */
const PALETTE_KEYS = ["background", "surface", "primary", "accent", "inverse"];
const paletteOf = (colors = {}) => PALETTE_KEYS.map((key) => colors[key]).filter(Boolean);

function themeChanges(before = {}, after = {}) {
  const changes = [];
  const { templates = {}, themeColors = {}, radiusOptions = {} } = meta();
  const label = (map, key) => map[key]?.label ?? map[key] ?? key;

  if (before.template !== after.template) {
    changes.push({ kind: "modified", title: "Plantilla", detail: `${label(templates, before.template)} → ${label(templates, after.template)}` });
  }
  // Si se eligió una paleta completa (colores + letras + esquinas), basta con decir cuál.
  const preset = THEME_PRESETS.find(
    (item) => same(item.theme.colors, after.colors) && (!item.theme.fonts || same(item.theme.fonts, after.fonts)) && (!item.theme.radius || item.theme.radius === after.radius),
  );
  const colorsPreset = preset ?? THEME_PRESETS.find((item) => same(item.theme.colors, after.colors));
  const colorsChanged = !same(before.colors, after.colors);
  const fullPreset = preset && (colorsChanged || !same(before.fonts, after.fonts) || before.radius !== after.radius);

  if (colorsChanged || fullPreset) {
    const changedKeys = Object.keys({ ...before.colors, ...after.colors }).filter((key) => before.colors?.[key] !== after.colors?.[key]);
    changes.push({
      kind: "modified",
      title: colorsPreset ? `Paleta: ${colorsPreset.name}` : "Colores",
      detail: colorsPreset
        ? fullPreset ? "Colores, letras y esquinas" : ""
        : changedKeys.map((key) => label(themeColors, key).toLowerCase()).join(", "),
      palette: [paletteOf(before.colors), paletteOf(after.colors)],
    });
  }
  if (fullPreset) {
    // Letras y esquinas ya vienen incluidas en la paleta.
  } else {
    const fonts = { heading: "Letra de títulos", body: "Letra de textos" };
    for (const [key, name] of Object.entries(fonts)) {
      if (before.fonts?.[key] !== after.fonts?.[key]) changes.push({ kind: "modified", title: name, detail: `${before.fonts?.[key]} → ${after.fonts?.[key]}` });
    }
  }
  if (!fullPreset && before.radius !== after.radius) {
    changes.push({ kind: "modified", title: "Esquinas", detail: `${label(radiusOptions, before.radius)} → ${label(radiusOptions, after.radius)}` });
  }
  if (before.backgroundImageUrl !== after.backgroundImageUrl) {
    changes.push({ kind: after.backgroundImageUrl ? (before.backgroundImageUrl ? "modified" : "added") : "removed", title: "Imagen de fondo" });
  }
  return changes;
}

function businessChanges(before = {}, after = {}) {
  const labels = new Map(getBusinessGroups().flatMap((group) => group.fields).map((field) => [field.key, field.label]));
  return Object.keys({ ...before, ...after })
    .filter((key) => !same(before[key], after[key]))
    .map((key) => ({ kind: "modified", title: labels.get(key) ?? key, detail: fromTo(before[key], after[key]) }));
}

/**
 * Lista de cambios agrupada como las pestañas del panel.
 * Devuelve [{ key, label, icon, changes: [{ kind, title, detail?, colors? }] }] solo con los grupos que cambiaron.
 */
export function summarizeChanges(published, draft) {
  if (!published || !draft) return [];
  const groups = [
    { key: "products", label: "Productos", icon: "box", changes: productChanges(published.products, draft.products, draft.business, draft.categories ?? []) },
    { key: "categories", label: "Categorías", icon: "tag", changes: categoryChanges(published.categories, draft.categories) },
    { key: "sections", label: "Secciones", icon: "layout", changes: sectionChanges(published.layout?.sections, draft.layout?.sections, draft.theme?.template) },
    { key: "theme", label: "Apariencia", icon: "palette", changes: themeChanges(published.theme, draft.theme) },
    { key: "business", label: "Negocio", icon: "store", changes: businessChanges(published.business, draft.business) },
  ];
  return groups.filter((group) => group.changes.length);
}
