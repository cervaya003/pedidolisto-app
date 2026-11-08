const FALLBACK_REGION = { locale: "es-MX", currency: "MXN" };
const formatters = new Map();

function getFormatter({ locale, currency }) {
  const key = `${locale}|${currency}`;
  if (!formatters.has(key)) {
    try {
      // Decimales de la moneda (MXN, USD, EUR: 2 → «$650.00»).
      formatters.set(key, new Intl.NumberFormat(locale, { style: "currency", currency }));
    } catch {
      return getFormatter(FALLBACK_REGION);
    }
  }
  return formatters.get(key);
}

export function formatPrice(business, value, from = false) {
  const price = getFormatter(business).format(value);
  return from ? `Desde ${price}` : price;
}

const DEFAULT_CONTACT_MESSAGE = "Hola, tengo una pregunta.";

/** Enlace de contacto por WhatsApp (los pedidos van por el API). Null si el negocio no tiene WhatsApp. */
export const whatsappLink = (business, message = DEFAULT_CONTACT_MESSAGE) =>
  business.whatsapp ? `https://wa.me/${business.whatsapp}?text=${encodeURIComponent(message)}` : null;
