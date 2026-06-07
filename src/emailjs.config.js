/* ============ reno · vision — EMAILJS CONFIG ============ */
/*
 * Credenciales de EmailJS para el envío de cotizaciones (CONTEXT D-04).
 *
 * ► El usuario DEBE completar los tres valores de abajo con los datos
 *   de su cuenta de EmailJS (https://dashboard.emailjs.com):
 *
 *     EMAILJS_SERVICE_ID   → Email Services → (tu servicio) → Service ID
 *     EMAILJS_TEMPLATE_ID  → Email Templates → (tu plantilla) → Template ID
 *     EMAILJS_PUBLIC_KEY   → Account → General → API Keys → Public Key
 *
 * La Public Key NO es secreta por diseño: solo autoriza envíos desde el
 * navegador contra una plantilla específica. Es seguro versionarla.
 *
 * Mientras estos valores estén vacíos, el envío degrada de forma controlada
 * a un mensaje de error claro (no rompe la app); ver src/sendQuote.js.
 */
export const EMAILJS_SERVICE_ID = ""; // ← pegá tu Service ID acá
export const EMAILJS_TEMPLATE_ID = ""; // ← pegá tu Template ID acá
export const EMAILJS_PUBLIC_KEY = ""; // ← pegá tu Public Key acá
