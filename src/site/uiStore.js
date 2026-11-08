import van from "vanjs-core";

export const selectedProduct = van.state(null);

export const openProduct = (product) => (selectedProduct.val = product);
export const closeProduct = () => (selectedProduct.val = null);
