import van from "vanjs-core";
import Icon from "../../ui/Icon.js";
import { adminStore } from "../adminStore.js";

const { header, div, p, span, a, button } = van.tags;

const statusLabel = () => {
  if (adminStore.status.val === "loading") return "Cargando…";
  if (adminStore.status.val === "saving") return "Publicando…";
  return adminStore.isDirty.val ? "Cambios sin publicar" : "Todo publicado";
};

export default function Toolbar({ mobileMode }) {
  const isBusy = () => adminStore.status.val !== "idle";

  return header(
    { class: "flex h-14 shrink-0 items-center gap-2 border-b border-zinc-200 bg-white px-3 sm:gap-3 sm:px-4" },
    div(
      { class: "flex min-w-0 items-center gap-3" },
      span({ class: "grid size-8 shrink-0 place-items-center rounded-lg bg-zinc-900 text-white" }, Icon("layout", "size-4")),
      div(
        { class: "min-w-0" },
        p({ class: "truncate text-sm font-semibold" }, () => adminStore.draft.val?.business.name ?? "Panel"),
        p(
          { class: "flex items-center gap-1.5 truncate text-xs whitespace-nowrap text-zinc-500" },
          span({ class: () => `size-1.5 shrink-0 rounded-full ${adminStore.isDirty.val ? "bg-amber-500" : "bg-emerald-500"}` }),
          statusLabel,
        ),
      ),
    ),
    div(
      { class: "ml-auto flex items-center gap-1.5 sm:gap-2" },
      button(
        {
          type: "button",
          class: "btn-secondary max-sm:px-2.5 lg:hidden",
          "aria-label": () => (mobileMode.val === "edit" ? "Vista previa" : "Editar"),
          onclick: () => (mobileMode.val = mobileMode.val === "edit" ? "preview" : "edit"),
        },
        () => Icon(mobileMode.val === "edit" ? "eye" : "layout", "size-4"),
        () => span({ class: "hidden sm:inline" }, mobileMode.val === "edit" ? "Vista previa" : "Editar"),
      ),
      a({ href: "/", target: "_blank", rel: "noopener", class: "btn-icon sm:size-9", title: "Ver sitio publicado", "aria-label": "Ver sitio publicado" }, Icon("external", "size-4")),
      button(
        { type: "button", class: "btn-secondary hidden sm:inline-flex", disabled: () => !adminStore.isDirty.val || isBusy(), onclick: adminStore.discard },
        "Descartar",
      ),
      button(
        { type: "button", class: "btn-primary", disabled: () => !adminStore.isDirty.val || isBusy(), onclick: adminStore.save },
        () => (adminStore.status.val === "saving" ? "Publicando…" : "Publicar"),
      ),
      button({ type: "button", class: "btn-icon sm:size-9", title: "Cerrar sesión", "aria-label": "Cerrar sesión", onclick: adminStore.logout }, Icon("logout", "size-4")),
    ),
  );
}
