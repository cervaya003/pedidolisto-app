// Borde arrastrable para ajustar el ancho del panel lateral (solo escritorio).
// Con topes mínimo y máximo, teclado (flechas) y doble clic para volver al tamaño normal.
import van from "vanjs-core";

const { div, span } = van.tags;

const STORAGE_KEY = "catalogo.admin.sidebarWidth";
export const SIDEBAR_DEFAULT = 416;
const SIDEBAR_MIN = 320;
const SIDEBAR_MAX = 640;
const MAX_VIEWPORT_SHARE = 0.6; // nunca más del 60 % de la pantalla, para que la vista previa siga visible
const KEYBOARD_STEP = 16;

const maxWidth = () => Math.max(SIDEBAR_MIN, Math.min(SIDEBAR_MAX, Math.round(window.innerWidth * MAX_VIEWPORT_SHARE)));
const clamp = (value) => Math.min(maxWidth(), Math.max(SIDEBAR_MIN, Math.round(value)));

const storage = {
  read() {
    try {
      return Number(localStorage.getItem(STORAGE_KEY)) || SIDEBAR_DEFAULT;
    } catch {
      return SIDEBAR_DEFAULT;
    }
  },
  write(value) {
    try {
      localStorage.setItem(STORAGE_KEY, String(value));
    } catch {
      // Almacenamiento bloqueado: el ancho dura lo que la pestaña.
    }
  },
};

export const sidebarWidth = van.state(clamp(storage.read()));
window.addEventListener("resize", () => (sidebarWidth.val = clamp(sidebarWidth.val)));

function setWidth(value) {
  sidebarWidth.val = clamp(value);
  storage.write(sidebarWidth.val);
}

export default function SidebarResizer() {
  let startX = 0;
  let startWidth = 0;

  const stop = (event) => {
    if (!document.body.classList.contains("is-resizing")) return;
    document.body.classList.remove("is-resizing");
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    storage.write(sidebarWidth.val);
  };

  return div(
    {
      role: "separator",
      tabindex: "0",
      "aria-orientation": "vertical",
      "aria-label": "Ajustar ancho del panel",
      title: "Arrastra para ajustar el ancho · doble clic para restablecer",
      "aria-valuemin": SIDEBAR_MIN,
      "aria-valuemax": maxWidth,
      "aria-valuenow": () => sidebarWidth.val,
      class: "group absolute inset-y-0 -right-2 z-20 hidden w-4 cursor-col-resize touch-none outline-none lg:block",
      onpointerdown: (event) => {
        event.preventDefault();
        startX = event.clientX;
        startWidth = sidebarWidth.val;
        event.currentTarget.setPointerCapture(event.pointerId);
        document.body.classList.add("is-resizing");
      },
      onpointermove: (event) => {
        if (document.body.classList.contains("is-resizing")) sidebarWidth.val = clamp(startWidth + event.clientX - startX);
      },
      onpointerup: stop,
      onpointercancel: stop,
      ondblclick: () => setWidth(SIDEBAR_DEFAULT),
      onkeydown: (event) => {
        const step = { ArrowLeft: -KEYBOARD_STEP, ArrowRight: KEYBOARD_STEP }[event.key];
        if (step) {
          event.preventDefault();
          setWidth(sidebarWidth.val + step);
        }
        if (event.key === "Home") setWidth(SIDEBAR_MIN);
        if (event.key === "End") setWidth(maxWidth());
      },
    },
    // Línea visible al pasar el mouse, al arrastrar o con el foco del teclado.
    span({
      class:
        "absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-transparent transition-colors group-hover:bg-zinc-400 group-focus-visible:bg-zinc-900 [.is-resizing_&]:bg-zinc-900",
    }),
    span({
      class:
        "absolute top-1/2 left-1/2 h-10 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-300 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100 [.is-resizing_&]:bg-zinc-900 [.is-resizing_&]:opacity-100",
    }),
  );
}
