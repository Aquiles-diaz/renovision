/* ============ reno · vision — STUDIO 3D ============ */
import React, { useRef, useEffect, useState, useMemo } from "react";
import { RenoNav } from "./Nav.jsx";
import {
  LINES,
  MELAMINAS,
  LEGS,
  FURNITURE,
  furnitureForRoom,
  melaminaById,
  baysForWidth,
  computeQuote,
  fmtAR,
} from "./data.jsx";
import { sendQuote } from "./sendQuote.js";
import { Viewer3D } from "./studio/Viewer3D.jsx";
import { exportFurnitureToGLB } from "./studio/exportGLB.js";
import { FIcon } from "./studio/FIcon.jsx";
import { buildQuoteDocHtml } from "./studio/quoteDocument.js";

/* ---------------- STUDIO SCREEN ---------------- */
export function StudioScreen({
  room,
  initialFurnitureId,
  initialWidth,
  initialMatId,
  onConfig,
  onBack,
  onHome,
  onMateriales,
}) {
  const list = useMemo(() => furnitureForRoom(room.id), [room.id]);
  const [furnId, setFurnId] = useState(initialFurnitureId || list[0].id);
  const furniture = useMemo(() => FURNITURE.find((f) => f.id === furnId), [furnId]);

  const validInitW =
    initialWidth && furniture.widths.includes(initialWidth) ? initialWidth : furniture.defW;
  const [lineId, setLineId] = useState("BASE");
  const [width, setWidth] = useState(validInitW);
  const [matId, setMatId] = useState(
    initialMatId && melaminaById(initialMatId).id === initialMatId ? initialMatId : "tribal",
  );
  const [legId, setLegId] = useState("sin");
  const [zoomSignal, setZoomSignal] = useState(null);
  const [showBd, setShowBd] = useState(false);
  const [imgErr, setImgErr] = useState(false);
  const [arUrl, setArUrl] = useState(null);
  const [arLoading, setArLoading] = useState(false);
  const [dlLoading, setDlLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // --- contacto / envío de cotización (EmailJS) ---
  const [contactOpen, setContactOpen] = useState(false);
  const [cName, setCName] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cPhone, setCPhone] = useState("");
  const [cMessage, setCMessage] = useState("");
  // "idle" | "sending" | "success" | "error"
  const [sendState, setSendState] = useState("idle");
  // "config" (creds faltantes) | "generic" — distingue el copy del error
  const [errorKind, setErrorKind] = useState("generic");
  const nameInputRef = useRef(null);

  // reset ancho al cambiar de módulo
  useEffect(() => {
    setWidth(furniture.defW);
  }, [furnId]);

  const mat = melaminaById(matId);
  const bays = baysForWidth(furniture, width);
  const quote = useMemo(
    () => computeQuote({ furniture, line: lineId, width, material: matId, legs: legId }),
    [furnId, lineId, width, matId, legId],
  );

  const cfg = furniture.widths.length > 1;
  const renderSrc = furniture.render ? furniture.render[mat.tone] : null;
  useEffect(() => {
    setImgErr(false);
  }, [furnId, mat.tone]);

  // reflejar config en la URL (link compartible)
  useEffect(() => {
    if (onConfig) onConfig({ furnId, width, matId });
  }, [furnId, width, matId, onConfig]);

  const zoom = (dir) => setZoomSignal({ dir, t: Date.now() });

  function openAR() {
    setArLoading(true);
    exportFurnitureToGLB({ furniture, width, bays, melamina: mat, legId })
      .then((url) => {
        setArUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
        setArLoading(false);
      })
      .catch(() => setArLoading(false));
  }
  function closeAR() {
    setArUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }

  function copyLink() {
    navigator.clipboard?.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  // --- contacto: abrir / cerrar (espejo de openAR/closeAR) ---
  function openContact() {
    setSendState("idle");
    setCName("");
    setCEmail("");
    setCPhone("");
    setCMessage("");
    setContactOpen(true);
  }
  function closeContact() {
    setContactOpen(false);
    setSendState("idle");
  }

  // autofocus en "Nombre" + Esc cierra (paridad con el modal AR; UI-SPEC)
  useEffect(() => {
    if (!contactOpen) return undefined;
    const t = setTimeout(() => nameInputRef.current?.focus(), 0);
    const onKey = (e) => {
      if (e.key === "Escape") {
        setContactOpen(false);
        setSendState("idle");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [contactOpen]);

  // --- validación (UI-SPEC: discreción de Claude sobre el regex exacto) ---
  const nameValid = cName.trim().length > 0;
  const emailValid = cEmail.trim() === "" ? false : /^\S+@\S+\.\S+$/.test(cEmail.trim());
  const phoneDigits = cPhone.replace(/\D/g, "");
  const phoneValid = cPhone.trim() === "" ? false : phoneDigits.length >= 8;
  // habilitar envío: nombre válido Y (email válido O teléfono válido)
  const canSend = nameValid && (emailValid || phoneValid);

  async function submitContact(e) {
    if (e) e.preventDefault();
    if (!canSend || sendState === "sending") return;
    setSendState("sending");

    const cap = (s, n) => (s || "").trim().slice(0, n);
    const leg = LEGS.find((l) => l.id === legId);
    const line = LINES.find((l) => l.id === lineId);

    // T-03-02: recortar y limitar longitud; sin construir HTML acá.
    const params = {
      name: cap(cName, 120),
      email: cap(cEmail, 160),
      phone: cap(cPhone, 40),
      message: cap(cMessage, 1000),
      // resumen de configuración
      mueble: furniture.name,
      sala: room.name,
      linea: line ? line.name : lineId,
      ancho: `${width} mm`,
      alto: `${furniture.alto} mm`,
      profundidad: `${furniture.prof} mm`,
      cuerpos: String(quote.bays),
      melamina: `${mat.name} · ${mat.finish}`,
      patas: leg ? leg.name : legId,
      total: fmtAR(quote.total),
      // link compartible — misma fuente que copyLink (D-05); NO se construye uno nuevo
      link: window.location.href,
    };

    try {
      await sendQuote(params);
      setSendState("success");
    } catch (err) {
      setErrorKind(err && err.message === "EMAILJS_NOT_CONFIGURED" ? "config" : "generic");
      setSendState("error"); // los campos NO se limpian: el usuario reintenta sin re-tipear
    }
  }

  async function downloadDoc(kind) {
    if (dlLoading) return;
    setDlLoading(true);
    const leg = LEGS.find((l) => l.id === legId) ?? LEGS[0],
      line = LINES.find((l) => l.id === lineId) ?? LINES[0];
    const tech = kind === "tecnico";
    const html = buildQuoteDocHtml({ furniture, room, line, leg, mat, width, quote, cfg, tech });
    try {
      // Lazy-load html2pdf so it stays out of the initial bundle (D-03).
      const { default: html2pdf } = await import("html2pdf.js");
      const holder = document.createElement("div");
      holder.innerHTML = html; // reuse the SAME html string built above (D-01)
      await html2pdf()
        .set({
          filename: `reno-${furniture.id}-${tech ? "ficha-tecnica" : "presupuesto"}.pdf`,
        })
        .from(holder)
        .save();
    } catch (err) {
      // A PDF failure must never freeze the button or crash the Studio.
      if (import.meta.env.DEV) console.error("downloadDoc: PDF generation failed", err);
    } finally {
      setDlLoading(false);
    }
  }

  return (
    <div className="studio fade-in">
      <RenoNav onHome={onHome} onExplore={onBack} onMateriales={onMateriales} active="studio" />

      {/* LEFT RAIL */}
      <aside className="studio__rail">
        <button className="rail-back" onClick={onBack}>
          ← {room.name}
        </button>

        <div className="rail-sec">
          <div className="rail-sec__head">
            <span className="num-chip">01</span>
            <span className="rail-sec__title">Línea</span>
          </div>
          {LINES.map((l) => (
            <button
              key={l.id}
              className={"line-opt" + (lineId === l.id ? " is-active" : "")}
              onClick={() => setLineId(l.id)}
            >
              <div className="line-opt__name">{l.name}</div>
              <div className="line-opt__desc">{l.desc}</div>
            </button>
          ))}
        </div>

        <div className="rail-sec">
          <div className="rail-sec__head">
            <span className="num-chip">02</span>
            <span className="rail-sec__title">Mueble</span>
          </div>
          {list.map((f) => (
            <button
              key={f.id}
              className={"furn-opt" + (furnId === f.id ? " is-active" : "")}
              onClick={() => setFurnId(f.id)}
            >
              <span className="furn-ico">
                <FIcon type={f.icon} />
              </span>
              <span>
                <div className="furn-opt__name">{f.name}</div>
                <div className="furn-opt__meta">
                  {f.widths.length > 1
                    ? `${f.widths.join(" / ")} mm`
                    : `${f.widths[0]} mm · estándar`}
                </div>
              </span>
            </button>
          ))}
        </div>
      </aside>

      {/* CENTER */}
      <div className="studio__center">
        <div className="viewer">
          <Viewer3D
            furniture={furniture}
            width={width}
            bays={bays}
            melamina={mat}
            legId={legId}
            zoomSignal={zoomSignal}
          />
          <div className="viewer__hint">Arrastrá para rotar · scroll para zoom</div>
          <div className="viewer__actions">
            <button className="ar-btn" onClick={openAR} disabled={arLoading}>
              {arLoading ? "Generando…" : "◉ Ver en tu ambiente (AR)"}
            </button>
            <button className="ar-btn ar-btn--ghost" onClick={copyLink}>
              {copied ? "¡Link copiado!" : "↗ Copiar link"}
            </button>
          </div>
          <div className="viewer__zoom">
            <button className="zbtn" onClick={() => zoom("in")} title="Agrandar">
              +
            </button>
            <button className="zbtn" onClick={() => zoom("out")} title="Achicar">
              −
            </button>
          </div>
          <div className="viewer__dims">
            <span className="dimpill">
              <b>{width}</b> ancho
            </span>
            <span className="dimpill">
              <b>{furniture.alto}</b> alto
            </span>
            <span className="dimpill">
              <b>{furniture.prof}</b> prof
            </span>
            <span className="dimpill">
              <b>{bays}</b> cuerpo{bays > 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* RENDER DEL MÓDULO (below 3D) */}
        <div className="render">
          <div className="render__img">
            <div className="render__scrim"></div>
            <div className="render__chip">
              <span className="tag">Render · {mat.tone}</span>
            </div>
            {renderSrc && !imgErr ? (
              <img
                className="render__photo"
                src={renderSrc}
                alt={`${furniture.name} ${mat.tone}`}
                onError={() => setImgErr(true)}
              />
            ) : (
              <div className="render__placeholder">
                {furniture.name} · {mat.tone}
                <span>[ falta {renderSrc} ]</span>
              </div>
            )}
          </div>
          <div className="render__side">
            <h4>{furniture.name}</h4>
            <p>
              {furniture.frentes.length} frentes disponibles · alto {furniture.alto} mm · prof{" "}
              {furniture.prof} mm.
            </p>
            <ul className="render__specs">
              {furniture.specs.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* COTIZADOR BAR */}
        <div className="cotizar">
          <div className="cotizar__left">
            <span className="tag">Cotización rápida</span>
            <div className="cotizar__total">
              <span className={"amt" + (quote.fixed ? " is-fixed" : "")}>{fmtAR(quote.total)}</span>
              <button
                className="cotizar__note"
                style={{ textDecoration: "underline", textUnderlineOffset: "3px" }}
                onClick={() => setShowBd((s) => !s)}
              >
                {showBd ? "ocultar detalle" : "ver detalle"}
              </button>
            </div>
            <span className="cotizar__note">
              {quote.fixed
                ? "PRECIO FIJO · MEDIDA ESTÁNDAR"
                : "PRECIO SEGÚN MEDIDAS Y CUERPOS · ARS"}
            </span>
          </div>
          <div className="cotizar__actions">
            <button className="dlbtn" onClick={() => downloadDoc("tecnico")} disabled={dlLoading}>
              ↓ Descargar ficha técnica (PDF)
            </button>
            <button
              className="dlbtn"
              onClick={() => downloadDoc("presupuesto")}
              disabled={dlLoading}
            >
              ↓ Descargar presupuesto (PDF)
            </button>
            <button className="btn btn--red" onClick={openContact}>
              Solicitar cotización →
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT RAIL */}
      <aside className="studio__rail studio__rail--right">
        <div className="rail-sec">
          <div className="rail-sec__head">
            <span className="num-chip">03</span>
            <span className="rail-sec__title">Ancho</span>
          </div>
          <div className="mods">
            {furniture.widths.map((wmm) => (
              <button
                key={wmm}
                className={"mod" + (width === wmm ? " is-active" : "")}
                style={{ flex: 1, minWidth: 0 }}
                onClick={() => setWidth(wmm)}
              >
                {wmm}
              </button>
            ))}
          </div>
          <div className="mods__hint">
            {cfg
              ? `Anchos disponibles en mm · ${bays} cuerpo${bays > 1 ? "s" : ""} de ${furniture.bayUnit} mm`
              : `Ancho fijo ${furniture.widths[0]} mm — medida estándar`}
          </div>
          <div className="ctrl" style={{ marginTop: 10 }}>
            <div className="ctrl__top">
              <span className="ctrl__label">Alto</span>
              <span className="ctrl__val is-locked">{furniture.alto} mm</span>
            </div>
            <div className="ctrl__top" style={{ marginTop: 6 }}>
              <span className="ctrl__label">Prof.</span>
              <span className="ctrl__val is-locked">{furniture.prof} mm</span>
            </div>
            <div className="locked-note">● Alto y profundidad fijos (catálogo EXA)</div>
          </div>
        </div>

        <div className="rail-sec">
          <div className="rail-sec__head">
            <span className="num-chip">04</span>
            <span className="rail-sec__title">Frentes</span>
          </div>
          <div className="mods__hint" style={{ marginTop: 0 }}>
            {furniture.frentes.map((f, i) => (
              <div key={i} style={{ padding: "3px 0" }}>
                • {f}
              </div>
            ))}
          </div>
        </div>

        <div className="rail-sec">
          <div className="rail-sec__head">
            <span className="num-chip">05</span>
            <span className="rail-sec__title">Melamina</span>
          </div>
          <div className="swatches">
            {MELAMINAS.map((m) => (
              <button
                key={m.id}
                className={"swatch" + (matId === m.id ? " is-active" : "")}
                style={{ backgroundImage: `url(${m.img})`, backgroundColor: m.hex }}
                title={m.name}
                onClick={() => setMatId(m.id)}
              />
            ))}
          </div>
          <div className="swatch__name">
            <b>{mat.name}</b>
            <span>{mat.finish}</span>
          </div>
        </div>

        <div className="rail-sec">
          <div className="rail-sec__head">
            <span className="num-chip">06</span>
            <span className="rail-sec__title">Patas</span>
          </div>
          <div className="legs">
            {LEGS.map((l) => (
              <button
                key={l.id}
                className={"leg" + (legId === l.id ? " is-active" : "")}
                onClick={() => setLegId(l.id)}
              >
                <div className="leg__name">{l.name}</div>
                <div className="leg__spec">
                  {l.spec}
                  {l.price > 0 ? " · " + fmtAR(l.price) : ""}
                </div>
              </button>
            ))}
          </div>
        </div>

        {showBd && (
          <div className="rail-sec" style={{ marginTop: 6 }}>
            <div className="rail-sec__head">
              <span className="rail-sec__title">Detalle de cotización</span>
            </div>
            {quote.breakdown.map((b, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 12,
                  color: "var(--ink-dim)",
                  padding: "6px 0",
                  borderBottom: "1px solid var(--line)",
                }}
              >
                <span>{b.label}</span>
                <span className="mono" style={{ color: "#fff" }}>
                  {fmtAR(b.value)}
                </span>
              </div>
            ))}
          </div>
        )}
      </aside>

      {/* AR MODAL */}
      {arUrl && (
        <div className="ar-modal" onClick={closeAR}>
          <div className="ar-modal__box" onClick={(e) => e.stopPropagation()}>
            <button className="ar-modal__close" onClick={closeAR}>
              ✕
            </button>
            <model-viewer
              src={arUrl}
              camera-controls
              auto-rotate
              ar
              ar-modes="webxr scene-viewer quick-look"
              shadow-intensity="1"
              exposure="1.1"
              style={{ width: "100%", height: "100%", background: "#0a0a09" }}
            ></model-viewer>
            <div className="ar-modal__hint">
              {furniture.name} · {mat.name}. Tocá el ícono de AR para verlo a escala real en tu
              ambiente (Android / visores compatibles).
            </div>
          </div>
        </div>
      )}

      {/* CONTACT MODAL — reusa overlay .ar-modal + tokens .ar-modal__box (UI-SPEC / D-06) */}
      {contactOpen && (
        <div className="ar-modal" onClick={closeContact}>
          <div className="contact-modal__box" onClick={(e) => e.stopPropagation()}>
            <button className="ar-modal__close" aria-label="Cerrar" onClick={closeContact}>
              ✕
            </button>

            {sendState === "success" ? (
              <div className="contact-modal__status">
                <h3 className="contact-modal__title">✓ ¡Cotización enviada!</h3>
                <p className="contact-modal__body">
                  Te contactamos pronto. Revisá tu casilla.
                </p>
                <button type="button" className="contact-modal__neutral" onClick={closeContact}>
                  Cerrar
                </button>
              </div>
            ) : (
              <form className="contact-modal__form" onSubmit={submitContact}>
                <h3 className="contact-modal__title">Solicitá tu cotización</h3>
                <p className="contact-modal__sub">
                  Te enviamos esta configuración y un asesor te contacta.
                </p>

                <label className="contact-field">
                  <span className="contact-field__label">Nombre *</span>
                  <input
                    ref={nameInputRef}
                    className="contact-field__input"
                    type="text"
                    value={cName}
                    placeholder="Tu nombre"
                    disabled={sendState === "sending"}
                    onChange={(e) => setCName(e.target.value)}
                  />
                </label>

                <label className="contact-field">
                  <span className="contact-field__label">Email</span>
                  <input
                    className="contact-field__input"
                    type="email"
                    value={cEmail}
                    placeholder="tu@email.com"
                    disabled={sendState === "sending"}
                    onChange={(e) => setCEmail(e.target.value)}
                  />
                </label>

                <label className="contact-field">
                  <span className="contact-field__label">Teléfono</span>
                  <input
                    className="contact-field__input"
                    type="tel"
                    value={cPhone}
                    placeholder="+54 9 ..."
                    disabled={sendState === "sending"}
                    onChange={(e) => setCPhone(e.target.value)}
                  />
                </label>

                <label className="contact-field">
                  <span className="contact-field__label">Mensaje (opcional)</span>
                  <textarea
                    className="contact-field__input contact-field__textarea"
                    value={cMessage}
                    placeholder="Contanos algo más…"
                    rows={3}
                    disabled={sendState === "sending"}
                    onChange={(e) => setCMessage(e.target.value)}
                  />
                </label>

                <p className="contact-modal__hint">
                  Dejanos al menos un email o teléfono para poder responderte.
                </p>

                {sendState === "error" && (
                  <div className="contact-modal__error" role="alert">
                    {errorKind === "config" ? (
                      <>
                        <strong>No se pudo enviar tu cotización.</strong>
                        <br />
                        El envío no está disponible en este momento. Probá descargar el
                        presupuesto en PDF.
                      </>
                    ) : (
                      <>
                        <strong>No se pudo enviar tu cotización.</strong>
                        <br />
                        Revisá tu conexión e intentá de nuevo.
                      </>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn--red contact-modal__submit"
                  disabled={!canSend || sendState === "sending"}
                >
                  {sendState === "sending"
                    ? "Enviando…"
                    : sendState === "error"
                      ? "Reintentar"
                      : "Enviar cotización →"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
