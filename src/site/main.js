import van from "vanjs-core";
import "../styles/site.css";
import App from "./App.js";
import { metaStore } from "../core/metaStore.js";
import { IS_PREVIEW, previewChannel } from "../core/previewChannel.js";
import { siteStore } from "../core/siteStore.js";
import { applyTheme } from "../core/theme.js";

van.derive(() => {
  const site = siteStore.site.val;
  if (!site) return;

  applyTheme(site.theme);
  const { name, tagline } = site.business;
  document.title = tagline ? `${name} · ${tagline}` : name;
});

van.add(document.getElementById("app"), App());

if (IS_PREVIEW) {
  document.documentElement.classList.add("is-preview");
  // La vista previa recibe el borrador desde el admin en vez de pedirlo al API.
  previewChannel.onSite(siteStore.set);
  // Ctrl + rueda dentro de la vista previa ajusta su propio zoom, no el del navegador.
  window.addEventListener(
    "wheel",
    (event) => {
      if (!event.ctrlKey) return;
      event.preventDefault();
      previewChannel.requestZoom(event.deltaY < 0 ? 1 : -1);
    },
    { passive: false },
  );
  metaStore.load().finally(previewChannel.announceReady);
} else {
  siteStore.load();
}
