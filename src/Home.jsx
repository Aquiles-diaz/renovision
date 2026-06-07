/* ============ reno · vision — HOME (landing brutalista) ============ */
import React from "react";
import { RenoNav } from "./Nav.jsx";
import { MELAMINAS } from "./data.jsx";

export function Home({ onExplore, onStudio, onHome, onMateriales }) {
  const { useEffect, useRef } = React;
  const rootRef = useRef(null);

  // reveal-on-scroll
  useEffect(() => {
    const els = rootRef.current
      ? rootRef.current.querySelectorAll(".reveal")
      : [];
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.16 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const marquee =
    "AMOBLAMIENTOS RENO — AMOBLAMIENTOS RENO — AMOBLAMIENTOS RENO — AMOBLAMIENTOS RENO — AMOBLAMIENTOS RENO — ";

  return (
    <div className="lp" ref={rootRef}>
      <RenoNav
        onHome={onHome}
        onExplore={onExplore}
        onMateriales={onMateriales}
        onStudio={onStudio}
        active="home"
      />

      {/* ===== HERO ===== */}
      <section className="lp-hero">
        <div className="lp-hero__bg"></div>
        <div className="lp-hero__ghost" aria-hidden="true">
          reno
        </div>
        <div className="lp-hero__grid">
          <div className="lp-hero__main rise">
            <span className="tag">reno · vision · 2026</span>
            <h1 className="lp-hero__h1">
              <span className="lp-word">
                DISEÑÁ<span className="lp-dot">.</span>
              </span>
              <span className="lp-word">
                <span className="lp-stroke">GIRÁ</span>
                <span className="lp-dot">.</span>
              </span>
              <span className="lp-word">
                COTIZÁ<span className="lp-dot">.</span>
              </span>
            </h1>
            <p className="lp-hero__lead">
              Recorré el corte de la casa, entrá a cada ambiente y configurá tu
              mueble en 3D — medidas, melaminas y módulos — con cotización al
              instante.
            </p>
            <div className="lp-hero__cta">
              <button className="btn btn--red" onClick={onExplore}>
                Explorar ambientes →
              </button>
              <button className="btn btn--ghost" onClick={onStudio}>
                Studio 3D
              </button>
            </div>
          </div>

          <aside
            className="lp-hero__side rise"
            style={{ animationDelay: ".12s" }}
          >
            <div className="lp-spec">
              <span className="lp-spec__k mono">EST.</span>
              <span className="lp-spec__v">1956</span>
            </div>
            <div className="lp-spec">
              <span className="lp-spec__k mono">CIUDAD</span>
              <span className="lp-spec__v">ROSARIO</span>
            </div>
            <div className="lp-spec">
              <span className="lp-spec__k mono">MELAMINAS</span>
              <span className="lp-spec__v">07 colores</span>
            </div>
            <button className="lp-spec__cta" onClick={onMateriales}>
              Ver materiales <span>→</span>
            </button>
          </aside>
        </div>
      </section>

      {/* ===== MARQUEE ===== */}
      <div className="lp-marquee">
        <div className="lp-marquee__track">
          <span>
            {marquee}
            {marquee}
          </span>
          <span>
            {marquee}
            {marquee}
          </span>
        </div>
      </div>

      {/* ===== MANIFIESTO / STATS ===== */}
      <section className="lp-stats">
        {[
          {
            n: "08",
            k: "Ambientes",
            d: "de la casa y el edificio, listos para recorrer.",
          },
          {
            n: "07",
            k: "Melaminas",
            d: "Melamina en imagen real, con su mejor ambiente.",
          },
          {
            n: "3D",
            k: "En vivo",
            d: "girá, medí y cotizá tu mueble al instante.",
          },
          {
            n: "∞",
            k: "Medidas",
            d: "configurables módulo a módulo, a tu espacio.",
          },
        ].map((s, i) => (
          <div
            className="lp-stat reveal"
            key={i}
            style={{ transitionDelay: i * 70 + "ms" }}
          >
            <div className="lp-stat__n">{s.n}</div>
            <div className="lp-stat__k">{s.k}</div>
            <div className="lp-stat__d">{s.d}</div>
          </div>
        ))}
      </section>

      {/* ===== MATERIALES TEASER ===== */}
      <section className="lp-mat reveal">
        <div className="lp-mat__txt">
          <span className="tag">el color importa</span>
          <h2 className="lp-mat__h2">
            ELEGÍ TU
            <br />
            MELAMINA
          </h2>
          <p className="lp-mat__p">
            Melaminas fotografiadas en color real. Mirá la textura, leé para qué
            ambiente rinde cada una y llevala directo al Studio.
          </p>
          <button className="btn btn--solid" onClick={onMateriales}>
            Ver materiales →
          </button>
        </div>
        <div className="lp-mat__strip">
          {MELAMINAS.map((m, i) => (
            <button
              key={m.id}
              className="lp-chip reveal"
              style={{
                backgroundImage: `url(${m.img})`,
                transitionDelay: i * 55 + "ms",
              }}
              title={m.name}
              onClick={onMateriales}
            >
              <span className="lp-chip__name">{m.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ===== CTA FINAL ===== */}
      <section className="lp-cta reveal">
        <h2 className="lp-cta__h2">
          VIVÍ EL
          <br />
          <span className="lp-stroke">DISEÑO</span>
        </h2>
        <div className="lp-cta__row">
          <button className="btn btn--red" onClick={onExplore}>
            Empezar ahora →
          </button>
          <span className="lp-cta__meta mono">
            reno® · amoblamientos · 2026
          </span>
        </div>
      </section>
    </div>
  );
}
