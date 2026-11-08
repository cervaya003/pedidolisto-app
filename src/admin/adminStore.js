import van from "vanjs-core";
import { API_URL, ApiError, apiClient } from "../core/apiClient.js";
import { metaStore } from "../core/metaStore.js";
import { getIn, setIn } from "../core/objectPath.js";
import { compressImage } from "./imageCompression.js";

const TOKEN_STORAGE_KEY = "catalogo.admin.token";
const NOTICE_DURATION_MS = 4000;

const tokenStorage = {
  read() {
    try {
      return localStorage.getItem(TOKEN_STORAGE_KEY) ?? "";
    } catch {
      return "";
    }
  },
  write(value) {
    try {
      value ? localStorage.setItem(TOKEN_STORAGE_KEY, value) : localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
      // El almacenamiento puede estar bloqueado; la sesión dura lo que la pestaña.
    }
  },
};

const token = van.state(tokenStorage.read());
const draft = van.state(null);
const snapshot = van.state("");
const status = van.state("idle");
const formVersion = van.state(0);
const notice = van.state(null);

const isReady = van.derive(() => draft.val !== null);
const isDirty = van.derive(() => draft.val !== null && JSON.stringify(draft.val) !== snapshot.val);

let noticeTimer;
function notify(message, type = "info") {
  notice.val = { message, type };
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => (notice.val = null), NOTICE_DURATION_MS);
}

function setSite(site, { refreshForms = true } = {}) {
  draft.val = site;
  snapshot.val = JSON.stringify(site);
  if (refreshForms) formVersion.val++;
}

function logout() {
  tokenStorage.write("");
  token.val = "";
  draft.val = null;
  snapshot.val = "";
}

async function authorized(request) {
  try {
    return await request(token.val);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) logout();
    notify(error.message, "error");
    throw error;
  }
}

/** Estado único del admin: sesión, borrador editable y notificaciones. */
export const adminStore = {
  token,
  draft,
  status,
  formVersion,
  notice,
  isReady,
  isDirty,
  notify,
  logout,

  get: (path) => getIn(draft.rawVal, path),
  set: (path, value) => (draft.val = setIn(draft.rawVal, path, value)),
  refreshForms: () => formVersion.val++,

  async login(password) {
    const { token: value } = await apiClient.post("/auth/login", { password });
    tokenStorage.write(value);
    token.val = value;
  },

  async load() {
    status.val = "loading";
    try {
      const [site] = await Promise.all([
        authorized((value) => apiClient.get("/admin/site", { token: value })),
        metaStore.load(),
      ]);
      setSite(site);
    } catch {
      // `authorized` ya avisó del error.
    } finally {
      status.val = "idle";
    }
  },

  async save() {
    status.val = "saving";
    try {
      const saved = await authorized((value) => apiClient.put("/admin/site", draft.rawVal, { token: value }));
      setSite(saved, { refreshForms: false });
      notify("Cambios publicados", "success");
    } catch {
      // `authorized` ya avisó del error.
    } finally {
      status.val = "idle";
    }
  },

  /** Comprime y sube una imagen; devuelve su URL pública. Lanza el error con un mensaje legible. */
  async uploadImage(file) {
    let blob;
    try {
      blob = await compressImage(file);
    } catch (error) {
      notify(error.message, "error");
      throw error;
    }
    // Cloudinary devuelve una URL completa; MongoDB, una ruta relativa al API.
    const { url } = await authorized((value) => apiClient.upload("/admin/images", blob, { token: value }));
    return /^https?:\/\//.test(url) ? url : `${API_URL}${url}`;
  },

  discard() {
    setSite(JSON.parse(snapshot.val));
    notify("Cambios descartados");
  },
};
