# Phase 3: Entrega real de la cotización - Context

**Gathered:** 2026-06-07
**Status:** Ready for planning

<domain>
## Phase Boundary

El usuario obtiene un **PDF real** de su cotización (no un `.html` disfrazado) y, al tocar **"Solicitar"**, la cotización llega efectivamente al negocio mediante un **servicio externo liviano** (EmailJS) con **confirmación visible** del envío. Las etiquetas de los botones describen con precisión la acción real. Cubre QUOTE-01, QUOTE-02, QUOTE-03.

NO incluye: backend propio / base de datos / auth; cambios al motor 3D o AR (Fase 1); cambios de lógica/routing (Fase 2); tests/CI (Fase 4); accesibilidad/pulido (Fase 5); rediseño visual.

</domain>

<decisions>
## Implementation Decisions

### Generación del PDF (QUOTE-01)
- **D-01:** `downloadDoc()` (`src/Studio3D.jsx:498-551`) deja de descargar un `.html` y genera un **PDF real client-side con `html2pdf.js`**. Se **reutiliza el HTML/CSS** que la función ya arma (mínimo cambio de layout) y se rasteriza a `.pdf` descargado directamente.
- **D-02:** Ambos documentos actuales pasan a PDF: **ficha técnica** (`kind === "tecnico"`) y **presupuesto** (`kind === "presupuesto"`). El nombre de archivo usa extensión `.pdf`.
- **D-03:** La librería se carga de forma **diferida (dynamic `import()`)** dentro del handler de descarga, para no inflar el bundle inicial de la app (no penalizar la carga del configurador/3D, que es el core value).

### Servicio de envío (QUOTE-02)
- **D-04:** El botón **"Solicitar"** envía la cotización al negocio con **EmailJS** (envío 100% desde el navegador, sin backend propio). El usuario provee las 3 credenciales de EmailJS (service ID, template ID, public key); la `public key` de EmailJS no es secreta (es client-side por diseño).
- **D-05:** El correo que recibe el negocio incluye: **datos de contacto del cliente**, **resumen de la configuración** (mueble, sala, línea, ancho, alto, profundidad, cuerpos, melamina, patas y **total en ARS**) y el **link compartible** (la URL actual que reconstruye la cotización exacta en la app). **No** se adjunta el PDF (evita los límites de tamaño de adjuntos de EmailJS y posibles fallos de envío).

### Datos de contacto del cliente (QUOTE-02)
- **D-06:** "Solicitar" abre un **modal** con: **nombre** (requerido), **email**, **teléfono** y **mensaje** (opcional). Validación: nombre + **al menos uno** de email/teléfono presente y con formato válido. Sin contacto válido no se habilita el envío.

### Confirmación y manejo de errores (QUOTE-02)
- **D-07:** El feedback vive **dentro del mismo modal**, con tres estados explícitos:
  - **Enviando:** botón deshabilitado + spinner/indicador.
  - **Éxito:** mensaje de confirmación (ej. "¡Cotización enviada! Te contactamos pronto").
  - **Error:** mensaje claro (ej. "No se pudo enviar") + **botón de reintentar**; los datos del formulario no se pierden.

### Etiquetas honestas (QUOTE-03)
- **D-08:** Cada etiqueta describe su acción real. Como los documentos ahora son PDF de verdad, "PDF Técnico" / "Presupuesto" quedan honestas (ajustar copy si aporta claridad, p.ej. "Descargar ficha técnica (PDF)" / "Descargar presupuesto (PDF)"). "Solicitar →" ahora **sí** envía la cotización al negocio. Ninguna etiqueta promete algo que el código no hace.

### Claude's Discretion
- Copy exacto de los botones y de los mensajes/estados del modal.
- Ubicación concreta de las credenciales EmailJS (constantes en un módulo de config vs. `import.meta.env` de Vite) — el planner elige; documentar que el usuario las provee.
- Diseño visual del modal de contacto (reutilizar estilos del modal AR existente para coherencia).
- Reglas exactas de validación de formato de email/teléfono.
- Estructura/orden final de la barra de acciones del cotizador.

</decisions>

<specifics>
## Specific Ideas

- Reutilizar el **patrón de modal del visor AR** existente y el patrón de feedback efímero "copiado" (`copyLink` / `setCopied`) para mantener coherencia visual y de interacción.
- El **link compartible ya existe**: la URL codifica el estado completo de la config (`readUrl`/`writeUrl` en `src/app.jsx`). Reusar esa URL tal cual dentro del correo — no construir un mecanismo nuevo.
- Prioridad de robustez: el core value es que el configurador no se rompa; la carga diferida del PDF y el envío externo no deben degradar la fluidez del Studio.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requisitos y alcance
- `.planning/ROADMAP.md` §"Phase 3: Entrega real de la cotización" — goal, success criteria (3), requirements QUOTE-01/02/03.
- `.planning/REQUIREMENTS.md` §"Entrega de la cotización (QUOTE)" — definición de QUOTE-01, QUOTE-02, QUOTE-03 y constraint "sin backend propio".

### Concerns de origen e integraciones
- `.planning/codebase/CONCERNS.md` — los anti-patrones que esta fase resuelve ("PDF" que emite HTML; botones con promesas falsas).
- `.planning/codebase/INTEGRATIONS.md` — confirma que hoy NO hay llamadas de red ni servicios externos (salvo AR/fonts); EmailJS sería el primer touchpoint de red saliente.

No external specs adicionales — el resto de los requisitos quedan capturados en las decisiones de arriba.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/Studio3D.jsx:498-551` `downloadDoc(kind)` — arma el HTML/CSS del documento; se reescribe la salida (HTML→PDF vía html2pdf) reutilizando el markup (D-01/D-02/D-03).
- `src/Studio3D.jsx:706-716` barra `cotizar__actions` — botones "PDF Técnico", "Presupuesto" y "Solicitar →" (este último hoy solo llama `downloadDoc("presupuesto")`); es el punto a recablear (D-04/D-08).
- `src/Studio3D.jsx:491-496` `copyLink()` + `setCopied`/`setTimeout` — patrón de feedback efímero reusable para confirmaciones (D-07).
- Modal del visor AR (mismo `Studio3D.jsx`) — patrón de modal/overlay a reutilizar para el formulario de contacto (D-06).
- `quote` / `quote.breakdown` / `quote.total` / `fmtAR` y selecciones (`furniture`, `room`, `line`, `width`, `mat`, `leg`) — datos ya disponibles para el resumen del correo (D-05).
- `src/app.jsx` `readUrl`/`writeUrl` (estado en la URL) — provee el link compartible que va en el correo (D-05).

### Established Patterns
- Cliente puro, sin red saliente en el código actual — EmailJS introduce la primera llamada `fetch`/SDK externa; aislarla en una función/módulo de envío.
- `Blob` + `URL.createObjectURL` + `<a download>` ya se usa para descargas; html2pdf encapsula su propia descarga, revisar que no queden object URLs colgando (coherente con la higiene de la Fase 1).
- Estado local con `useState` por vista; el modal y sus estados (idle/sending/success/error) viven como estado local del Studio.

### Integration Points
- Nueva dependencia npm: `html2pdf.js` (carga diferida) y `@emailjs/browser` (o el SDK EmailJS) en `package.json`.
- **Dependencia de setup externa (fuera del código):** el usuario debe crear cuenta EmailJS, definir la plantilla del correo y aportar service/template/public IDs para que QUOTE-02 funcione end-to-end. El plan debe contemplar valores configurables y un estado de error claro si faltan credenciales.

</code_context>

<deferred>
## Deferred Ideas

- Catálogo/precios editables fuera del código (CMS o archivo externo) — CATALOG-01, diferido a v2.
- Migración a TypeScript de `data.jsx`/`computeQuote` — TYPES-01, diferido a v2.
- Endpoint/serverless propio para el envío — descartado en esta fase por el constraint "sin backend propio"; EmailJS lo cubre.

Ninguna adicional — la discusión se mantuvo dentro del scope de la fase.

</deferred>

---

*Phase: 03-entrega-real-de-la-cotizaci-n*
*Context gathered: 2026-06-07*
