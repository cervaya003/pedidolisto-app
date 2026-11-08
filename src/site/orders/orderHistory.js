// «Mis pedidos»: se consultan en el API con el correo y el teléfono que el cliente guardó en este
// navegador (su «perfil», ver checkout/customerStore.js). Sin correo guardado no hay «Mis pedidos».
// Nada de pedidos se guarda en el navegador: la fuente es la base de datos.
import van from "vanjs-core";
import { apiClient } from "../../core/apiClient.js";
import { IS_PREVIEW } from "../../core/previewChannel.js";

export const isOrdersOpen = van.state(false);
/** "idle" | "loading" | "ready" | "error" */
export const ordersStatus = van.state("idle");
export const orders = van.state([]);
export const ordersError = van.state("");

let loadedFor = ""; // perfil (correo|teléfono) de la última consulta exitosa
let pending = null;

const profileKey = (customer) => `${customer.email.trim().toLowerCase()}|${customer.phone.replace(/\D/g, "")}`;

/** Consulta los pedidos del perfil. Con `force`, aunque ya se hayan cargado (p. ej. al reintentar). */
export async function loadOrders(customer, { force = false } = {}) {
  if (!customer?.email || !customer?.phone) return;
  const key = profileKey(customer);
  if (!force && key === loadedFor && ordersStatus.rawVal === "ready") return;
  if (pending?.key === key) return pending.promise;

  ordersStatus.val = "loading";
  ordersError.val = "";
  const promise = (async () => {
    try {
      if (IS_PREVIEW) throw Object.assign(new Error("En la vista previa no se consultan pedidos reales."), { status: -1 });
      const result = await apiClient.post("/orders/mine", { email: customer.email, phone: customer.phone });
      orders.val = result.orders ?? [];
      loadedFor = key;
      ordersStatus.val = "ready";
    } catch (error) {
      ordersError.val =
        error.status === -1
          ? error.message
          : error.status === 0
            ? "No pudimos conectar. Revisa tu internet e inténtalo de nuevo."
            : error.status === 429
              ? "Consultaste muchas veces seguidas. Espera unos minutos."
              : "No pudimos cargar tus pedidos. Inténtalo de nuevo.";
      ordersStatus.val = "error";
    } finally {
      pending = null;
    }
  })();
  pending = { key, promise };
  return promise;
}

/** Tras un pedido nuevo, o al cambiar o borrar el perfil: la próxima vez que se abra se vuelve a consultar. */
export function invalidateOrders() {
  loadedFor = "";
  if (ordersStatus.rawVal === "ready") ordersStatus.val = "idle";
}

/** Al olvidar el perfil («No soy yo»): fuera los pedidos de la pantalla. */
export function resetOrders() {
  orders.val = [];
  invalidateOrders();
  ordersStatus.val = "idle";
}

export const openOrders = () => (isOrdersOpen.val = true);
export const closeOrders = () => (isOrdersOpen.val = false);
