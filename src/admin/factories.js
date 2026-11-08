import { metaStore } from "../core/metaStore.js";

const shortId = () => crypto.randomUUID().slice(0, 8);

// Los valores por defecto vienen del API (/meta): no se duplican en el frontend.

export const createSection = (type) => ({
  id: `${type}-${shortId()}`,
  type,
  enabled: true,
  props: structuredClone(metaStore.get().sectionDefaults[type]),
});

export const createCategory = (name = "Nueva categoría") => ({ id: `cat-${shortId()}`, name });

export const createProduct = (categoryId) => ({
  id: `prod-${shortId()}`,
  ...structuredClone(metaStore.get().productDefaults),
  categoryId,
});
