import { apiClient } from "./apiClient.js";

let meta = null;
let pending = null;

/** Catálogo de opciones del API (fuentes, tipos de sección, valores por defecto). Se pide una sola vez.
 *  `no-cache`: siempre se revalida, para que un cambio en el API (p. ej. una plantilla nueva) se vea de inmediato. */
export const metaStore = {
  load() {
    pending ??= apiClient.get("/meta", { cache: "no-cache" }).then((data) => (meta = data));
    pending.catch(() => (pending = null));
    return pending;
  },
  get: () => meta,
};
