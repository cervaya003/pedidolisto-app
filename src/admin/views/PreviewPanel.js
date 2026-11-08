import van from "vanjs-core";
import Icon from "../../ui/Icon.js";
import { previewChannel } from "../../core/previewChannel.js";
import { adminStore } from "../adminStore.js";

const { section, div, button, iframe, span } = van.tags;

// `width: null` = ocupa todo el espacio disponible (escritorio).
const DEVICES = {
  desktop: { label: "Escritorio", icon: "monitor", width: null },
  tablet: { label: "Tablet", icon: "tablet", width: 768 },
  mobile: { label: "Celular", icon: "phone", width: 390 },
};

// Zoom propio de la vista previa: no depende del zoom del navegador.
const ZOOM_STEPS = [0.25, 0.33, 0.5, 0.67, 0.75, 0.9, 1, 1.1, 1.25, 1.5];
const DEFAULT_ZOOM = 1;
const ZOOM_STORAGE_KEY = "catalogo.admin.previewZoom";
const PREVIEW_DEBOUNCE_MS = 250;

const zoomStorage = {
  read() {
    try {
      const value = Number(localStorage.getItem(ZOOM_STORAGE_KEY));
      return ZOOM_STEPS.includes(value) ? value : DEFAULT_ZOOM;
    } catch {
      return DEFAULT_ZOOM;
    }
  },
  write(value) {
    try {
      localStorage.setItem(ZOOM_STORAGE_KEY, String(value));
    } catch {
      // Almacenamiento bloqueado: el zoom dura lo que la pestaña.
    }
  },
};

// A nivel de módulo: dispositivo y zoom se conservan aunque el panel se vuelva a dibujar.
const device = van.state("desktop");
const zoom = van.state(zoomStorage.read());

function setZoom(value) {
  zoom.val = value;
  zoomStorage.write(value);
}

/** Siguiente paso de zoom hacia arriba (+1) o hacia abajo (-1), respetando los topes. */
function stepZoom(direction) {
  const index = ZOOM_STEPS.indexOf(zoom.val);
  const next = ZOOM_STEPS[Math.min(ZOOM_STEPS.length - 1, Math.max(0, index + direction))];
  if (next !== zoom.val) setZoom(next);
}

const ToolbarButton = ({ label, isActive = () => false, disabled = () => false, onclick }, content) =>
  button(
    {
      type: "button",
      title: label,
      "aria-label": label,
      "aria-pressed": () => String(isActive()),
      disabled,
      onclick,
      class: () => `btn-icon size-9 ${isActive() ? "bg-zinc-900 text-white hover:bg-zinc-900 hover:text-white" : ""}`,
    },
    content,
  );

function ZoomControls() {
  return div(
    { class: "flex items-center gap-0.5 rounded-lg border border-zinc-200 bg-white p-0.5", role: "group", "aria-label": "Zoom de la vista previa" },
    ToolbarButton({ label: "Alejar", disabled: () => zoom.val <= ZOOM_STEPS[0], onclick: () => stepZoom(-1) }, Icon("minus", "size-4")),
    button(
      {
        type: "button",
        title: "Restablecer al 100 %",
        "aria-label": () => `Zoom ${Math.round(zoom.val * 100)} %, restablecer al 100 %`,
        onclick: () => setZoom(DEFAULT_ZOOM),
        class: "h-9 min-w-14 rounded-md px-1 text-xs font-semibold text-zinc-700 tabular-nums transition hover:bg-zinc-100",
      },
      () => `${Math.round(zoom.val * 100)}%`,
    ),
    ToolbarButton({ label: "Acercar", disabled: () => zoom.val >= ZOOM_STEPS.at(-1), onclick: () => stepZoom(1) }, Icon("plus", "size-4")),
  );
}

export default function PreviewPanel({ isVisible }) {
  const stageSize = van.state({ width: 0, height: 0 });
  const frame = iframe({
    src: "/?preview",
    title: "Vista previa del sitio",
    class: "block border-0 bg-white",
    style: () => {
      const { width, height } = frameLayout();
      return `width:${width}px;height:${height}px;transform:scale(${zoom.val});transform-origin:0 0`;
    },
  });

  // Tamaño "real" de la página dentro del iframe: con zoom 50 % cabe el doble de página.
  function frameLayout() {
    const stage = stageSize.val;
    const deviceWidth = DEVICES[device.val].width;
    return {
      width: Math.max(1, Math.round(deviceWidth ?? stage.width / zoom.val)),
      height: Math.max(1, Math.round(stage.height / zoom.val)),
    };
  }

  const sendDraft = () => previewChannel.sendSite(frame.contentWindow, adminStore.draft.rawVal);
  previewChannel.onReady(sendDraft);
  previewChannel.onZoom(stepZoom);
  // Mientras se escribe, la vista previa se actualiza al hacer una pausa breve, no con cada letra:
  // la página de muestra no se redibuja a cada tecla y el admin se siente fluido.
  let pendingSend;
  van.derive(() => {
    adminStore.draft.val;
    clearTimeout(pendingSend);
    pendingSend = setTimeout(sendDraft, PREVIEW_DEBOUNCE_MS);
  });

  const stage = div(
    {
      class: "flex min-h-0 flex-1 justify-center overflow-auto p-3 sm:p-5",
      // Ctrl + rueda sobre la vista previa: zoom solo de la vista previa, no del navegador.
      onwheel: (event) => {
        if (!event.ctrlKey) return;
        event.preventDefault();
        stepZoom(event.deltaY < 0 ? 1 : -1);
      },
    },
    div(
      {
        class: "shrink-0 overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-zinc-900/10 transition-[width] duration-300",
        style: () => {
          const { width, height } = frameLayout();
          return `width:${Math.round(width * zoom.val)}px;height:${Math.round(height * zoom.val)}px`;
        },
      },
      frame,
    ),
  );

  // Medimos el área disponible (sin el padding) para calcular el tamaño del iframe.
  new ResizeObserver(([entry]) => {
    const { width, height } = entry.contentRect;
    stageSize.val = { width: Math.floor(width), height: Math.floor(height) };
  }).observe(stage);

  return section(
    { class: () => `min-w-0 flex-1 flex-col ${isVisible() ? "flex" : "hidden"} lg:flex` },
    div(
      { class: "flex h-12 shrink-0 items-center justify-between gap-2 border-b border-zinc-200 bg-white/60 px-3" },
      span({ class: "hidden w-36 sm:block", "aria-hidden": "true" }),
      div(
        { class: "flex items-center gap-1" },
        Object.entries(DEVICES).map(([key, item]) =>
          ToolbarButton({ label: item.label, isActive: () => device.val === key, onclick: () => (device.val = key) }, Icon(item.icon, "size-4")),
        ),
      ),
      div({ class: "flex w-36 justify-end" }, ZoomControls()),
    ),
    stage,
  );
}
