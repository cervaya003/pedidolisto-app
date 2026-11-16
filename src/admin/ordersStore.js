// Pedidos en el panel: lista filtrada por estado, conteos para el aviso del botón y cambios de estado.
// Los comprobantes son privados: se descargan con la sesión y se muestran como URL local (blob:).
import van from "vanjs-core";
import { API_URL, ApiError, apiClient } from "../core/apiClient.js";
import { adminStore } from "./adminStore.js";

const REFRESH_MS = 60_000;

/** "editor" | "orders": qué ocupa la pantalla del panel. */
export const adminView = van.state("editor");
export const ordersFilter = van.state("open");
export const ordersList = van.state([]);
export const ordersCounts = van.state({});
/** "idle" | "loading" | "ready" | "error" */
export const ordersStatus = van.state("idle");
export const hasMore = van.state(false);
/** Folio del pedido que se está actualizando (para deshabilitar sus botones). */
export const busyOrder = van.state(0);

/** Pedidos que esperan algo del dueño: el número del botón «Pedidos». */
export const pendingCount = van.derive(() => (ordersCounts.val.awaiting_deposit ?? 0) + (ordersCounts.val.new ?? 0));

async function call(request) {
  try {
    return await request(adminStore.token.val);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) adminStore.logout();
    throw error;
  }
}

const query = (filter, before) => {
  const params = new URLSearchParams();
  if (filter) params.set("status", filter);
  if (before) params.set("before", String(before));
  const text = params.toString();
  return `/admin/orders${text ? `?${text}` : ""}`;
};

/** Carga la primera página del filtro actual. `silent`: sin esqueleto (refresco en segundo plano). */
export async function loadOrders({ silent = false } = {}) {
  const filter = ordersFilter.rawVal;
  if (!silent) ordersStatus.val = "loading";
  try {
    const result = await call((token) => apiClient.get(query(filter), { token, cache: "no-store" }));
    if (filter !== ordersFilter.rawVal) return; // cambió el filtro mientras tanto
    ordersList.val = result.orders;
    ordersCounts.val = result.counts;
    hasMore.val = result.hasMore;
    ordersStatus.val = "ready";
  } catch (error) {
    if (!silent) {
      ordersStatus.val = "error";
      adminStore.notify(error.message, "error");
    }
  }
}

export async function loadMore() {
  const last = ordersList.rawVal.at(-1);
  if (!last) return;
  try {
    const result = await call((token) => apiClient.get(query(ordersFilter.rawVal, last.number), { token, cache: "no-store" }));
    ordersList.val = [...ordersList.rawVal, ...result.orders];
    hasMore.val = result.hasMore;
  } catch (error) {
    adminStore.notify(error.message, "error");
  }
}

export function setFilter(filter) {
  if (ordersFilter.rawVal === filter) return;
  ordersFilter.val = filter;
  loadOrders();
}

/** Cambia el estado de un pedido y lo reemplaza en la lista. */
export async function changeStatus(order, status) {
  busyOrder.val = order.number;
  try {
    const updated = await call((token) => apiClient.patch(`/admin/orders/${order.number}/status`, { status }, { token }));
    ordersList.val = ordersList.rawVal.map((item) => (item.number === updated.number ? updated : item));
    const messages = {
      confirmed: order.status === "awaiting_deposit" ? `Anticipo registrado: pedido ${order.folio} confirmado` : `Pedido ${order.folio} confirmado`,
      delivered: `Pedido ${order.folio} entregado`,
      cancelled: `Pedido ${order.folio} cancelado`,
    };
    adminStore.notify(messages[status] ?? "Pedido actualizado", "success");
    loadOrders({ silent: true });
  } catch (error) {
    adminStore.notify(error.message, "error");
    loadOrders({ silent: true });
  } finally {
    busyOrder.val = 0;
  }
}

// Comprobantes: una URL local por id, para no descargarlos cada vez que se redibuja la lista.
const proofUrls = new Map();

export async function proofUrl(id) {
  if (proofUrls.has(id)) return proofUrls.get(id);
  const promise = (async () => {
    const response = await fetch(`${API_URL}/admin/orders/proofs/${id}`, { headers: { Authorization: `Bearer ${adminStore.token.val}` }, cache: "no-store" });
    if (response.status === 401) adminStore.logout();
    if (!response.ok) throw new Error("No se pudo cargar el comprobante");
    return URL.createObjectURL(await response.blob());
  })();
  proofUrls.set(id, promise);
  promise.catch(() => proofUrls.delete(id));
  return promise;
}

let timer = null;

/** Conteos al entrar y cada minuto mientras haya sesión: el botón avisa de pedidos nuevos. */
export function startOrdersPolling() {
  if (timer) return;
  loadOrders({ silent: true });
  timer = setInterval(() => {
    if (!adminStore.token.rawVal) return stopOrdersPolling();
    if (document.visibilityState === "visible") loadOrders({ silent: true });
  }, REFRESH_MS);
}

export function stopOrdersPolling() {
  clearInterval(timer);
  timer = null;
  ordersList.val = [];
  ordersCounts.val = {};
  ordersStatus.val = "idle";
  for (const promise of proofUrls.values()) promise.then((url) => URL.revokeObjectURL(url)).catch(() => {});
  proofUrls.clear();
}

// Al cerrar sesión: fuera pedidos y comprobantes de la memoria.
window.addEventListener("admin:logout", () => {
  stopOrdersPolling();
  adminView.val = "editor";
});
