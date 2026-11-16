// Pedidos: lo que llegó, qué falta cobrar y qué toca entregar. El dueño confirma el anticipo
// SOLO después de verlo en su banco (un comprobante se puede falsificar; el saldo del banco, no).
import van from "vanjs-core";
import Icon from "../../ui/Icon.js";
import {
  busyOrder,
  changeStatus,
  hasMore,
  loadMore,
  loadOrders,
  ordersCounts,
  ordersFilter,
  ordersList,
  ordersStatus,
  proofUrl,
  setFilter,
} from "../ordersStore.js";

const { div, section, header, h1, h2, h3, p, span, button, ul, li, a, img, dialog, nav } = van.tags;

const FILTERS = [
  { key: "open", label: "Por atender", count: (counts) => (counts.awaiting_deposit ?? 0) + (counts.new ?? 0) + (counts.confirmed ?? 0) },
  { key: "awaiting_deposit", label: "Esperando anticipo" },
  { key: "new", label: "Nuevos" },
  { key: "confirmed", label: "Confirmados" },
  { key: "delivered", label: "Entregados" },
  { key: "cancelled", label: "Cancelados" },
  { key: "", label: "Todos", count: (counts) => Object.values(counts).reduce((sum, value) => sum + value, 0) },
];

const STATUS_STYLES = {
  awaiting_deposit: "bg-amber-100 text-amber-800 ring-amber-200",
  new: "bg-sky-100 text-sky-800 ring-sky-200",
  confirmed: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  delivered: "bg-zinc-100 text-zinc-600 ring-zinc-200",
  cancelled: "bg-red-50 text-red-700 ring-red-200",
};
const STATUS_ICONS = { awaiting_deposit: "clock", new: "sparkle", confirmed: "check", delivered: "box", cancelled: "close" };

// ── Formato ─────────────────────────────────────────────────────────────────────────────────

const money = (order, value) => {
  try {
    return new Intl.NumberFormat(order.locale || "es-MX", { style: "currency", currency: order.currency || "MXN" }).format(value ?? 0);
  } catch {
    return `$${value}`;
  }
};

const dateTime = (value, options = { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) =>
  value ? new Date(value).toLocaleString("es-MX", options) : "";

const longDate = (value) => {
  if (!value) return "";
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
};

/** "en 5 h", "hace 2 días" */
function relative(value) {
  const diff = new Date(value).getTime() - Date.now();
  const abs = Math.abs(diff);
  const units = [
    ["day", 86_400_000],
    ["hour", 3_600_000],
    ["minute", 60_000],
  ];
  const [unit, size] = units.find(([, ms]) => abs >= ms) ?? units.at(-1);
  return new Intl.RelativeTimeFormat("es-MX", { numeric: "auto" }).format(Math.round(diff / size), unit);
}

const waLink = (phone, text) => `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;

// ── Confirmación ────────────────────────────────────────────────────────────────────────────

const confirmState = van.state(null);
let confirmDialog = null;
let resolveConfirm = null;

function closeConfirm(result) {
  confirmDialog?.close();
  resolveConfirm?.(result);
  resolveConfirm = null;
}

function askConfirm(options) {
  if (!confirmDialog) {
    confirmDialog = dialog(
      {
        class: "m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl bg-white p-0 shadow-2xl backdrop:bg-zinc-900/40 backdrop:backdrop-blur-[2px]",
        oncancel: (event) => {
          event.preventDefault();
          closeConfirm(false);
        },
        onclick: (event) => event.target === confirmDialog && closeConfirm(false),
      },
      () => {
        const state = confirmState.val;
        if (!state) return div();
        return div(
          { class: "p-5" },
          div(
            { class: "flex items-start gap-3" },
            span({ class: `grid size-10 shrink-0 place-items-center rounded-full ${state.danger ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}` }, Icon(state.icon, "size-5")),
            div({ class: "min-w-0" }, h2({ class: "text-base font-semibold text-zinc-900" }, state.title), p({ class: "mt-1 text-sm text-zinc-500" }, state.message)),
          ),
          state.note ? p({ class: "mt-4 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800" }, Icon("shield", "mt-px size-3.5 shrink-0"), state.note) : null,
          div(
            { class: "mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end" },
            button({ type: "button", class: "btn-secondary", autofocus: true, onclick: () => closeConfirm(false) }, "Volver"),
            button(
              { type: "button", class: `btn-primary ${state.danger ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"}`, onclick: () => closeConfirm(true) },
              state.confirmLabel,
            ),
          ),
        );
      },
    );
    document.body.append(confirmDialog);
  }
  resolveConfirm?.(false);
  confirmState.val = options;
  confirmDialog.showModal();
  return new Promise((resolve) => (resolveConfirm = resolve));
}

// Qué dice cada acción según el estado actual del pedido.
function actionFor(order, status) {
  if (status === "confirmed" && order.status === "awaiting_deposit") {
    return {
      label: "Anticipo recibido",
      icon: "check",
      tone: "primary",
      confirm: {
        icon: "coin",
        title: `¿Recibiste ${money(order, order.deposit)}?`,
        message: `El pedido ${order.folio} pasa a «Confirmado» y, si dejó correo, a ${order.customer.name} le llega el aviso.`,
        note: "Confirma solo si ya ves el dinero en tu app del banco. Un comprobante en foto se puede falsificar.",
        confirmLabel: "Sí, ya lo recibí",
      },
    };
  }
  if (status === "confirmed") {
    return {
      label: "Confirmar pedido",
      icon: "check",
      tone: "primary",
      confirm: { icon: "check", title: `¿Confirmar el pedido ${order.folio}?`, message: "Si dejó correo, al cliente le llega el aviso de que su pedido está confirmado.", confirmLabel: "Confirmar" },
    };
  }
  if (status === "delivered") return { label: "Marcar entregado", icon: "box", tone: "secondary" };
  if (status === "cancelled") {
    return {
      label: "Cancelar",
      icon: "close",
      tone: "danger",
      confirm: {
        danger: true,
        icon: "close",
        title: `¿Cancelar el pedido ${order.folio}?`,
        message: "No se puede deshacer. Si dejó correo, al cliente le llega el aviso.",
        note: order.depositPaidAt ? `Ya registraste su anticipo de ${money(order, order.deposit)}: acuerda con el cliente la devolución.` : null,
        confirmLabel: "Cancelar pedido",
      },
    };
  }
  return null;
}

const TONES = {
  primary: "btn-primary bg-emerald-600 hover:bg-emerald-700",
  secondary: "btn-secondary",
  danger: "btn-secondary text-red-600 hover:border-red-300 hover:bg-red-50",
};

async function runAction(order, status, action) {
  if (action.confirm && !(await askConfirm(action.confirm))) return;
  changeStatus(order, status);
}

// ── Comprobantes ────────────────────────────────────────────────────────────────────────────

const viewer = van.state(null);
let viewerDialog = null;

function openViewer(src, title) {
  if (!viewerDialog) {
    viewerDialog = dialog(
      {
        class: "m-auto max-h-[92dvh] w-[calc(100%-2rem)] max-w-2xl overflow-hidden rounded-2xl bg-white p-0 shadow-2xl backdrop:bg-zinc-900/70",
        onclick: (event) => event.target === viewerDialog && viewerDialog.close(),
      },
      () =>
        viewer.val
          ? div(
              { class: "flex max-h-[92dvh] flex-col" },
              div(
                { class: "flex items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3" },
                p({ class: "text-sm font-semibold text-zinc-900" }, viewer.val.title),
                button({ type: "button", class: "btn-icon", "aria-label": "Cerrar", onclick: () => viewerDialog.close() }, Icon("close", "size-4")),
              ),
              div({ class: "min-h-0 flex-1 overflow-auto bg-zinc-100 p-3" }, img({ src: viewer.val.src, alt: viewer.val.title, class: "mx-auto max-h-[78dvh] w-auto rounded-lg object-contain" })),
            )
          : div(),
    );
    document.body.append(viewerDialog);
  }
  viewer.val = { src, title };
  viewerDialog.showModal();
}

function ProofThumb(order, proof, index) {
  const src = van.state("");
  const failed = van.state(false);
  proofUrl(proof.id).then((url) => (src.val = url)).catch(() => (failed.val = true));
  const title = `Comprobante ${index + 1} · ${order.folio}`;
  return button(
    {
      type: "button",
      title: `${title} · ${dateTime(proof.uploadedAt)}`,
      "aria-label": `Ver ${title}`,
      disabled: () => !src.val,
      onclick: () => openViewer(src.val, title),
      class: "group relative size-16 shrink-0 overflow-hidden rounded-lg bg-zinc-100 ring-1 ring-zinc-200 transition hover:ring-zinc-900 disabled:cursor-wait",
    },
    () =>
      failed.val
        ? span({ class: "grid size-full place-items-center text-zinc-400" }, Icon("image", "size-5"))
        : src.val
          ? img({ src: src.val, alt: "", class: "size-full object-cover" })
          : span({ class: "block size-full animate-pulse bg-zinc-200" }),
    span({ class: "absolute inset-0 grid place-items-center bg-black/40 text-white opacity-0 transition group-hover:opacity-100" }, Icon("search", "size-4")),
  );
}

// ── Tarjeta de pedido ───────────────────────────────────────────────────────────────────────

const StatusBadge = (order) =>
  span(
    { class: `inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${STATUS_STYLES[order.status] ?? STATUS_STYLES.new}` },
    Icon(STATUS_ICONS[order.status] ?? "sparkle", "size-3.5"),
    order.statusLabel,
  );

function DepositPanel(order) {
  if (!(order.deposit > 0)) return null;
  const remaining = order.total - order.deposit;

  if (order.depositPaidAt) {
    return div(
      { class: "flex flex-wrap items-center justify-between gap-2 rounded-xl bg-emerald-50 px-3.5 py-3 text-sm text-emerald-900" },
      span({ class: "flex items-center gap-2 font-medium" }, Icon("check", "size-4"), `Anticipo ${money(order, order.deposit)} recibido`),
      span({ class: "text-xs text-emerald-700" }, `${dateTime(order.depositPaidAt)} · resta ${money(order, remaining)}`),
    );
  }
  if (order.status !== "awaiting_deposit") {
    return p({ class: "rounded-xl bg-zinc-50 px-3.5 py-3 text-sm text-zinc-500" }, `Anticipo de ${money(order, order.deposit)} sin registrar.`);
  }

  const overdue = order.depositDueAt && new Date(order.depositDueAt).getTime() < Date.now();
  return div(
    { class: `rounded-xl px-3.5 py-3 ${overdue ? "bg-red-50 ring-1 ring-red-200" : "bg-amber-50"}` },
    div(
      { class: "flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1" },
      p({ class: `text-sm font-semibold ${overdue ? "text-red-800" : "text-amber-900"}` }, `Anticipo: ${money(order, order.deposit)}`),
      p({ class: `text-xs font-medium ${overdue ? "text-red-700" : "text-amber-800"}` }, overdue ? `Venció ${relative(order.depositDueAt)}` : `Vence ${relative(order.depositDueAt)}`),
    ),
    p({ class: `mt-0.5 text-xs ${overdue ? "text-red-700" : "text-amber-800"}` }, `Resta ${money(order, remaining)} al entregar · plazo: ${dateTime(order.depositDueAt)}`),
    order.proofs.length
      ? null
      : p({ class: "mt-2 text-xs text-zinc-500" }, "Aún no sube comprobante. Revisa tu banco de todas formas: pudo pagar sin subirlo."),
  );
}

function OrderCard(order) {
  const actions = order.nextStatuses.map((status) => [status, actionFor(order, status)]).filter(([, action]) => action);
  const phone = order.customer.phone ?? "";
  const greeting =
    order.status === "awaiting_deposit"
      ? `Hola ${order.customer.name.split(" ")[0]}, te escribimos por tu pedido ${order.folio}. Para confirmarlo falta tu anticipo de ${money(order, order.deposit)}.`
      : `Hola ${order.customer.name.split(" ")[0]}, te escribimos por tu pedido ${order.folio}.`;

  return li(
    { class: "flex flex-col rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md" },
    header(
      { class: "flex flex-wrap items-start justify-between gap-2 border-b border-zinc-100 px-4 pt-4 pb-3" },
      div(
        h3({ class: "text-lg font-semibold tracking-tight text-zinc-900 tabular-nums" }, `Folio ${order.folio}`),
        p({ class: "text-xs text-zinc-400", title: dateTime(order.createdAt, { dateStyle: "full", timeStyle: "short" }) }, `Recibido ${relative(order.createdAt)}`),
      ),
      StatusBadge(order),
    ),
    div(
      { class: "flex-1 space-y-4 px-4 py-4" },
      // Cliente
      div(
        { class: "flex items-start justify-between gap-3" },
        div(
          { class: "min-w-0" },
          p({ class: "truncate font-medium text-zinc-900" }, order.customer.name),
          p({ class: "text-sm text-zinc-500 tabular-nums" }, phone),
          order.customer.email ? p({ class: "truncate text-xs text-zinc-400" }, order.customer.email) : null,
        ),
        phone
          ? a(
              { href: waLink(phone, greeting), target: "_blank", rel: "noopener", class: "btn-secondary shrink-0 px-3 py-1.5 text-xs", title: "Escribir por WhatsApp" },
              Icon("chat", "size-4"),
              span({ class: "max-sm:sr-only" }, "WhatsApp"),
            )
          : null,
      ),
      // Entrega
      div(
        { class: "grid gap-2 text-sm sm:grid-cols-2" },
        order.deliveryDate ? p({ class: "flex items-start gap-2 text-zinc-700" }, Icon("calendar", "mt-0.5 size-4 shrink-0 text-zinc-400"), span({ class: "first-letter:uppercase" }, longDate(order.deliveryDate))) : null,
        p({ class: "flex items-start gap-2 text-zinc-700" }, Icon(order.delivery.type === "home" ? "home" : "pin", "mt-0.5 size-4 shrink-0 text-zinc-400"), span({ class: "min-w-0 break-words" }, order.delivery.label)),
      ),
      // Productos
      ul(
        { class: "divide-y divide-zinc-100 rounded-xl bg-zinc-50 px-3 text-sm" },
        order.items.map((item) =>
          li(
            { class: "py-2" },
            div(
              { class: "flex justify-between gap-3" },
              span({ class: "text-zinc-800" }, `${item.quantity} × ${item.name}`),
              span({ class: "shrink-0 font-medium text-zinc-900 tabular-nums" }, money(order, item.subtotal)),
            ),
            [...item.choices.map((choice) => `${choice.group}: ${choice.value}`), item.note && `Indicaciones: ${item.note}`]
              .filter(Boolean)
              .map((detail) => p({ class: "text-xs text-zinc-500" }, detail)),
          ),
        ),
      ),
      order.notes ? p({ class: "rounded-xl border border-dashed border-zinc-200 px-3 py-2 text-xs text-zinc-600" }, span({ class: "font-semibold" }, "Notas: "), order.notes) : null,
      div(
        { class: "flex items-baseline justify-between" },
        span({ class: "text-sm text-zinc-500" }, order.approximate ? "Total aproximado" : "Total"),
        span({ class: "text-xl font-semibold text-zinc-900 tabular-nums" }, money(order, order.total)),
      ),
      DepositPanel(order),
      order.proofs.length
        ? div(
            p({ class: "mb-2 text-xs font-medium text-zinc-500" }, `Comprobantes (${order.proofs.length})`),
            div({ class: "flex flex-wrap gap-2" }, order.proofs.map((proof, index) => ProofThumb(order, proof, index))),
          )
        : null,
    ),
    actions.length
      ? div(
          { class: "flex flex-wrap gap-2 border-t border-zinc-100 px-4 py-3" },
          actions.map(([status, action]) =>
            button(
              {
                type: "button",
                disabled: () => busyOrder.val === order.number,
                onclick: () => runAction(order, status, action),
                class: `${TONES[action.tone]} ${action.tone === "danger" ? "" : "flex-1"} justify-center`,
              },
              Icon(action.icon, "size-4"),
              action.label,
            ),
          ),
        )
      : null,
  );
}

// ── Vista ───────────────────────────────────────────────────────────────────────────────────

const Skeleton = () =>
  ul(
    { class: "grid gap-4 lg:grid-cols-2", "aria-hidden": "true" },
    [0, 1, 2, 3].map(() =>
      li(
        { class: "animate-pulse space-y-3 rounded-2xl border border-zinc-200 bg-white p-4" },
        div({ class: "h-5 w-28 rounded bg-zinc-200" }),
        div({ class: "h-4 w-48 rounded bg-zinc-100" }),
        div({ class: "h-20 rounded-xl bg-zinc-100" }),
      ),
    ),
  );

const EMPTY_TEXT = {
  open: "No tienes pedidos por atender. Los nuevos aparecen aquí solos.",
  awaiting_deposit: "Ningún pedido espera anticipo.",
  new: "No hay pedidos nuevos.",
  confirmed: "No hay pedidos confirmados pendientes de entregar.",
  delivered: "Aún no hay pedidos entregados.",
  cancelled: "No hay pedidos cancelados.",
  "": "Aún no recibes pedidos.",
};

function List() {
  const status = ordersStatus.val;
  if (status === "idle" || status === "loading") return Skeleton();
  if (status === "error") {
    return div(
      { class: "rounded-2xl border border-zinc-200 bg-white p-10 text-center" },
      p({ class: "text-sm text-zinc-500" }, "No se pudieron cargar los pedidos."),
      button({ type: "button", class: "btn-primary mt-4", onclick: () => loadOrders() }, "Intentar de nuevo"),
    );
  }
  const list = ordersList.val;
  if (!list.length) {
    return div(
      { class: "rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center" },
      div({ class: "mx-auto grid size-12 place-items-center rounded-full bg-zinc-100 text-zinc-400" }, Icon("receipt", "size-6")),
      p({ class: "mt-3 text-sm text-zinc-500" }, EMPTY_TEXT[ordersFilter.val] ?? EMPTY_TEXT[""]),
    );
  }
  return div(
    ul({ class: "grid items-start gap-4 lg:grid-cols-2" }, list.map(OrderCard)),
    () => (hasMore.val ? div({ class: "mt-6 text-center" }, button({ type: "button", class: "btn-secondary", onclick: loadMore }, "Ver más pedidos")) : div()),
  );
}

export default function OrdersView() {
  if (ordersStatus.rawVal !== "ready") loadOrders();

  return section(
    { class: "min-h-0 flex-1 overflow-y-auto overscroll-contain bg-zinc-50" },
    div(
      { class: "mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-6" },
      div(
        { class: "flex flex-wrap items-end justify-between gap-3" },
        div(
          h1({ class: "text-2xl font-semibold tracking-tight text-zinc-900" }, "Pedidos"),
          p({ class: "mt-1 text-sm text-zinc-500" }, "Confirma los anticipos cuando los veas en tu banco y marca las entregas."),
        ),
        button({ type: "button", class: "btn-secondary", onclick: () => loadOrders(), title: "Actualizar" }, Icon("loader", "size-4"), "Actualizar"),
      ),
      nav(
        { class: "-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0", "aria-label": "Filtrar pedidos" },
        FILTERS.map((filter) =>
          button(
            {
              type: "button",
              "aria-pressed": () => String(ordersFilter.val === filter.key),
              onclick: () => setFilter(filter.key),
              class: () =>
                `inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium whitespace-nowrap transition ${
                  ordersFilter.val === filter.key ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400"
                }`,
            },
            filter.label,
            () => {
              const counts = ordersCounts.val;
              const count = filter.count ? filter.count(counts) : (counts[filter.key] ?? 0);
              const active = ordersFilter.val === filter.key;
              const alert = filter.key === "awaiting_deposit" && count > 0 && !active;
              return count
                ? span(
                    { class: `grid min-w-5 place-items-center rounded-full px-1.5 text-[11px] leading-5 font-semibold tabular-nums ${active ? "bg-white/20" : alert ? "bg-amber-500 text-white" : "bg-zinc-100 text-zinc-600"}` },
                    count,
                  )
                : span();
            },
          ),
        ),
      ),
      div({ class: "mt-5" }, List),
    ),
  );
}
