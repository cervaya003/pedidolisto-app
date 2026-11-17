// El cliente sube la foto (o captura) de su comprobante. Se comprime en el navegador y se manda al API
// con el publicId del pedido. Solo el negocio la puede ver.
import van from "vanjs-core";
import Icon from "../../ui/Icon.js";
import { apiClient } from "../../core/apiClient.js";
import { compressImage } from "../../core/imageCompression.js";
import { IS_PREVIEW } from "../../core/previewChannel.js";

const { div, p, label, input, span } = van.tags;

const RADIUS = "rounded-[min(var(--site-radius),0.75rem)]";
const MAX_PROOFS = 3;

const errorMessage = (error) => {
  if (error.status === 0) return "No pudimos conectar. Revisa tu internet e inténtalo de nuevo.";
  if (error.status === 429) return "Subiste varios archivos seguidos. Espera unos minutos.";
  if (error.status === 413) return "La imagen es muy pesada. Prueba con una captura de pantalla.";
  return error.message || "No pudimos subir tu comprobante. Inténtalo de nuevo.";
};

/**
 * `publicId`: llave del pedido. `count`: comprobantes ya subidos. `onUploaded(count)`: tras subir uno.
 * `prominent`: zona grande y llamativa (en el detalle del pedido es la acción principal).
 * `inputId`: id del <input type=file>, para abrirlo desde otro botón.
 */
export default function ProofUpload({ publicId, count = 0, onUploaded, label: title = "", prominent = false, inputId }) {
  const uploaded = van.state(count);
  const status = van.state("idle"); // idle | sending | done | error
  const error = van.state("");

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
      status.val = "done";
      onUploaded?.(result.proofCount);
    } catch (cause) {
      status.val = "error";
      error.val = errorMessage(cause);
    }
  }

  const fileInput = input({
    ...(inputId ? { id: inputId } : {}),
    type: "file",
    accept: "image/*",
    class: "sr-only",
    disabled: () => status.val === "sending" || uploaded.val >= MAX_PROOFS,
    onchange: (event) => {
      upload(event.target.files?.[0]);
      event.target.value = "";
    },
  });

  return div(
    { class: "mt-4" },
    title ? p({ class: "mb-2 text-xs font-medium text-muted" }, title) : null,
    () =>
      uploaded.val
        ? p(
            { class: `mb-2 flex items-center gap-2 ${RADIUS} bg-emerald-500/10 px-3.5 py-2.5 text-sm text-emerald-700` },
            Icon("check", "size-4 shrink-0"),
            uploaded.val === 1 ? "Recibimos tu comprobante. Te avisamos al confirmar el pago." : `Recibimos ${uploaded.val} comprobantes. Te avisamos al confirmar el pago.`,
          )
        : span({ hidden: true }),
    () =>
      uploaded.val >= MAX_PROOFS
        ? span({ hidden: true })
        : prominent
          ? label(
              {
                class: () =>
                  `flex cursor-pointer flex-col items-center gap-2 ${RADIUS} border-2 border-dashed border-primary/35 bg-primary/[0.04] px-5 py-7 text-center transition hover:border-primary/60 hover:bg-primary/[0.08] focus-within:border-primary ${
                    status.val === "sending" ? "cursor-wait opacity-70" : ""
                  }`,
              },
              fileInput,
              span(
                { class: "grid size-12 place-items-center rounded-full bg-primary text-on-primary shadow-md" },
                () => (status.val === "sending" ? Icon("loader", "size-6 animate-spin") : Icon("image", "size-6")),
              ),
              span({ class: "text-base font-semibold text-foreground" }, () =>
                status.val === "sending" ? "Subiendo…" : uploaded.val ? "Subir otro comprobante" : "Sube tu comprobante aquí",
              ),
              span({ class: "text-xs text-muted" }, "Foto o captura de pantalla de tu transferencia"),
            )
          : label(
            {
              class: () =>
                `flex cursor-pointer items-center justify-center gap-2 ${RADIUS} border-2 border-dashed border-foreground/20 px-4 py-3.5 text-sm font-medium text-foreground transition hover:border-accent hover:bg-accent/5 focus-within:border-accent ${
                  status.val === "sending" ? "cursor-wait opacity-70" : ""
                }`,
            },
            fileInput,
            () => (status.val === "sending" ? Icon("loader", "size-5 animate-spin") : Icon("image", "size-5 text-accent")),
            () => (status.val === "sending" ? "Subiendo…" : uploaded.val ? "Subir otro comprobante" : "Subir foto del comprobante"),
          ),
    () => (status.val === "error" ? p({ role: "alert", class: "mt-2 text-xs text-red-600" }, error.val) : span({ hidden: true })),
    p({ class: "mt-2 flex items-center gap-1.5 text-xs text-muted" }, Icon("lock", "size-3.5 shrink-0"), "Solo el negocio puede ver tu comprobante."),
  );
}
