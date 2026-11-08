import van from "vanjs-core";
import { withConfirm } from "./ConfirmDialog.js";
import Icon from "../../ui/Icon.js";
import { adminStore } from "../adminStore.js";

const { div, label, input, span, p, img, button } = van.tags;

const previewSrc = (url) => (url.includes("images.unsplash.com") ? `${url}?auto=format&fit=crop&w=640&q=70` : url);
const firstImage = (files) => [...(files ?? [])].find((file) => file.type.startsWith("image/"));

/**
 * Campo de imagen: arrastrar y soltar, tocar para elegir (en celular abre cámara o galería) o pegar.
 * La foto se comprime en el navegador, se sube al API y se guarda su URL en `path`.
 */
export default function ImageField(field, path) {
  const url = van.state(adminStore.get(path) ?? "");
  const isUploading = van.state(false);
  const isDragging = van.state(false);
  const showLinkInput = van.state(false);
  const fit = field.fit === "contain" ? "object-contain p-3" : "object-cover";

  const setUrl = (value) => {
    url.val = value;
    adminStore.set(path, value);
  };

  async function upload(file) {
    if (!file || isUploading.val) return;
    isUploading.val = true;
    try {
      setUrl(await adminStore.uploadImage(file));
      adminStore.notify("Imagen subida. Publica para guardarla en el sitio.", "success");
    } catch {
      // adminStore ya mostró el error.
    } finally {
      isUploading.val = false;
    }
  }

  const fileInput = input({
    type: "file",
    accept: "image/*",
    class: "sr-only",
    onchange: (event) => {
      upload(event.target.files[0]);
      event.target.value = "";
    },
  });
  const pickFile = () => fileInput.click();

  const dropHandlers = {
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
      upload(firstImage(event.dataTransfer.files));
    },
    onpaste: (event) => {
      const file = firstImage(event.clipboardData?.files);
      if (file) {
        event.preventDefault();
        upload(file);
      }
    },
  };

  const UploadingOverlay = () =>
    div(
      { class: () => `absolute inset-0 grid place-items-center bg-white/80 backdrop-blur-sm ${isUploading.val ? "" : "hidden"}` },
      div(
        { class: "flex flex-col items-center gap-2 text-sm font-medium text-zinc-700" },
        div({ class: "size-6 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900" }),
        "Subiendo…",
      ),
    );

  const Preview = () =>
    div(
      {
        ...dropHandlers,
        tabindex: "0",
        class: () =>
          `group relative aspect-[4/3] overflow-hidden rounded-xl border bg-zinc-100 outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30 ${
            isDragging.val ? "border-zinc-900 ring-2 ring-zinc-900/20" : "border-zinc-200"
          }`,
      },
      img({ src: () => previewSrc(url.val), alt: "", class: `size-full ${fit}` }),
      div(
        { class: "absolute inset-x-0 bottom-0 flex gap-2 bg-linear-to-t from-black/60 to-transparent p-3 pt-10" },
        button({ type: "button", onclick: pickFile, class: "btn-secondary flex-1 border-transparent bg-white/95" }, Icon("image", "size-4"), "Cambiar"),
        button(
          {
            type: "button",
            onclick: withConfirm({ title: "¿Quitar esta imagen?", message: `Se quitará la imagen de «${field.label}».`, confirmLabel: "Quitar imagen" }, () => setUrl("")),
            "aria-label": "Quitar imagen", title: "Quitar imagen", class: "btn-secondary border-transparent bg-white/95 px-3 hover:text-red-600" },
          Icon("trash", "size-4"),
        ),
      ),
      div(
        { class: () => `absolute inset-0 grid place-items-center bg-zinc-900/60 text-sm font-semibold text-white ${isDragging.val ? "" : "hidden"}` },
        "Suelta para reemplazar",
      ),
      UploadingOverlay(),
    );

  const DropZone = () =>
    div(
      {
        ...dropHandlers,
        role: "button",
        tabindex: "0",
        onclick: pickFile,
        onkeydown: (event) => (event.key === "Enter" || event.key === " ") && (event.preventDefault(), pickFile()),
        class: () =>
          `relative flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30 ${
            isDragging.val ? "border-zinc-900 bg-zinc-100" : "border-zinc-300 bg-white hover:border-zinc-500 hover:bg-zinc-50"
          }`,
      },
      span({ class: "grid size-11 place-items-center rounded-full bg-zinc-100 text-zinc-500" }, Icon("image", "size-5")),
      p({ class: "text-sm font-medium text-zinc-800" }, span({ class: "hidden sm:inline" }, "Arrastra una foto aquí o "), span({ class: "sm:hidden" }, "Toca para "), "elegir una imagen"),
      p({ class: "text-xs text-zinc-400" }, "JPG, PNG o WebP · se optimiza automáticamente"),
      UploadingOverlay(),
    );

  return div(
    { class: "block" },
    span({ class: "mb-1.5 block text-xs font-medium text-zinc-600" }, field.label),
    fileInput,
    () => (url.val ? Preview() : DropZone()),
    div(
      { class: "mt-1.5 flex items-start justify-between gap-3" },
      field.hint ? p({ class: "text-xs text-zinc-400" }, field.hint) : span(),
      button(
        { type: "button", class: "shrink-0 text-xs font-medium text-zinc-500 underline-offset-2 hover:text-zinc-900 hover:underline", onclick: () => (showLinkInput.val = !showLinkInput.val) },
        () => (showLinkInput.val ? "Ocultar enlace" : "Usar un enlace"),
      ),
    ),
    () =>
      showLinkInput.val
        ? label(
            { class: "mt-2 block" },
            span({ class: "sr-only" }, "Enlace de la imagen"),
            input({ class: "field-input", type: "url", placeholder: "https://…", value: url.rawVal, oninput: (event) => setUrl(event.target.value.trim()) }),
          )
        : span(),
  );
}
