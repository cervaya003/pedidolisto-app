// Pantalla de acceso al panel. Fondo animado (luces difusas + rejilla), tarjeta de vidrio con entrada
// escalonada, ojito para ver la contraseña, aviso de Bloq Mayús y sacudida cuando la contraseña falla.
// Celular: solo la tarjeta centrada. Escritorio (lg): bienvenida a la izquierda y tarjeta a la derecha.
import van from "vanjs-core";
import Icon from "../../ui/Icon.js";
import { adminStore } from "../adminStore.js";

const { div, form, h1, h2, p, label, span, input, button, ul, li } = van.tags;

const FEATURES = [
  ["store", "Edita productos, precios y categorías"],
  ["palette", "Cambia colores, letras y plantilla"],
  ["receipt", "Recibe los pedidos al instante"],
];

/** Luces difusas que flotan detrás de todo. */
const Backdrop = () =>
  div(
    { class: "pointer-events-none absolute inset-0 overflow-hidden", "aria-hidden": "true" },
    div({ class: "login-blob absolute -top-32 -left-24 size-[28rem] rounded-full bg-zinc-300/60 blur-3xl" }),
    div({ class: "login-blob login-blob--2 absolute top-1/3 -right-32 size-[32rem] rounded-full bg-zinc-400/30 blur-3xl" }),
    div({ class: "login-blob login-blob--3 absolute -bottom-40 left-1/4 size-[26rem] rounded-full bg-slate-300/50 blur-3xl" }),
    div({ class: "login-grid absolute inset-0" }),
  );

/** Bienvenida (solo escritorio). */
const Welcome = () =>
  div(
    { class: "hidden max-w-md lg:block" },
    div(
      { class: "login-rise flex items-center gap-3", style: "--delay: 0ms" },
      div({ class: "grid size-11 place-items-center rounded-xl bg-zinc-900 text-white shadow-lg shadow-zinc-900/20" }, Icon("sparkle", "size-5")),
      span({ class: "text-sm font-medium tracking-wide text-zinc-500" }, "Panel de administración"),
    ),
    h2(
      { class: "login-rise mt-8 text-5xl leading-[1.05] font-semibold tracking-tight text-zinc-900", style: "--delay: 80ms" },
      "Tu catálogo,",
      span({ class: "login-gradient-text block" }, "siempre listo."),
    ),
    p({ class: "login-rise mt-5 text-lg leading-relaxed text-zinc-500", style: "--delay: 160ms" }, "Todo lo de tu negocio en un solo lugar, sin escribir código."),
    ul(
      { class: "mt-10 space-y-4" },
      FEATURES.map(([icon, text], index) =>
        li(
          { class: "login-rise flex items-center gap-3 text-zinc-700", style: `--delay: ${240 + index * 80}ms` },
          span({ class: "grid size-9 place-items-center rounded-lg bg-white text-zinc-900 shadow-xs ring-1 ring-zinc-900/10" }, Icon(icon, "size-4.5")),
          text,
        ),
      ),
    ),
  );

export default function LoginView() {
  const password = van.state("");
  const error = van.state("");
  const isLoading = van.state(false);
  const visible = van.state(false);
  const capsLock = van.state(false);

  const passwordInput = input({
    id: "admin-password",
    type: () => (visible.val ? "text" : "password"),
    autocomplete: "current-password",
    required: true,
    autofocus: true,
    placeholder: "••••••••",
    "aria-invalid": () => String(Boolean(error.val)),
    "aria-describedby": "login-error",
    class:
      "peer h-12 w-full rounded-xl border border-zinc-300 bg-white pr-12 pl-11 text-base text-zinc-900 shadow-xs transition outline-none placeholder:text-zinc-300 focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/10 aria-[invalid=true]:border-red-400 aria-[invalid=true]:ring-red-500/10",
    oninput: (event) => {
      password.val = event.target.value;
      error.val = "";
    },
    onkeyup: (event) => (capsLock.val = event.getModifierState?.("CapsLock") ?? false),
    onkeydown: (event) => (capsLock.val = event.getModifierState?.("CapsLock") ?? false),
  });

  const card = form(
    {
      onsubmit: submit,
      novalidate: true,
      class: "login-card relative w-full max-w-sm rounded-3xl bg-white/80 p-7 shadow-2xl shadow-zinc-900/10 ring-1 ring-zinc-900/5 backdrop-blur-xl sm:p-9",
    },
    div({ class: "login-rise grid size-12 place-items-center rounded-2xl bg-zinc-900 text-white shadow-lg shadow-zinc-900/25", style: "--delay: 60ms" }, Icon("lock", "size-5")),
    h1({ class: "login-rise mt-6 text-2xl font-semibold tracking-tight text-zinc-900", style: "--delay: 120ms" }, "Bienvenido de vuelta"),
    p({ class: "login-rise mt-1.5 text-sm text-zinc-500", style: "--delay: 180ms" }, "Ingresa tu contraseña para editar el sitio."),

    div(
      { class: "login-rise mt-8", style: "--delay: 240ms" },
      label({ for: "admin-password", class: "mb-2 block text-xs font-medium tracking-wide text-zinc-600" }, "Contraseña"),
      div(
        { class: "relative" },
        passwordInput,
        span({ class: "pointer-events-none absolute inset-y-0 left-0 grid w-11 place-items-center text-zinc-400 transition peer-focus:text-zinc-900" }, Icon("lock", "size-4.5")),
        button(
          {
            type: "button",
            class: "absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-xl text-zinc-400 transition hover:text-zinc-900 focus-visible:text-zinc-900 focus-visible:outline-none",
            "aria-label": () => (visible.val ? "Ocultar contraseña" : "Mostrar contraseña"),
            "aria-pressed": () => String(visible.val),
            onclick: () => {
              visible.val = !visible.val;
              passwordInput.focus();
            },
          },
          () => span({ class: "login-pop grid place-items-center" }, Icon(visible.val ? "eyeOff" : "eye", "size-5")),
        ),
      ),
      () =>
        capsLock.val
          ? p({ class: "login-pop mt-2 flex items-center gap-1.5 text-xs text-amber-600" }, Icon("info", "size-3.5"), "Bloq Mayús está activado")
          : span(),
    ),

    div(
      { id: "login-error", role: "alert", "aria-live": "polite" },
      () => (error.val ? p({ class: "login-pop mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-600/15" }, error.val) : span()),
    ),

    button(
      {
        type: "submit",
        disabled: () => isLoading.val,
        style: "--delay: 300ms",
        class:
          "login-rise login-shine group relative mt-6 flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-zinc-900 font-semibold text-white shadow-lg shadow-zinc-900/20 transition hover:bg-zinc-800 hover:shadow-zinc-900/30 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:cursor-wait disabled:opacity-80",
      },
      () =>
        isLoading.val
          ? span({ class: "flex items-center gap-2" }, Icon("loader", "size-5 animate-spin"), "Entrando…")
          : span({ class: "flex items-center gap-2" }, "Entrar", span({ class: "transition-transform group-hover:translate-x-1" }, "→")),
    ),
  );

  async function submit(event) {
    event.preventDefault();
    if (!password.val) {
      error.val = "Escribe tu contraseña.";
      shake();
      return;
    }
    isLoading.val = true;
    error.val = "";
    try {
      await adminStore.login(password.val);
    } catch (reason) {
      error.val = reason.message;
      shake();
      passwordInput.select();
    } finally {
      isLoading.val = false;
    }
  }

  // Reinicia la animación aunque falle dos veces seguidas.
  function shake() {
    card.classList.remove("login-shake");
    void card.offsetWidth;
    card.classList.add("login-shake");
  }

  return div(
    { class: "relative isolate flex min-h-dvh items-center justify-center overflow-hidden bg-zinc-100 px-4 py-10 sm:px-6" },
    Backdrop(),
    div(
      { class: "relative grid w-full max-w-5xl items-center justify-items-center gap-16 lg:grid-cols-2 lg:justify-items-stretch" },
      Welcome(),
      div({ class: "flex w-full justify-center lg:justify-end" }, card),
    ),
  );
}
