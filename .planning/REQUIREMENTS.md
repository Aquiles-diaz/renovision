# Requirements: reno · vision

**Defined:** 2026-06-07
**Core Value:** El configurador 3D + cotizador funciona de forma fluida y confiable — el usuario arma su mueble, lo ve en 3D/AR sin que la app se rompa ni se ralentice, y obtiene un precio correcto.

> Milestone de mejoras: resolver los concerns de `.planning/codebase/CONCERNS.md` por fases, ordenados por impacto/riesgo.

## v1 Requirements

Requisitos de este milestone. Cada uno mapea a una fase del roadmap.

### Estabilidad del motor 3D (STAB)

- [ ] **STAB-01**: Las geometrías y materiales de three.js se liberan (dispose) en cada reconstrucción del mueble, sin fugas de memoria GPU al cambiar ancho/melamina/patas
- [ ] **STAB-02**: El cache global de texturas se libera cuando ya no se usa (no crece indefinidamente)
- [ ] **STAB-03**: Los blob URLs del export AR se revocan al cerrar el modal o desmontar el Studio
- [ ] **STAB-04**: Un error en el render 3D no deja la app en pantalla blanca — hay un Error Boundary que muestra un fallback recuperable
- [ ] **STAB-05**: La creación del WebGLRenderer maneja fallos y pérdida de contexto (context-loss) sin crashear la app

### Lógica y routing (LOGIC)

- [ ] **LOGIC-01**: La normalización de deep links no usa setState durante el render (se mueve a un efecto), sin warnings de React ni renders inconsistentes
- [ ] **LOGIC-02**: Los hotspots de la vista de ambiente se mapean de forma estable y explícita (no por índice con módulo), apuntando siempre al mueble correcto
- [ ] **LOGIC-03**: `furnitureForRoom(roomId)` filtra realmente los muebles por sala en vez de ignorar el argumento

### Entrega de la cotización (QUOTE)

- [ ] **QUOTE-01**: El botón de exportar genera un PDF real de la cotización en el navegador (no un archivo .html disfrazado)
- [ ] **QUOTE-02**: "Solicitar" envía la cotización al negocio mediante un servicio externo (EmailJS/Formspree/endpoint) y confirma al usuario el envío
- [ ] **QUOTE-03**: Las etiquetas de los botones describen con precisión lo que hacen (sin promesas falsas)

### Red de seguridad: tests + CI (SAFETY)

- [ ] **SAFETY-01**: Existen tests automatizados que cubren el núcleo de precios (`computeQuote`) con casos representativos
- [ ] **SAFETY-02**: Existen tests para la lógica de geometría/configuración clave (ej. `buildFurnitureGroup` y selección de datos)
- [ ] **SAFETY-03**: Hay un pipeline de CI que corre lint + build (y los tests) en cada push/PR

### Accesibilidad y pulido (A11Y)

- [ ] **A11Y-01**: Los botones de íconos y hotspots tienen labels accesibles (aria-label/texto)
- [ ] **A11Y-02**: Los elementos clickeables usan roles/semántica correcta (botones en vez de `div`/`article` con onClick)
- [ ] **A11Y-03**: La cadena de transiciones basada en setTimeout se limpia correctamente (sin timers colgados al navegar/desmontar)
- [ ] **A11Y-04**: `dist/` queda fuera del control de versiones (ya cubierto por `.gitignore`, verificado)

## v2 Requirements

Reconocidos pero diferidos — no en este roadmap.

### Tipado (TYPES)

- **TYPES-01**: Migración gradual a TypeScript empezando por `data.jsx`/`computeQuote`

### Catálogo (CATALOG)

- **CATALOG-01**: Catálogo/precios editables fuera del código (CMS o archivo de datos externo)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Migración a TypeScript | Diferida a v2 — este milestone prioriza estabilidad y cobertura |
| Backend propio / base de datos / auth | La app es cliente; el envío usa servicio externo liviano |
| Rediseño visual / nueva identidad | Fuera de este ciclo de mejoras |

## Traceability

Qué fases cubren qué requisitos. Se completa al crear el roadmap.

| Requirement | Phase | Status |
|-------------|-------|--------|
| STAB-01 | Phase 1 | Pending |
| STAB-02 | Phase 1 | Pending |
| STAB-03 | Phase 1 | Pending |
| STAB-04 | Phase 1 | Pending |
| STAB-05 | Phase 1 | Pending |
| LOGIC-01 | Phase 2 | Pending |
| LOGIC-02 | Phase 2 | Pending |
| LOGIC-03 | Phase 2 | Pending |
| QUOTE-01 | Phase 3 | Pending |
| QUOTE-02 | Phase 3 | Pending |
| QUOTE-03 | Phase 3 | Pending |
| SAFETY-01 | Phase 4 | Pending |
| SAFETY-02 | Phase 4 | Pending |
| SAFETY-03 | Phase 4 | Pending |
| A11Y-01 | Phase 5 | Pending |
| A11Y-02 | Phase 5 | Pending |
| A11Y-03 | Phase 5 | Pending |
| A11Y-04 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 18 total
- Mapped to phases: 18
- Unmapped: 0 ✓

---
*Requirements defined: 2026-06-07*
*Last updated: 2026-06-07 after initial definition*
