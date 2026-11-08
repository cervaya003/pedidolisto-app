# PedidoListo · App

Frontend de una **plataforma de catálogo digital y pedidos en línea totalmente personalizable**. Incluye el
**sitio público** donde los clientes ven los productos, los personalizan y hacen su pedido, y el **panel de
administración** donde el negocio controla el contenido y el diseño de su sitio sin escribir código.

Todo el contenido, el diseño y los pedidos se guardan en el API, que vive en el repositorio **pedidolisto-api**.

---

## Contenido

- [Características](#características)
- [Tecnologías](#tecnologías)
- [Puesta en marcha](#puesta-en-marcha)
- [Sitio público](#sitio-público)
- [Panel de administración](#panel-de-administración)
- [Plantillas](#plantillas)
- [Flujo de compra](#flujo-de-compra)
- [Validación y privacidad](#validación-y-privacidad)
- [Arquitectura](#arquitectura)
- [Convenciones](#convenciones)
- [Despliegue](#despliegue)

---

## Características

- **Tres plantillas** con personalidad propia (Clásica, Tienda y Carta) sobre los mismos datos.
- **Diseño editable sin código**: colores, 18 tipografías con vista previa, esquinas, imagen de fondo, secciones,
  columnas y estilo de tarjetas, con **vista previa en vivo** en computadora, tableta y celular.
- **Catálogo completo**: categorías, favoritos, galería de fotos, ingredientes, características y
  **personalización por producto** (sabor, tamaño, extras, mensaje) con precio que se ajusta al elegir.
- **Carrito y pedido en línea**: datos del cliente, fecha de entrega con calendario, lugar de entrega o
  domicilio, notas y confirmación con folio.
- **«Mis pedidos»**: el cliente consulta sus pedidos desde cualquier plantilla.
- **Datos del cliente recordados de forma cifrada** en su navegador para no volver a escribirlos.
- Diseño **adaptable a celular**, animaciones suaves y respeto por la preferencia de movimiento reducido.

---

## Tecnologías

| Área | Tecnología |
|---|---|
| Interfaz | VanJS 1.6 (componentes reactivos sin DOM virtual, ~1 KB) |
| Empaquetado | Vite 6 (dos entradas: sitio público y panel) |
| Estilos | Tailwind CSS 4 con tokens del tema en variables CSS |
| Tipografías | Google Fonts, cargadas según el tema elegido |
| Cifrado local | Web Crypto (AES-GCM 256) e IndexedDB |
| Servidor estático | Nginx (imagen Docker incluida) |

Sin frameworks pesados ni dependencias de UI: el sitio pesa unos 30 KB de JavaScript comprimido.

---

## Puesta en marcha

**Requisitos:** Node.js 22 o superior, pnpm y el API (pedidolisto-api) en ejecución.

```bash
pnpm install
cp .env.example .env    # VITE_API_URL=http://localhost:3000/api/v1
pnpm dev
```

- Sitio público: `http://localhost:5173`
- Panel de administración: `http://localhost:5173/admin.html`

| Comando | Uso |
|---|---|
| `pnpm dev` | Desarrollo con recarga instantánea |
| `pnpm build` | Genera `dist/` (sitio y panel) |
| `pnpm preview` | Sirve `dist/` en local para revisarlo |

| Variable | Descripción |
|---|---|
| `VITE_API_URL` | URL pública del API, incluyendo `/api/v1`. Se fija al compilar; no es un secreto. |

---

## Sitio público

| Función | Descripción |
|---|---|
| Catálogo | Productos por categoría, filtros, favoritos y buscador (según la plantilla) |
| Ficha de producto | Galería, descripción, ingredientes, características y opciones de personalización con precio en vivo |
| Carrito | Mismo producto con distintas personalizaciones en líneas separadas; cantidades y confirmación antes de quitar |
| Pedido | Nombre, teléfono con lada (México, EE. UU. o Canadá), correo opcional, día de entrega (Hoy, Mañana u otra fecha), lugar o domicilio y notas |
| Confirmación | Folio, resumen del pedido y siguientes pasos |
| Mis pedidos | Historial del cliente consultado al API con su correo y teléfono |

Los botones de pedido no dependen de WhatsApp: el pedido se envía al API, que avisa al negocio por Telegram y
correo. WhatsApp queda como enlace de contacto opcional.

---

## Panel de administración

| Pestaña | Qué controla |
|---|---|
| **Productos** | Alta y edición, fotos (arrastrar, elegir o cámara, con compresión automática), precio, etiqueta, favoritos, visibilidad y personalización |
| **Categorías** | Filtros del menú y su orden |
| **Secciones** | Orden, visibilidad y contenido de cada bloque de la página |
| **Apariencia** | Plantilla, estilos rápidos, colores, tipografías con vista previa, esquinas y fondo |
| **Negocio** | Identidad (nombre, logo, lema), contacto, entregas (lugares, domicilio y ciudades con cobertura) y región (moneda y formato) |

- Los cambios se ven al instante en la vista previa y llegan al sitio con **Publicar**; **Descartar** regresa a lo publicado.
- Toda eliminación pide confirmación.
- Cada campo tiene su límite de caracteres, igual al que valida el API.

---

## Plantillas

Todas usan los mismos productos, categorías, colores, tipografías y datos del negocio. Se eligen en
**Apariencia → Plantilla**.

| Plantilla | Carpeta | Estilo |
|---|---|---|
| **Clásica** | `site/components`, `site/sections` | Portada, carrusel de destacados, menú en mosaico y pasos para pedir |
| **Tienda** | `site/templates/market` | Tipo marketplace: buscador, filtros, ofertas y ficha de producto |
| **Carta** | `site/templates/carta` | Menú editorial por capítulos, renglones nombre ···· precio y detalle lateral |

Para ver una plantilla sin publicarla: `/?plantilla=market` (o `carta`, `classic`).

---

## Flujo de compra

```
Producto ─► personaliza ─► «Agregar» o «Pedir ahora»
                              │
Carrito ─► «Realizar pedido» ─┤
                              ▼
        Datos del cliente · día de entrega · lugar o domicilio · notas
                              │  validación en el navegador
                              ▼
                     POST /orders (API) ─► folio ─► pantalla de confirmación
                                             └─► Telegram y correo al negocio, comprobante al cliente
```

Cada pedido lleva un identificador único generado en el navegador: si el cliente presiona dos veces o se
reintenta por un fallo de red, el API no lo duplica.

---

## Validación y privacidad

- **Validación al escribir**: el nombre solo acepta letras; el teléfono, solo 10 dígitos; el código postal, solo
  números; los textos libres descartan símbolos como `< > { } [ ]`. Al confirmar, cada campo pendiente se marca en
  rojo y la pantalla lleva al primero. El API vuelve a validar todo.
- **Fechas**: los días anteriores a hoy no se pueden elegir.
- **Datos del cliente**: se recuerdan solo si el cliente lo acepta, cifrados con AES-GCM y una llave no
  exportable guardada en el navegador; «No soy yo» los borra.
- **Sin HTML inyectado**: VanJS crea nodos de texto, nunca interpreta HTML de los datos.

---

## Arquitectura

```
src/
├── core/                  Compartido por el sitio y el panel
│   ├── apiClient.js           Cliente HTTP (VITE_API_URL)
│   ├── metaStore.js           Catálogo de opciones del API (/meta)
│   ├── siteStore.js           Estado único del sitio público
│   ├── theme.js               Tema guardado → variables CSS → clases de Tailwind
│   ├── textRules.js           Reglas de texto (iguales a las del API)
│   ├── format.js              Precios y enlaces
│   └── previewChannel.js      Comunicación panel ↔ vista previa
├── site/                  Sitio público
│   ├── sections/              Secciones de la plantilla Clásica
│   ├── templates/             Plantillas Tienda y Carta
│   ├── product/               Ficha de producto y personalización
│   ├── cart/                  Carrito
│   ├── checkout/              Datos del pedido, calendario, confirmación y datos cifrados del cliente
│   ├── orders/                «Mis pedidos»
│   └── motion/                Animaciones al hacer scroll
├── admin/                 Panel de administración
│   ├── adminStore.js          Estado único: sesión, borrador y avisos
│   ├── schemas.js             Formularios declarativos
│   ├── panels/                Pestañas
│   ├── components/            Campos, selector de tipografía, galería, confirmaciones
│   └── views/                 Inicio de sesión, editor y vista previa
├── ui/                    Íconos
└── styles/                site.css (tokens del tema) · admin.css
```

---

## Convenciones

- Código en inglés; textos de la interfaz en español.
- `camelCase` para variables y funciones, `PascalCase` para componentes, `UPPER_SNAKE_CASE` para constantes.
- En el sitio, estilos solo con tokens del tema (`bg-primary`, `text-foreground`, `rounded-card`…), nunca colores fijos.
- Las opciones válidas (fuentes, columnas, tipos de sección) se piden al API; no se duplican aquí.

---

## Despliegue

Es un sitio estático: `pnpm build` genera `dist/`, que se puede servir desde cualquier hosting estático o CDN.
Define `VITE_API_URL` con la URL pública del API **antes** de compilar y agrega el dominio del sitio en
`CORS_ORIGINS` del API.

Con Docker (Nginx):

```bash
docker build --build-arg VITE_API_URL=https://api.tudominio.com/api/v1 -t pedidolisto-app .
docker run -p 8080:8080 pedidolisto-app
```
