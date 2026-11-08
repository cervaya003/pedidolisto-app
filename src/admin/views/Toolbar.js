import van from "vanjs-core";
import Icon from "../../ui/Icon.js";
import { adminStore } from "../adminStore.js";
import { summarizeChanges } from "../changeSummary.js";
import { openDiscardDialog, openPublishDialog } from "../components/PublishDialog.js";

const { header, div, p, span, a, button } = van.tags;

/** Cuántos cambios hay sin publicar (número en el botón «Publicar»). */
const pendingCount = () =>
  adminStore.isDirty.val ? summarizeChanges(adminStore.published.val, adminStore.draft.val).reduce((sum, group) => sum + group.changes.length, 0) : 0;

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
        { type: "button", class: "btn-secondary hidden sm:inline-flex", disabled: () => !adminStore.isDirty.val || isBusy(), onclick: openDiscardDialog },
        "Descartar",
      ),
      button(
        { type: "button", class: "btn-primary", title: "Revisar cambios y publicar", disabled: () => !adminStore.isDirty.val || isBusy(), onclick: openPublishDialog },
        () => (adminStore.status.val === "saving" ? "Publicando…" : "Publicar"),
        () => {
          const count = pendingCount();
          return count && adminStore.status.val !== "saving"
            ? span({ class: "grid min-w-5 place-items-center rounded-full bg-white/20 px-1.5 text-[11px] leading-5 font-semibold tabular-nums" }, count)
            : span();
        },
      ),
      button({ type: "button", class: "btn-icon sm:size-9", title: "Cerrar sesión", "aria-label": "Cerrar sesión", onclick: adminStore.logout }, Icon("logout", "size-4")),
    ),
  );
}
