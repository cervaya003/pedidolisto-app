// Fotos del producto: hasta 5, la primera es la principal (portada de tarjetas y carrito).
// Se pueden arrastrar o elegir varias a la vez; se suben una por una ya comprimidas.
import van from "vanjs-core";
import { withConfirm } from "./ConfirmDialog.js";
import Icon from "../../ui/Icon.js";
import { metaStore } from "../../core/metaStore.js";
import { adminStore } from "../adminStore.js";

const { div, span, p, img, button, input, label } = van.tags;

const FALLBACK_MAX = 5;
const previewSrc = (url) => (url.includes("images.unsplash.com") ? `${url}?auto=format&fit=crop&w=320&q=70` : url);
const imageFiles = (files) => [...(files ?? [])].filter((file) => file.type.startsWith("image/"));

/** `path` apunta a imageUrl; la galería vive en la misma ruta base con la clave `gallery`. */
export default function GalleryField(field, path) {
  const basePath = path.slice(0, path.lastIndexOf("."));
  const maxImages = (metaStore.get()?.limits.PRODUCT_GALLERY ?? FALLBACK_MAX - 1) + 1;
  const images = van.state([adminStore.get(path), ...(adminStore.get(`${basePath}.gallery`) ?? [])].filter(Boolean));
  const uploading = van.state(0);
  const isDragging = van.state(false);
  const showLinkInput = van.state(false);
  const freeSlots = () => maxImages - images.val.length - uploading.val;

  function commit(next) {
    images.val = next;
    adminStore.set(path, next[0] ?? "");
    adminStore.set(`${basePath}.gallery`, next.slice(1));
  }

  async function upload(files) {
    const accepted = imageFiles(files).slice(0, Math.max(0, freeSlots()));
    if (imageFiles(files).length > accepted.length) {
      adminStore.notify(`Solo caben ${maxImages} fotos por producto. Se subirán ${accepted.length}.`, "error");
    }
    uploading.val += accepted.length;
    // Una por una: cuida la memoria del celular al comprimir y respeta el orden elegido.
    for (const file of accepted) {
      try {
        commit([...images.val, await adminStore.uploadImage(file)]);
      } catch {
        // adminStore ya mostró el error de esa foto; seguimos con las demás.
      } finally {
        uploading.val--;
      }
    }
    if (accepted.length) adminStore.notify(accepted.length === 1 ? "Foto subida. Publica para guardarla." : "Fotos subidas. Publica para guardarlas.", "success");
  }

  const fileInput = input({
    type: "file",
    accept: "image/*",
    multiple: true,
    class: "sr-only",
    onchange: (event) => {
      upload(event.target.files);
      event.target.value = "";
    },
  });

  const Tile = (url, index) =>
    div(
      { class: "group relative aspect-square overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100" },
      img({ src: previewSrc(url), alt: "", class: "size-full object-cover" }),
      index === 0
        ? span({ class: "absolute top-1.5 left-1.5 rounded-full bg-zinc-900/85 px-2 py-0.5 text-[10px] font-semibold text-white" }, "Principal")
        : null,
      div(
        { class: "absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-linear-to-t from-black/60 to-transparent p-1.5 pt-6" },
        index > 0
          ? button(
              {
                type: "button",
                title: "Hacer principal",
                "aria-label": "Hacer principal",
                onclick: () => commit([url, ...images.val.filter((_, position) => position !== index)]),
                class: "grid size-8 place-items-center rounded-lg bg-white/95 text-zinc-700 transition hover:text-amber-600",
              },
              Icon("star", "size-4"),
            )
          : null,
        button(
          {
            type: "button",
            title: "Quitar foto",
            "aria-label": "Quitar foto",
            onclick: withConfirm(
              { title: "¿Quitar esta foto?", message: index === 0 ? "Es la foto principal: la siguiente ocupará su lugar." : "Se quitará de la galería del producto.", confirmLabel: "Quitar foto" },
              () => commit(images.val.filter((_, position) => position !== index)),
            ),
            class: "grid size-8 place-items-center rounded-lg bg-white/95 text-zinc-700 transition hover:text-red-600",
          },
          Icon("trash", "size-4"),
        ),
      ),
    );

  const UploadingTile = () =>
    div({ class: "grid aspect-square place-items-center rounded-xl border border-zinc-200 bg-white" }, div({ class: "size-6 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900" }));

  const AddTile = () =>
    button(
      {
        type: "button",
        onclick: () => fileInput.click(),
        class: () =>
          `flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed text-zinc-500 transition hover:border-zinc-500 hover:text-zinc-900 ${
            isDragging.val ? "border-zinc-900 bg-zinc-100" : "border-zinc-300 bg-white"
          }`,
      },
      Icon("plus", "size-5"),
      span({ class: "text-xs font-medium" }, "Agregar"),
      span({ class: "text-[10px] text-zinc-400 tabular-nums" }, () => `${images.val.length} de ${maxImages}`),
    );

  return div(
    {
      class: "block",
      ondragenter: (event) => {
        event.preventDefault();
        isDragging.val = true;
      },
      ondragover: (event) => event.preventDefault(),
      ondragleave: (event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) isDragging.val = false;
      },
      ondrop: (event) => {
        event.preventDefault();
        isDragging.val = false;
        upload(event.dataTransfer.files);
      },
      onpaste: (event) => {
        if (imageFiles(event.clipboardData?.files).length) {
          event.preventDefault();
          upload(event.clipboardData.files);
        }
      },
    },
    span({ class: "mb-1.5 block text-xs font-medium text-zinc-600" }, field.label),
    fileInput,
    () =>
      div(
        { class: `grid grid-cols-3 gap-2 rounded-xl transition ${isDragging.val ? "ring-2 ring-zinc-900/20 ring-offset-4" : ""}` },
        images.val.map(Tile),
        Array.from({ length: uploading.val }, UploadingTile),
        freeSlots() > 0 ? AddTile() : null,
      ),
    div(
      { class: "mt-1.5 flex items-start justify-between gap-3" },
      p({ class: "text-xs text-zinc-400" }, `Hasta ${maxImages} fotos. Arrastra o elige varias a la vez. La ★ marca la principal.`),
      button(
        { type: "button", class: "shrink-0 text-xs font-medium text-zinc-500 underline-offset-2 hover:text-zinc-900 hover:underline", onclick: () => (showLinkInput.val = !showLinkInput.val) },
        () => (showLinkInput.val ? "Ocultar enlace" : "Usar un enlace"),
      ),
    ),
    () => {
      if (!showLinkInput.val) return span();
      const linkInput = input({ class: "field-input", type: "url", placeholder: "https://…", "aria-label": "Enlace de la foto" });
      const addLink = () => {
        const url = linkInput.value.trim();
        if (!/^https?:\/\//.test(url)) return adminStore.notify("Pega un enlace que empiece con https://", "error");
        if (freeSlots() <= 0) return adminStore.notify(`Ya tienes ${maxImages} fotos.`, "error");
        commit([...images.val, url]);
        linkInput.value = "";
      };
      return label(
        { class: "mt-2 flex gap-2" },
        span({ class: "sr-only" }, "Enlace de la foto"),
        linkInput,
        button({ type: "button", class: "btn-secondary shrink-0", onclick: addLink }, "Agregar"),
      );
    },
  );
}
