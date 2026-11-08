const UNSPLASH_HOST = "images.unsplash.com";
const CLOUDINARY_UPLOAD = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/;
const DEFAULT_WIDTHS = [480, 800, 1200];

const resolveSrc = (src) => (/^(https?:)?\/\//.test(src) ? src : import.meta.env.BASE_URL + src.replace(/^\//, ""));

// Cada servicio sabe entregar la imagen al ancho pedido; así el celular no descarga la foto grande.
function sizedUrl(url) {
  if (url.includes(UNSPLASH_HOST)) return (width) => `${url}?auto=format&fit=crop&w=${width}&q=75`;
  const cloudinary = url.match(CLOUDINARY_UPLOAD);
  if (cloudinary) return (width) => `${cloudinary[1]}f_auto,q_auto,c_limit,w_${width}/${cloudinary[2]}`;
  return null;
}

/** Atributos de <img> con srcset responsivo cuando la fuente lo permite (Unsplash o Cloudinary). */
export function imageProps(src, { sizes = "100vw", widths = DEFAULT_WIDTHS } = {}) {
  if (!src) return {};

  const url = resolveSrc(src);
  const sized = sizedUrl(url);
  if (!sized) return { src: url };

  return {
    src: sized(widths[Math.floor(widths.length / 2)]),
    srcset: widths.map((width) => `${sized(width)} ${width}w`).join(", "),
    sizes,
  };
}
