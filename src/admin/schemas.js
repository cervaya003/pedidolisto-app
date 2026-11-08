// Definición declarativa de los formularios del admin. SchemaForm los dibuja.
// Las opciones (fuentes, columnas, monedas…) vienen del API para no duplicarlas aquí.
import { metaStore } from "../core/metaStore.js";

const meta = () => metaStore.get();
const fromMap = (map) => Object.entries(map).map(([value, label]) => ({ value, label: label.label ?? label }));
const fromList = (list) => list.map((value) => ({ value, label: String(value) }));

const NAV_LABEL = { key: "navLabel", label: "Texto en el menú de navegación", type: "text", hint: "Déjalo vacío para no mostrarla en el menú." };
const HEADING_FIELDS = [
  { key: "eyebrow", label: "Etiqueta superior", type: "text" },
  { key: "title", label: "Título", type: "text" },
  { key: "text", label: "Descripción", type: "textarea" },
];
const TEXT_ITEM_FIELDS = (textType) => [
  { key: "title", label: "Título", type: "text", maxLength: 60 },
  { key: "text", label: "Texto", type: textType, maxLength: 300 },
];

export const getBusinessGroups = () => [
  {
    title: "Identidad",
    icon: "store",
    hint: "Cómo se llama tu negocio y cómo se presenta.",
    fields: [
      { key: "name", label: "Nombre del negocio", type: "text", maxLength: 80, icon: "store" },
      { key: "logoUrl", label: "Logo", type: "image", fit: "contain", hint: "Si lo dejas vacío se muestra el nombre." },
      { key: "tagline", label: "Lema", type: "text", icon: "sparkle" },
      { key: "description", label: "Descripción corta", type: "textarea" },
    ],
  },
  {
    title: "Contacto",
    icon: "chat",
    hint: "Dónde te encuentran tus clientes. Aparece en el pie de página.",
    fields: [
      { key: "whatsapp", label: "WhatsApp", type: "text", icon: "chat", inputmode: "numeric", maxLength: 15, filter: (value) => value.replace(/\D/g, ""), placeholder: "5215512345678", hint: "Opcional, solo para contacto. Código de país + número, solo dígitos. Los pedidos llegan por el botón «Realizar pedido»." },
      { key: "email", label: "Correo", type: "text", icon: "mail", inputType: "email", hint: "Formato nombre@dominio.com. Si el cliente responde a su comprobante, le llega aquí." },
      { key: "instagram", label: "Instagram (URL)", type: "text", icon: "instagram", placeholder: "https://instagram.com/tu-negocio" },
      { key: "facebook", label: "Facebook (URL)", type: "text", icon: "facebook", placeholder: "https://facebook.com/tu-negocio" },
      { key: "address", label: "Dirección", type: "text", icon: "pin" },
      { key: "hours", label: "Horario", type: "text", icon: "clock", placeholder: "Lun a Sáb · 9:00 a 19:00" },
    ],
  },
  {
    title: "Entregas",
    icon: "truck",
    hint: "Dónde puede recibir el cliente su pedido.",
    fields: [
      {
        key: "deliveryPoints",
        label: "Lugares de entrega",
        type: "items",
        addLabel: "Agregar lugar",
        itemIcon: "pin",
        newItem: { name: "", details: "" },
        itemFields: [
          { key: "name", label: "Nombre", type: "text", icon: "tag", maxLength: 60, placeholder: "Oficina, Centro de Querétaro, Recoger en el local…" },
          { key: "details", label: "Dirección o indicaciones", type: "text", icon: "pin", placeholder: "Av. Juárez 100, recepción · de 9 a 18 h" },
        ],
        hint: "El cliente elige uno al hacer su pedido.",
      },
      { key: "homeDelivery", label: "Entrega a domicilio", type: "toggle", icon: "home", hint: "El cliente escribe su dirección (calle, número, colonia…)." },
      {
        key: "deliveryAreas",
        label: "Ciudades con entrega a domicilio",
        type: "items",
        addLabel: "Agregar ciudad",
        itemIcon: "home",
        newItem: { city: "", state: "" },
        itemFields: [
          { key: "city", label: "Ciudad", type: "text", icon: "pin", placeholder: "Querétaro" },
          { key: "state", label: "Estado", type: "text", icon: "globe", placeholder: "Querétaro" },
        ],
        hint: "Solo se aceptan domicilios en estas ciudades. Con una sola, queda fija en el formulario. Vacío: cualquier ciudad.",
      },
    ],
  },
  {
    title: "Región",
    icon: "globe",
    hint: "Moneda y formato de precios y fechas.",
    fields: [
      { key: "currency", label: "Moneda", type: "select", icon: "coin", options: fromList(meta().currencies) },
      { key: "locale", label: "Formato regional", type: "select", icon: "globe", options: fromList(meta().locales) },
    ],
  },
];

export const getThemeGroups = () => {
  return [
    {
      title: "Colores",
      fields: Object.entries(meta().themeColors).map(([key, label]) => ({ key: `colors.${key}`, label, type: "color" })),
    },
    {
      title: "Tipografía",
      fields: [
        { key: "fonts.heading", label: "Títulos", type: "font", sample: "Pasteles hechos con cariño" },
        { key: "fonts.body", label: "Textos", type: "font", sample: "Elige tu favorito y pídelo en minutos." },
      ],
    },
    {
      title: "Forma y fondo",
      fields: [
        { key: "radius", label: "Esquinas", type: "select", options: fromMap(meta().radiusOptions) },
        { key: "backgroundImageUrl", label: "Imagen de fondo", type: "image", hint: "Opcional. Usa una textura suave." },
      ],
    },
  ];
};

// Cada plantilla lee solo algunos campos. `only` lista las plantillas que usan el campo (sin `only`, lo usan todas)
// y `hints` cambia la ayuda según la plantilla. Ocultar un campo no borra su valor: vuelve al regresar de plantilla.
export const DEFAULT_TEMPLATE = "classic";
const CLASSIC = ["classic"];
const CLASSIC_CARTA = ["classic", "carta"];
const CLASSIC_MARKET = ["classic", "market"];

const forTemplate = (fields, template) => {
  const current = template || DEFAULT_TEMPLATE;
  return fields
    .filter((field) => !field.only || field.only.includes(current))
    .map(({ only, hints, ...field }) => (hints?.[current] ? { ...field, hint: hints[current] } : field));
};

// El menú de navegación con enlaces a secciones solo existe en la Clásica.
const NAV = { ...NAV_LABEL, only: CLASSIC };

export const getSectionFields = (type, template) => {
  const fields = {
    hero: [
      NAV,
      { key: "eyebrow", label: "Etiqueta superior", type: "text" },
      { key: "title", label: "Título", type: "textarea" },
      { key: "highlight", label: "Palabras resaltadas", type: "text", hint: "Se muestran en cursiva y color de acento al final del título." },
      { key: "text", label: "Descripción", type: "textarea" },
      { key: "ctaLabel", label: "Texto del botón", type: "text" },
      {
        key: "imageUrl",
        label: "Imagen principal",
        type: "image",
        hint: "Sin imagen, la portada se centra.",
        hints: { market: "Se muestra a un lado del banner. Sin imagen, el banner ocupa todo el ancho.", carta: "Se muestra en forma de arco. Sin imagen, la portada se centra." },
      },
      { key: "secondaryImageUrl", label: "Imagen secundaria", type: "image", only: CLASSIC },
      { key: "badgeTitle", label: "Distintivo: título", type: "text", only: CLASSIC_CARTA, hints: { carta: "Se lee en el sello giratorio junto a la foto." } },
      { key: "badgeText", label: "Distintivo: texto", type: "text", only: CLASSIC_CARTA },
      {
        key: "highlights",
        label: "Datos destacados",
        type: "items",
        addLabel: "Agregar dato",
        newItem: { title: "", text: "" },
        itemFields: TEXT_ITEM_FIELDS("text"),
        only: CLASSIC_CARTA,
        hints: { carta: "La Carta muestra los primeros 3." },
      },
    ],
    featured: [
      NAV,
      { key: "eyebrow", label: "Etiqueta superior", type: "text", only: CLASSIC_CARTA },
      { key: "title", label: "Título", type: "text" },
      { key: "text", label: "Descripción", type: "textarea", only: CLASSIC_MARKET },
      { key: "categoryLabel", label: "Nombre como categoría", type: "text", placeholder: "Favoritos", hint: "Aparece como filtro junto a las categorías. Déjalo vacío para no mostrarlo." },
    ],
    // Tienda y Carta arman el catálogo solas con productos y categorías: esta sección solo aplica a la Clásica.
    menu: [
      NAV,
      ...HEADING_FIELDS.map((field) => ({ ...field, only: CLASSIC })),
      { key: "columns", label: "Columnas en escritorio", type: "select", numeric: true, options: fromList(meta().desktopColumns), only: CLASSIC },
      { key: "mobileColumns", label: "Columnas en celular", type: "select", numeric: true, options: fromList(meta().mobileColumns), only: CLASSIC },
      { key: "rowHeight", label: "Altura de las tarjetas", type: "select", options: fromMap(meta().rowHeights), only: CLASSIC },
      { key: "cardStyle", label: "Estilo de tarjeta", type: "select", options: fromMap(meta().cardStyles), only: CLASSIC },
      { key: "showFilters", label: "Mostrar filtros por categoría", type: "toggle", only: CLASSIC },
    ],
    steps: [
      NAV,
      { key: "eyebrow", label: "Etiqueta superior", type: "text", only: CLASSIC_CARTA },
      { key: "title", label: "Título", type: "text", only: CLASSIC_CARTA },
      { key: "ctaLabel", label: "Texto del botón", type: "text", hint: "Vacío oculta el botón.", only: CLASSIC },
      {
        key: "items",
        label: "Pasos",
        type: "items",
        addLabel: "Agregar paso",
        newItem: { title: "", text: "" },
        itemFields: TEXT_ITEM_FIELDS("textarea"),
        hints: { market: "La Tienda muestra los primeros 4 como beneficios debajo del banner." },
      },
    ],
  };
  return forTemplate(fields[type] ?? [], template);
};

export const getProductFields = (categories, template) => forTemplate([
  { key: "name", label: "Nombre", type: "text", maxLength: 100 },
  { key: "categoryId", label: "Categoría", type: "select", options: categories.map((category) => ({ value: category.id, label: category.name })) },
  { key: "price", label: "Precio", type: "number", min: 0 },
  { key: "imageUrl", label: "Fotos", type: "gallery" },
  { key: "description", label: "Descripción", type: "textarea" },
  { key: "details", label: "Características", type: "lines", hint: "Separa con coma, punto, doble espacio o Enter. Ej.: 8 porciones, 20 cm de diámetro, pedido con 24 h de anticipación" },
  { key: "ingredients", label: "Ingredientes", type: "lines", hint: "Separa con coma, punto, doble espacio o Enter. Ej.: harina, mantequilla, chocolate belga" },
  { key: "badge", label: "Etiqueta", type: "text", maxLength: 30, placeholder: "Nuevo, Más vendido…", hint: "Texto libre sobre la foto. Para favoritos usa el chip de arriba." },
  { key: "size", label: "Tamaño en el grid", type: "select", options: fromMap(meta().cardSizes), only: CLASSIC },
], template);
