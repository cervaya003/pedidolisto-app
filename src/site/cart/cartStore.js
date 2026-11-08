// Carrito de compras compartido por todas las plantillas.
// Cada línea es un producto con una configuración concreta (sabor, tamaño, notas…):
// el mismo pastel en vainilla y en chocolate son dos líneas distintas.
import van from "vanjs-core";
import { IS_PREVIEW } from "../../core/previewChannel.js";
import { describeChoices, unitPrice } from "../product/optionRules.js";

const STORAGE_KEY = "catalogo.cart.v2";
const MAX_QUANTITY = 99;

// Se recuerda en el navegador de cada visitante; la vista previa del admin no lo toca.
const storage = {
  read() {
    if (IS_PREVIEW) return [];
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  },
  write(value) {
    if (IS_PREVIEW) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch {
      // Almacenamiento bloqueado: el carrito dura lo que la pestaña.
    }
  },
};

/** [{ key, productId, quantity, choices: [{ group, value }], note }] */
const items = van.state(storage.read());
van.derive(() => storage.write(items.val));

export const isCartOpen = van.state(false);
/** Qué muestra el panel: "cart" (productos), "checkout" (datos del cliente) o "done" (pedido enviado). */
export const cartView = van.state("cart");

export const openCart = () => {
  cartView.val = "cart";
  isCartOpen.val = true;
};
/** Abre el panel directo en los datos del pedido (botón «Pedir ahora»). */
export const openCheckout = () => {
  cartView.val = "checkout";
  isCartOpen.val = true;
};
export const closeCart = () => {
  isCartOpen.val = false;
  cartView.val = "cart";
};
/** Botones «Realizar pedido» del sitio: con productos va a los datos; sin productos, muestra el carrito vacío. */
export const startOrder = () => (items.val.length ? openCheckout() : openCart());

const lineKey = (productId, choices = [], note = "") =>
  choices.length || note ? `${productId}|${JSON.stringify([choices.map((choice) => [choice.group, choice.value]), note])}` : productId;

const clampQuantity = (quantity) => Math.min(MAX_QUANTITY, Math.max(0, quantity));

/** Agrega al carrito. Si ya existe la misma configuración, suma la cantidad. */
export function addToCart(productId, quantity = 1, { choices = [], note = "" } = {}) {
  const key = lineKey(productId, choices, note.trim());
  const existing = items.val.find((item) => item.key === key);
  items.val = existing
    ? items.val.map((item) => (item.key === key ? { ...item, quantity: clampQuantity(item.quantity + quantity) } : item))
    : [...items.val, { key, productId, quantity: clampQuantity(quantity), choices, note: note.trim() }];
}

export function setLineQuantity(key, quantity) {
  const next = clampQuantity(quantity);
  items.val = next ? items.val.map((item) => (item.key === key ? { ...item, quantity: next } : item)) : items.val.filter((item) => item.key !== key);
}

/** Cantidad del producto sin personalizar (la que controlan los botones rápidos de las tarjetas). */
export const cartQuantity = (productId) => items.val.find((item) => item.key === productId)?.quantity ?? 0;
export const setQuantity = (productId, quantity) =>
  cartQuantity(productId) ? setLineQuantity(productId, quantity) : quantity > 0 && addToCart(productId, quantity);

export const clearCart = () => (items.val = []);

/** Líneas con el producto vigente y su precio unitario; ignora productos que ya no existen u ocultos. */
export function getCartLines(products) {
  const byId = new Map(products.map((product) => [product.id, product]));
  return items.val
    .filter((item) => byId.has(item.productId))
    .map((item) => {
      const product = byId.get(item.productId);
      return { ...item, product, unitPrice: unitPrice(product, item.choices) };
    });
}

export const getCartCount = (lines) => lines.reduce((sum, line) => sum + line.quantity, 0);
export const getCartTotal = (lines) => lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);

/** Detalle de una línea para mensajes: "Sabor: Vainilla", "Notas: …". */
export function lineDetails(line) {
  const details = describeChoices(line.choices).map(({ group, value }) => `${group}: ${value}`);
  if (line.note) details.push(`Indicaciones: ${line.note}`);
  return details;
}
