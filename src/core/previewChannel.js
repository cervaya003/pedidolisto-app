// Comunicación entre el admin y la vista previa (iframe) del sitio.
const MESSAGE_SITE = "preview:site";
const MESSAGE_READY = "preview:ready";
const MESSAGE_ZOOM = "preview:zoom";

export const IS_PREVIEW = new URLSearchParams(location.search).has("preview");

function listen(type, callback) {
  window.addEventListener("message", (event) => {
    if (event.origin === location.origin && event.data?.type === type) callback(event.data);
  });
}

export const previewChannel = {
  sendSite: (target, site) => site && target?.postMessage({ type: MESSAGE_SITE, site }, location.origin),
  announceReady: () => window.parent.postMessage({ type: MESSAGE_READY }, location.origin),
  onSite: (callback) => listen(MESSAGE_SITE, (data) => callback(data.site)),
  onReady: (callback) => listen(MESSAGE_READY, callback),
  /** La vista previa pide acercar (+1) o alejar (-1): Ctrl + rueda dentro del iframe. */
  requestZoom: (direction) => window.parent.postMessage({ type: MESSAGE_ZOOM, direction }, location.origin),
  onZoom: (callback) => listen(MESSAGE_ZOOM, (data) => callback(data.direction)),
};
