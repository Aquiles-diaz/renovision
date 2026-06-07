/* ============ reno · vision — ENVÍO DE COTIZACIÓN (EmailJS) ============ */
/*
 * Único punto de la app con una llamada de red saliente (CONTEXT D-04).
 * Aísla el efecto secundario async en una sola función, igual que
 * exportFurnitureToGLB aísla el export GLB. El caller (StudioScreen) maneja
 * el éxito/error con su máquina de estados sending → success | error.
 *
 * NO construye el objeto `params` (lo arma el caller) y NUNCA adjunta el
 * PDF (D-05): el correo lleva contacto + resumen de configuración + link
 * compartible, nada más.
 */
import emailjs from "@emailjs/browser";
import {
  EMAILJS_SERVICE_ID,
  EMAILJS_TEMPLATE_ID,
  EMAILJS_PUBLIC_KEY,
} from "./emailjs.config.js";

export async function sendQuote(params) {
  // Degradación controlada: si falta cualquier credencial, no intentamos la
  // llamada de red — lanzamos un error tipado que el modal traduce al mensaje
  // "el envío no está disponible… descargá el PDF" (T-03-04 / UI-SPEC).
  if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
    throw new Error("EMAILJS_NOT_CONFIGURED");
  }

  return emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, params, {
    publicKey: EMAILJS_PUBLIC_KEY,
  });
}
