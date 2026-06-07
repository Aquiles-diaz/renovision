/* ---------- DOCUMENTO DE COTIZACIÓN / FICHA TÉCNICA (HTML para PDF) ---------- */
import { fmtAR } from "../data.jsx";

/**
 * Genera el HTML del documento descargable (presupuesto o ficha técnica).
 * Función pura: mismas entradas → mismo HTML. El llamador lo convierte a PDF.
 */
export function buildQuoteDocHtml({ furniture, room, line, leg, mat, width, quote, cfg, tech }) {
  const rows = quote.breakdown
    .map(
      (b) =>
        `<tr><td>${b.label}</td><td style="text-align:right">${fmtAR(b.value)}</td></tr>`,
    )
    .join("");

  return `<!doctype html><html><head><meta charset="utf-8"><title>reno · ${tech ? "Ficha Técnica" : "Presupuesto"} · ${furniture.name}</title>
    <style>
      *{margin:0;box-sizing:border-box;font-family:Arial,Helvetica,sans-serif}
      body{background:#fff;color:#111;padding:54px 60px;max-width:780px;margin:auto}
      .logo{font-weight:800;font-size:34px;letter-spacing:-.03em}
      .acc{color:#e23a2b}
      .tag{font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#e23a2b;font-weight:700;margin-top:30px}
      h1{font-size:26px;margin:6px 0 2px;font-weight:800}
      .sub{color:#666;font-size:13px;margin-bottom:26px}
      table{width:100%;border-collapse:collapse;margin:10px 0}
      td,th{padding:9px 4px;border-bottom:1px solid #e7e7e7;font-size:13px}
      th{text-align:left;color:#999;font-size:10px;letter-spacing:.14em;text-transform:uppercase}
      .spec td:first-child{color:#888}
      .total{display:flex;justify-content:space-between;align-items:center;margin-top:22px;padding-top:18px;border-top:2px solid #111}
      .total b{font-size:30px}
      .foot{margin-top:40px;font-size:11px;color:#999;line-height:1.6}
    </style></head><body>
      <div class="logo">reno<span class="acc">.</span></div>
      <div class="tag">${tech ? "Ficha técnica" : "Cotización rápida"}</div>
      <h1>${furniture.name}</h1>
      <div class="sub">${room.name} · ${line.name}${cfg ? "" : " · Medida estándar"}</div>
      <table class="spec">
        <tr><td>Ancho</td><td style="text-align:right">${width} mm</td></tr>
        <tr><td>Alto</td><td style="text-align:right">${furniture.alto} mm</td></tr>
        <tr><td>Profundidad</td><td style="text-align:right">${furniture.prof} mm</td></tr>
        <tr><td>Cuerpos</td><td style="text-align:right">${quote.bays} × ${furniture.bayUnit} mm</td></tr>
        <tr><td>Melamina</td><td style="text-align:right">${mat.name} · ${mat.finish}</td></tr>
        <tr><td>Patas</td><td style="text-align:right">${leg.name} ${leg.spec}</td></tr>
      </table>
      ${tech ? `<table class="spec"><tr><th>Especificaciones</th><th></th></tr>${furniture.specs.map((s) => `<tr><td>•</td><td>${s}</td></tr>`).join("")}</table>` : ""}
      ${tech ? "" : `<table><tr><th>Detalle</th><th style="text-align:right">Importe</th></tr>${rows}</table>`}
      <div class="total"><span>${tech ? "Precio de referencia" : "TOTAL"}</span><b>${fmtAR(quote.total)}</b></div>
      <div class="foot">Documento generado por reno · vision — configurador 3D. Precios de referencia en ARS, sujetos a confirmación. Las medidas pueden ajustarse según relevamiento del ambiente.<br/>reno · 2026</div>
    </body></html>`;
}
