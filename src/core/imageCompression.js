// Reduce las fotos en el navegador antes de subirlas: carga más rápido el sitio y ocupa poco espacio.
const MAX_SIDE = 1600;
const QUALITY = 0.82;
const OUTPUT_TYPES = ["image/webp", "image/jpeg"];
export const MAX_INPUT_BYTES = 25 * 1024 * 1024;

async function decode(file) {
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // Algunos navegadores no soportan la opción; se intenta con <img>.
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

const toBlob = (canvas, type) => new Promise((resolve) => canvas.toBlob(resolve, type, QUALITY));

/** Devuelve un Blob WebP (o JPEG si el navegador no sabe hacer WebP) de máximo 1600 px por lado. */
export async function compressImage(file) {
  if (!file.type.startsWith("image/")) throw new Error("El archivo no es una imagen.");
  if (file.size > MAX_INPUT_BYTES) throw new Error("La imagen pesa más de 25 MB.");

  let source;
  try {
    source = await decode(file);
  } catch {
    throw new Error("No se pudo leer la imagen. Prueba con una foto JPG o PNG.");
  }

  const width = source.width ?? source.naturalWidth;
  const height = source.height ?? source.naturalHeight;
  const scale = Math.min(1, MAX_SIDE / Math.max(width, height));
  const canvas = Object.assign(document.createElement("canvas"), { width: Math.round(width * scale), height: Math.round(height * scale) });
  canvas.getContext("2d").drawImage(source, 0, 0, canvas.width, canvas.height);
  source.close?.();

  for (const type of OUTPUT_TYPES) {
    const blob = await toBlob(canvas, type);
    if (blob?.type === type) return blob;
  }
  throw new Error("Tu navegador no pudo procesar la imagen.");
}
