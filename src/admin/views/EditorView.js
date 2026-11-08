import van from "vanjs-core";
import PreviewPanel from "./PreviewPanel.js";
import Toolbar from "./Toolbar.js";
import SidebarResizer, { sidebarWidth } from "../components/SidebarResizer.js";
import Toast from "../components/Toast.js";
import Icon from "../../ui/Icon.js";
import { adminStore } from "../adminStore.js";
import { PANELS } from "../panels/index.js";

const { div, aside, nav, button, span } = van.tags;

const activeTab = van.state(Object.keys(PANELS)[0]);
const mobileMode = van.state("edit");

const TabBar = () =>
  nav(
    // En celular va abajo, al alcance del pulgar; en escritorio, arriba del panel.
    {
      class:
        "order-last grid shrink-0 grid-cols-5 border-t border-zinc-200 bg-white pb-[env(safe-area-inset-bottom)] lg:order-none lg:border-t-0 lg:border-b lg:pb-0",
      "aria-label": "Secciones del panel",
    },
    Object.entries(PANELS).map(([key, panel]) =>
      button(
        {
          type: "button",
          onclick: () => (activeTab.val = key),
          "aria-pressed": () => String(activeTab.val === key),
          class: () =>
            `flex flex-col items-center gap-1 px-1 py-2.5 text-[11px] font-medium transition max-lg:border-t-2 lg:border-b-2 ${
              activeTab.val === key ? "border-zinc-900 text-zinc-900" : "border-transparent text-zinc-400 hover:text-zinc-700"
            }`,
        },
        Icon(panel.icon, "size-5"),
        span(panel.label),
      ),
    ),
  );

const Loader = () => div({ class: "grid h-40 place-items-center" }, div({ class: "size-6 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900" }));

export default function EditorView() {
  if (!adminStore.draft.rawVal) adminStore.load();

  return div(
    { class: "flex h-dvh flex-col" },
    Toolbar({ mobileMode }),
    div(
      { class: "flex min-h-0 flex-1" },
      aside(
        {
          class: () =>
            `relative w-full shrink-0 flex-col border-r border-zinc-200 bg-zinc-50 lg:flex lg:w-(--sidebar-width) ${mobileMode.val === "edit" ? "flex" : "hidden"}`,
          style: () => `--sidebar-width: ${sidebarWidth.val}px`,
        },
        SidebarResizer(),
        TabBar(),
        div({ class: "min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5" }, () => {
          adminStore.formVersion.val;
          return adminStore.isReady.val ? PANELS[activeTab.val].render() : Loader();
        }),
      ),
      PreviewPanel({ isVisible: () => mobileMode.val === "preview" }),
    ),
    Toast(),
  );
}
