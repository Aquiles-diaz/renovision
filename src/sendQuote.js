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
  EMAILJS_TEMPLATE_CLIENT_ID,
  EMAILJS_PUBLIC_KEY,
} from "./emailjs.config.js";

export async function sendQuote(params) {
  if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
    throw new Error("EMAILJS_NOT_CONFIGURED");
  }

  // Mail al negocio (siempre)
  await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, params, {
    publicKey: EMAILJS_PUBLIC_KEY,
  });

  // Confirmación al cliente (solo si está configurado y el cliente dejó email)
  if (EMAILJS_TEMPLATE_CLIENT_ID && params.email) {
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_CLIENT_ID, params, {
      publicKey: EMAILJS_PUBLIC_KEY,
    });
  }
}
