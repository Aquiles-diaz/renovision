# Phase 3: Entrega real de la cotización - Discussion Log

> **Audit trail only.** No es input para agentes de planning/research/execution.
> Las decisiones canónicas viven en `03-CONTEXT.md`; este log preserva el cómo se llegó a ellas.

**Date:** 2026-06-07
**Phase:** 03-entrega-real-de-la-cotizaci-n
**Mode:** discuss
**Áreas analizadas:** generación de PDF, servicio de envío, datos de contacto, contenido del correo, confirmación/errores

## Áreas seleccionadas para discutir

Multiselect — el usuario eligió **las cuatro** áreas presentadas:
- Cómo generar el PDF
- Qué servicio de envío
- Datos de contacto del cliente
- Confirmación y errores de envío

## Preguntas y selecciones

### Generación del PDF
- **Opciones:** html2pdf.js (recomendado) · jsPDF (dibujo manual) · window.print() + CSS print
- **Elección:** **html2pdf.js** — reutiliza el HTML/CSS actual, descarga `.pdf` directo, mínimo cambio. → D-01/D-02/D-03

### Servicio de envío
- **Opciones:** EmailJS (recomendado) · Formspree · endpoint propio liviano
- **Elección:** **EmailJS** — email al negocio desde el navegador con plantilla, 3 claves públicas, sin backend propio. → D-04

### Datos de contacto del cliente
- **Opciones:** Nombre + email + teléfono + mensaje (recomendado) · Solo nombre + teléfono · Solo email
- **Elección:** **Nombre + email + teléfono + mensaje** (nombre requerido + al menos un medio de contacto). → D-06

### Contenido del correo
- **Opciones:** Resumen + link compartible (recomendado) · Resumen + PDF adjunto · Solo resumen de texto
- **Elección:** **Resumen + link compartible** — contacto + resumen de config + URL que reconstruye la cotización; sin adjunto. → D-05

### Confirmación y manejo de errores
- **Opciones:** Estados en el modal (recomendado) · Toast global · Mensaje inline en la barra
- **Elección:** **Estados en el modal** — enviando/éxito/error con reintento, todo en el mismo modal. → D-07

## Decisiones de criterio (Claude's discretion)

- Copy exacto de botones y mensajes del modal.
- Ubicación de credenciales EmailJS (módulo de config vs `import.meta.env`).
- Diseño visual del modal (reusar estilos del modal AR).
- Validación exacta de email/teléfono.
- Etiquetas honestas (QUOTE-03) derivadas de las decisiones → D-08.

## Deferred / fuera de scope

- Endpoint serverless propio (descartado por constraint "sin backend propio").
- CATALOG-01 (catálogo editable) y TYPES-01 (TypeScript) → v2.

## Dependencia externa señalada

El usuario debe crear cuenta EmailJS, definir la plantilla y aportar service/template/public IDs para que QUOTE-02 funcione end-to-end (registrado en el code_context de CONTEXT.md).
