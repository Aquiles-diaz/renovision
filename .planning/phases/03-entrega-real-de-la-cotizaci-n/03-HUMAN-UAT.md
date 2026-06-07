---
status: partial
phase: 03-entrega-real-de-la-cotizaci-n
source: [03-VERIFICATION.md]
started: 2026-06-07
updated: 2026-06-07
---

## Current Test

[awaiting human testing]

## Tests

### UAT-01 — PDF visual output (QUOTE-01)
**How:** `npm run dev`, arma una cotización en el Studio, toca "Descargar ficha técnica (PDF)" y "Descargar presupuesto (PDF)".
**Expected:** Se descarga un archivo `.pdf` real (no `.html`) que abre correctamente en el visor de PDF y muestra el logo, specs y total con el layout esperado.
**Status:** pending

### UAT-02 — Modal de contacto + máquina de estados (QUOTE-02 / QUOTE-03)
**How:** Toca "Solicitar cotización →". Probá: enviar con nombre vacío (debe quedar deshabilitado), nombre + email/teléfono inválidos, y datos válidos. Cerrá y reabrí el modal.
**Expected:** El modal abre (no descarga). Submit deshabilitado hasta nombre + al menos un email/teléfono válido. Estados idle → enviando → éxito/error visibles. En error, los datos del formulario se preservan y hay reintento. Al reabrir tras un envío, el formulario aparece vacío (sin datos del envío anterior).
**Status:** pending

### UAT-03 — Degradación sin credenciales (QUOTE-02)
**How:** Con `src/emailjs.config.js` aún en blanco (sin credenciales), enviá el formulario con datos válidos.
**Expected:** Mensaje claro de "envío no disponible → descargá el presupuesto en PDF". NO crashea la app ni el Studio.
**Status:** pending

### UAT-04 — Envío real end-to-end (QUOTE-02) — requiere setup del usuario
**How:** Completá el setup de EmailJS (ver Open Todo), pegá Service/Template/Public IDs en `src/emailjs.config.js`, creá la plantilla con las 15 variables, y enviá una cotización de prueba.
**Expected:** El negocio recibe el correo con datos de contacto + resumen de configuración (mueble, sala, línea, ancho, alto, profundidad, cuerpos, melamina, patas, total ARS) + el link compartible. Sin PDF adjunto. El usuario ve confirmación de éxito.
**Status:** pending (bloqueado por setup de credenciales EmailJS)

## Notes

- Verificación de código: 7/7 must-haves confirmados contra el codebase (03-VERIFICATION.md). Sin blockers de código.
- Code review: 1 Critical + 5 hallazgos menores, todos resueltos (03-REVIEW.md, commits `fix(03):`).
- `npm run build` → exit 0; `html2pdf.js` queda code-split fuera del bundle inicial.
