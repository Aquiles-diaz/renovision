/* ============ reno · vision — MATERIALES (catálogo de melaminas) ============ */
import React from "react";
import { RenoNav } from "./Nav.jsx";
import { MELAMINAS } from "./data.jsx";

export function Materiales({ onHome, onExplore, onMateriales, onStudio }) {
  const { useEffect, useRef, useState } = React;
  const gridRef = useRef(null);
  const [active, setActive] = useState(null); // id del color enfocado

  // reveal on scroll
  useEffect(() => {
    const els = gridRef.current
      ? gridRef.current.querySelectorAll(".reveal")
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
      { threshold: 0.14 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="mat fade-in">
      <RenoNav
        onHome={onHome}
        onExplore={onExplore}
        onMateriales={onMateriales}
        onStudio={onStudio}
        active="materiales"
      />

      <header className="mat__hero">
        <div className="mat__hero-row">
          <span className="tag">reno · materiales</span>
          <span className="mat__count mono">07 / MELAMINAS</span>
        </div>
        <h1 className="mat__title">
          Melaminas
          <br />
          <br />
        </h1>
        <p className="mat__lead">
          Cada color como llega a tu mueble: textura, profundidad y el ambiente
          donde mejor rinde. Tocá un color para ampliarlo.
        </p>
      </header>

      <section className="mat__grid" ref={gridRef}>
        {MELAMINAS.map((m, i) => (
          <article
            key={m.id}
            className={"matcard reveal" + (active === m.id ? " is-open" : "")}
            style={{ transitionDelay: (i % 3) * 60 + "ms" }}
            onClick={() => setActive(active === m.id ? null : m.id)}
          >
            <div className="matcard__media">
              <img src={m.img} alt={m.name} loading="lazy" />
              <span className="matcard__idx mono">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="matcard__finish mono">{m.finish}</span>
            </div>
            <div className="matcard__body">
              <div className="matcard__head">
                <h3 className="matcard__name">{m.name}</h3>
                <span className="matcard__line mono">{m.line}</span>
              </div>
              <p className="matcard__desc">{m.desc}</p>
              <div className="matcard__amb">
                <span className="matcard__amb-k mono">Ideal para</span>
                <span className="matcard__amb-v">{m.ambiente}</span>
              </div>
              <div className="matcard__foot">
                <span className="matcard__code mono">REF · {m.code}</span>
                <button
                  className="matcard__cta"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStudio && onStudio();
                  }}
                >
                  Usar en Studio →
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>

      <footer className="mat__foot">
        <div className="mat__foot-big">
          ¿Listo para
          <br />
          diseñar?
        </div>
        <button className="btn btn--red" onClick={onStudio}>
          Ir al Studio 3D →
        </button>
        <div className="mat__foot-meta mono">reno® · 2026 </div>
      </footer>
    </div>
  );
}
