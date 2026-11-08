// Datos del cliente recordados en ESTE navegador para no pedirlos en cada pedido.
// Se guardan cifrados (AES-GCM 256) en localStorage. La llave se crea en el navegador como
// «no exportable» y vive en IndexedDB: no se puede copiar, así que los datos copiados de
// localStorage no sirven fuera de este navegador. Solo se guardan si el cliente lo acepta,
// y puede borrarlos. (Lo que de verdad protege la página es no tener XSS: VanJS no inserta HTML.)
import { IS_PREVIEW } from "../../core/previewChannel.js";

const STORAGE_KEY = "catalogo.customer.v1";
// Historial local de una versión anterior: ahora «Mis pedidos» se consulta al API. Solo se limpia.
const LEGACY_ORDERS_KEY = "catalogo.orders.v1";
const DB_NAME = "catalogo-seguro";
const DB_STORE = "llaves";
const KEY_ID = "cliente";
const IV_BYTES = 12;

const isSupported = () => !IS_PREVIEW && Boolean(globalThis.crypto?.subtle && globalThis.indexedDB);

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(DB_STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function run(db, mode, action) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(DB_STORE, mode);
    const request = action(transaction.objectStore(DB_STORE));
    transaction.oncomplete = () => resolve(request.result);
    transaction.onerror = () => reject(transaction.error);
  });
}

async function getKey({ create }) {
  const db = await openDb();
  try {
    let key = await run(db, "readonly", (store) => store.get(KEY_ID));
    if (!key && create) {
      key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
      await run(db, "readwrite", (store) => store.put(key, KEY_ID));
    }
    return key ?? null;
  } finally {
    db.close();
  }
}

// Por partes: con `...bytes` de golpe, un historial grande rebasaría el límite de argumentos.
function toBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let start = 0; start < bytes.length; start += 0x8000) binary += String.fromCharCode(...bytes.subarray(start, start + 0x8000));
  return btoa(binary);
}
const fromBase64 = (text) => Uint8Array.from(atob(text), (char) => char.charCodeAt(0));

/** Lee y descifra un valor guardado. Null si no hay, es de otro navegador o el almacenamiento está bloqueado. */
export async function loadSecure(storageKey) {
  if (!isSupported()) return null;
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey));
    if (!stored?.iv || !stored?.data) return null;
    const key = await getKey({ create: false });
    if (!key) return null;
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromBase64(stored.iv) }, key, fromBase64(stored.data));
    return JSON.parse(new TextDecoder().decode(plain));
  } catch {
    return null;
  }
}

/** Cifra y guarda un valor. Si el almacenamiento está bloqueado (modo privado, etc.), simplemente no se recuerda. */
export async function saveSecure(storageKey, value) {
  if (!isSupported()) return;
  try {
    const key = await getKey({ create: true });
    const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
    const data = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(JSON.stringify(value)));
    localStorage.setItem(storageKey, JSON.stringify({ iv: toBase64(iv), data: toBase64(data) }));
  } catch {
    // Almacenamiento lleno o bloqueado: no se recuerda.
  }
}

export const loadCustomer = () => loadSecure(STORAGE_KEY);
export const saveCustomer = (customer) => saveSecure(STORAGE_KEY, customer);

/** Olvida los datos y destruye la llave. */
export async function forgetCustomer() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_ORDERS_KEY);
    if (globalThis.indexedDB) indexedDB.deleteDatabase(DB_NAME);
  } catch {
    // Nada que borrar.
  }
}
