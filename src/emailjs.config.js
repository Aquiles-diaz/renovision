/* ============ reno · vision — EMAILJS CONFIG ============ */
/*
 * Credenciales de EmailJS para el envío de cotizaciones (CONTEXT D-04).
 *
 * ► EmailJS es un servicio de terceros que permite enviar emails desde el navegador
 * La Public Key NO es secreta por diseño: solo autoriza envíos desde el
 * navegador contra una plantilla específica. Es seguro versionarla.
 *
 * Mientras estos valores estén vacíos, el envío degrada de forma controlada
 * a un mensaje de error claro (no rompe la app); ver src/sendQuote.js.
 */
export const EMAILJS_SERVICE_ID = "service_0u79304";
export const EMAILJS_TEMPLATE_ID = "template_8ajd01f";
export const EMAILJS_TEMPLATE_CLIENT_ID = "template_u9hs2ks";
export const EMAILJS_PUBLIC_KEY = "abjF1yg6d1e0hXy2m";
