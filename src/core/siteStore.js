import van from "vanjs-core";
import { apiClient } from "./apiClient.js";
import { metaStore } from "./metaStore.js";

const site = van.state(null);
const hasError = van.state(false);

async function load() {
  try {
    const [data] = await Promise.all([apiClient.get("/site"), metaStore.load()]);
    site.val = data;
  } catch (error) {
    console.error("No se pudo cargar el sitio.", error);
    hasError.val = true;
  }
}

/** Estado único del sitio público. */
export const siteStore = {
  site,
  hasError,
  load,
  set: (data) => (site.val = data),
};
