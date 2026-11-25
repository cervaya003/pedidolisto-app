// «Enviar comprobante»: un botón que, al tocarlo, ofrece las tres formas de mandarlo:
// subirlo aquí (recomendado: llega directo al pedido), por WhatsApp o por correo.
// Al subirlo, la imagen se comprime en el navegador y se manda al API con el publicId del pedido.
// Solo el negocio la puede ver. Se usa igual con anticipo obligatorio y sin él.
import van from "vanjs-core";
import Icon from "../../ui/Icon.js";
import { whatsappLink } from "../../core/format.js";
import { apiClient } from "../../core/apiClient.js";
import { compressImage } from "../../core/imageCompression.js";
import { IS_PREVIEW } from "../../core/previewChannel.js";

const { div, p, label, input, span, button, a } = van.tags;

const RADIUS = "rounded-[min(var(--site-radius),0.75rem)]";
const MAX_PROOFS = 3;

const BIG_BUTTON = `flex w-full items-center justify-center gap-2 ${RADIUS} px-5 py-4 text-base font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`;
const PRIMARY = `${BIG_BUTTON} bg-primary text-on-primary hover:bg-primary/90 active:scale-[0.99]`;
const SECONDARY = `${BIG_BUTTON} bg-primary/10 text-foreground hover:bg-primary/15`;

const errorMessage = (error) => {
  if (error.status === 0) return "No pudimos conectar. Revisa tu internet e inténtalo de nuevo.";
  if (error.status === 429) return "Subiste varios archivos seguidos. Espera unos minutos.";
  if (error.status === 413) return "La imagen es muy pesada. Prueba con una captura de pantalla.";
  return error.message || "No pudimos subir tu comprobante. Inténtalo de nuevo.";
};

/** Renglón de una opción: ícono, título, explicación y flecha. `tag` es `label` (subir) o `a` (enlace). */
const Option = (tag, { extraClass = "", children = [], ...attrs }, icon, title, text, badge) =>
  tag(
    {
      ...attrs,
      class: () =>
        `flex w-full cursor-pointer items-center gap-3 ${RADIUS} border border-foreground/10 bg-background p-3.5 text-left transition hover:border-foreground/30 hover:bg-foreground/[0.02] focus-within:border-primary ${
          typeof extraClass === "function" ? extraClass() : extraClass
        }`,
    },
    ...children,
    span({ class: "grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-foreground" }, icon),
    span(
      { class: "min-w-0 flex-1" },
      span(
        { class: "flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground" },
        title,
        badge ? span({ class: "rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-700" }, badge) : null,
      ),
      span({ class: "mt-0.5 block text-xs break-words text-muted" }, text),
    ),
    Icon("chevronRight", "size-4 shrink-0 text-muted"),
  );

/**
 * `business`: para el WhatsApp y el correo del negocio. `publicId`: llave del pedido.
 * `folio`: para el mensaje y el asunto. `count`: comprobantes ya subidos. `onUploaded(count)`: tras subir uno.
 */
export default function ProofUpload({ business, publicId, folio = "", count = 0, onUploaded }) {
  const uploaded = van.state(count);
  const open = van.state(false);
  const status = van.state("idle"); // idle | sending | error
  const error = van.state("");

  const message = folio ? `Hola, te envío el comprobante de mi pedido ${folio}.` : "Hola, te envío el comprobante de mi transferencia.";
  const whatsapp = whatsappLink(business, message);
  const email = business.email ? `mailto:${business.email}?subject=${encodeURIComponent(folio ? `Comprobante del pedido ${folio}` : "Comprobante de transferencia")}` : null;

  async function upload(file) {
    if (!file) return;
    if (IS_PREVIEW) {
      status.val = "error";
      error.val = "Estás en la vista previa: aquí no se suben comprobantes.";
      return;
    }
    status.val = "sending";
    error.val = "";
    try {
      const blob = await compressImage(file);
      const result = await apiClient.upload(`/orders/${publicId}/proof`, blob);
      uploaded.val = result.proofCount;
      status.val = "idle";
      open.val = false;
      onUploaded?.(result.proofCount);
    } catch (cause) {
      status.val = "error";
      error.val = errorMessage(cause);
    }
  }

  const fileInput = input({
    type: "file",
    accept: "image/*",
    class: "sr-only",
    disabled: () => status.val === "sending" || uploaded.val >= MAX_PROOFS,
    onchange: (event) => {
      upload(event.target.files?.[0]);
      event.target.value = "";
    },
  });

  const choices = () =>
    div(
      { class: "space-y-2 animate-fade-down" },
      p({ class: "pb-1 text-sm font-semibold text-foreground" }, "¿Cómo quieres enviarlo?"),
      uploaded.rawVal < MAX_PROOFS
        ? Option(
            label,
            { extraClass: () => (status.val === "sending" ? "cursor-wait opacity-70" : ""), children: [fileInput] },
            () => (status.val === "sending" ? Icon("loader", "size-5 animate-spin") : Icon("image", "size-5")),
            () => (status.val === "sending" ? "Subiendo…" : "Subirlo aquí"),
            "Foto o captura de tu transferencia. Llega directo a tu pedido.",
            "Recomendado",
          )
        : null,
      whatsapp ? Option(a, { href: whatsapp, target: "_blank", rel: "noopener" }, Icon("chat", "size-5"), "Enviar por WhatsApp", `Abre un chat con el negocio${folio ? ` con tu folio ${folio}` : ""}.`) : null,
      email ? Option(a, { href: email }, Icon("mail", "size-5"), "Enviar por correo", business.email) : null,
      button({ type: "button", onclick: () => (open.val = false), class: "w-full py-2 text-center text-sm text-muted hover:text-foreground" }, "Cancelar"),
    );

  return div(
    { class: "space-y-3" },
    () =>
      uploaded.val
        ? p(
            { class: `flex items-center gap-2 ${RADIUS} bg-emerald-500/10 px-3.5 py-2.5 text-sm text-emerald-700` },
            Icon("check", "size-4 shrink-0"),
            uploaded.val === 1 ? "Recibimos tu comprobante. Te avisamos al confirmar el pago." : `Recibimos ${uploaded.val} comprobantes. Te avisamos al confirmar el pago.`,
          )
        : span({ hidden: true }),
    () =>
      open.val
        ? choices()
        : button(
            { type: "button", onclick: () => (open.val = true), class: uploaded.rawVal ? SECONDARY : PRIMARY },
            Icon("receipt", "size-5"),
            uploaded.rawVal ? "Enviar otro comprobante" : "Enviar comprobante",
          ),
    () => (status.val === "error" ? p({ role: "alert", class: "text-xs text-red-600" }, error.val) : span({ hidden: true })),
    p({ class: "flex items-center gap-1.5 text-xs text-muted" }, Icon("lock", "size-3.5 shrink-0"), "Si lo subes aquí, solo el negocio puede verlo."),
  );
}
