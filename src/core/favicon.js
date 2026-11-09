/** Pone el logo del negocio como ícono de la pestaña. Sin logo, deja el ícono por defecto del navegador. */
export function setFavicon(url) {
  let link = document.querySelector('link[rel="icon"]');
  if (!url) {
    link?.remove();
    return;
  }
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.append(link);
  }
  if (link.href !== url) link.href = url;
}
