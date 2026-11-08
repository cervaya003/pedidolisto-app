import van from "vanjs-core";
import Icon from "../../ui/Icon.js";
import { adminStore } from "../adminStore.js";

const { div, form, h1, p, label, span, input, button } = van.tags;

export default function LoginView() {
  const password = van.state("");
  const error = van.state("");
  const isLoading = van.state(false);

  async function submit(event) {
    event.preventDefault();
    isLoading.val = true;
    error.val = "";
    try {
      await adminStore.login(password.val);
    } catch (reason) {
      error.val = reason.message;
    } finally {
      isLoading.val = false;
    }
  }

  return div(
    { class: "grid min-h-dvh place-items-center px-4" },
    form(
      { onsubmit: submit, class: "w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl ring-1 ring-zinc-900/5" },
      div({ class: "grid size-11 place-items-center rounded-xl bg-zinc-900 text-white" }, Icon("layout")),
      h1({ class: "mt-6 text-xl font-semibold" }, "Panel de administración"),
      p({ class: "mt-1 text-sm text-zinc-500" }, "Ingresa la contraseña para editar el sitio."),
      label(
        { class: "mt-6 block" },
        span({ class: "mb-1.5 block text-xs font-medium text-zinc-600" }, "Contraseña"),
        input({ class: "field-input", type: "password", autocomplete: "current-password", required: true, autofocus: true, oninput: (event) => (password.val = event.target.value) }),
      ),
      () => (error.val ? p({ class: "mt-3 text-sm text-red-600" }, error.val) : span()),
      button({ type: "submit", class: "btn-primary mt-6 w-full py-2.5", disabled: isLoading }, () => (isLoading.val ? "Entrando…" : "Entrar")),
    ),
  );
}
