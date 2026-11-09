import van from "vanjs-core";
import "../styles/admin.css";
import { setFavicon } from "../core/favicon.js";
import { adminStore } from "./adminStore.js";
import EditorView from "./views/EditorView.js";
import LoginView from "./views/LoginView.js";

const { div } = van.tags;

van.add(
  document.getElementById("app"),
  div(() => (adminStore.token.val ? EditorView() : LoginView())),
);

// El admin también muestra el logo del negocio en la pestaña.
van.derive(() => setFavicon(adminStore.draft.val?.business.logoUrl));

window.addEventListener("beforeunload", (event) => {
  if (adminStore.isDirty.val) event.preventDefault();
});
