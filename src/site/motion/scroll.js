// Estado del scroll compartido por los encabezados de las tres plantillas.
// Un solo listener pasivo, recortado a un cálculo por cuadro (requestAnimationFrame).
// Los estados solo cambian cuando cruzan un umbral, así que no provocan redibujos por cada pixel.
import van from "vanjs-core";

const SCROLLED_AFTER = 8; // px: a partir de aquí el encabezado toma fondo
const HIDE_AFTER = 160; // px: antes de esto el encabezado nunca se esconde
const DIRECTION_DELTA = 10; // px: movimiento mínimo para cambiar de dirección (evita parpadeos)

/** La página ya no está hasta arriba. */
export const isScrolled = van.state(false);
/** Bajando y lejos del inicio: los encabezados se pueden recoger. Subiendo vuelve a ser falso. */
export const isScrollingDown = van.state(false);

const root = document.documentElement;
let anchorY = window.scrollY;
let isQueued = false;

function update() {
  isQueued = false;
  const y = Math.max(0, window.scrollY);

  isScrolled.val = y > SCROLLED_AFTER;

  if (y <= HIDE_AFTER) {
    isScrollingDown.val = false;
    anchorY = y;
  } else if (Math.abs(y - anchorY) >= DIRECTION_DELTA) {
    isScrollingDown.val = y > anchorY;
    anchorY = y;
  }

  // Progreso de lectura 0–1 como variable CSS: las barras lo leen sin pasar por JS ni redibujar.
  const max = root.scrollHeight - window.innerHeight;
  root.style.setProperty("--scroll-progress", max > 0 ? Math.min(1, y / max).toFixed(4) : "0");
}

const queue = () => {
  if (isQueued) return;
  isQueued = true;
  requestAnimationFrame(update);
};

window.addEventListener("scroll", queue, { passive: true });
window.addEventListener("resize", queue, { passive: true });
update();

/** Ejecuta `callback` cuando `element` ya esté en la página (las plantillas se crean antes de insertarse). */
export function onMount(element, callback, attempts = 120) {
  const check = () => {
    if (element.isConnected) callback();
    else if (--attempts > 0) requestAnimationFrame(check);
  };
  requestAnimationFrame(check);
}

/**
 * Sección visible ahora mismo, para resaltar su enlace en el menú.
 * `active` es el id visible. `attach(host)` empieza a observar cuando `host` entra a la página
 * y se desconecta solo cuando sale (la vista previa del admin redibuja la página al escribir).
 * Observa una franja a media pantalla.
 */
export function scrollSpy(ids) {
  const active = van.state("");
  const attach = (host) => {
    if ("IntersectionObserver" in window && ids.length) observe(host, ids, active);
    return host;
  };
  return { active, attach };
}

function observe(host, ids, active) {
  const visible = new Set();
  const observer = new IntersectionObserver(
    (entries) => {
      if (!host.isConnected) return observer.disconnect();
      for (const entry of entries) entry.isIntersecting ? visible.add(entry.target.id) : visible.delete(entry.target.id);
      // El primero visible en el orden del menú; si no hay ninguno (entre secciones), se queda el último.
      active.val = ids.find((id) => visible.has(id)) ?? (window.scrollY < HIDE_AFTER ? "" : active.val);
    },
    { rootMargin: "-40% 0px -55% 0px" },
  );

  onMount(host, () =>
    ids.forEach((id) => {
      const target = document.getElementById(id);
      if (target) observer.observe(target);
    }),
  );
}
