# Roadmap: reno · vision

**Created:** 2026-06-07
**Granularity:** coarse (3-5 phases)
**Core Value:** El configurador 3D + cotizador funciona de forma fluida y confiable — el usuario arma su mueble, lo ve en 3D/AR sin que la app se rompa ni se ralentice, y obtiene un precio correcto.

> Milestone de mejoras (brownfield). Resuelve los concerns de `.planning/codebase/CONCERNS.md` por fases, ordenadas por riesgo/impacto: estabilidad → lógica → entrega de cotización → red de seguridad → accesibilidad/pulido.

## Phases

- [ ] **Phase 1: Estabilidad crítica del motor 3D** - Sin fugas de GPU/memoria, sin pantalla blanca, WebGL tolerante a fallos
- [x] **Phase 2: Corrección de lógica y routing** - Sin setState en render, hotspots estables, scoping de sala real
- [ ] **Phase 3: Entrega real de la cotización** - PDF de verdad, "Solicitar" que envía vía servicio externo, etiquetas honestas
- [ ] **Phase 4: Red de seguridad — tests + CI** - Cobertura de precios y geometría, pipeline lint + build + tests
- [ ] **Phase 5: Accesibilidad y pulido** - Labels accesibles, semántica correcta, timers limpios, `dist/` fuera de VCS

## Phase Details

### Phase 1: Estabilidad crítica del motor 3D
**Goal**: El usuario puede explorar anchos, melaminas y patas en sesiones largas sin que la memoria GPU crezca ni la app se rompa; cualquier fallo del render 3D degrada a un fallback recuperable en vez de pantalla blanca.
**Depends on**: Nothing (first phase — máxima prioridad por riesgo de crash/leak en el core)
**Requirements**: STAB-01, STAB-02, STAB-03, STAB-04, STAB-05
**Success Criteria** (what must be TRUE):
  1. Cambiar repetidamente ancho/melamina/patas/líneas en el Studio no aumenta de forma sostenida la memoria GPU/VRAM — las geometrías y materiales del grupo anterior se liberan (dispose) en cada reconstrucción (`src/Studio3D.jsx` rebuild effect ~351-359 y `buildFurnitureGroup` ~114-240).
  2. El cache de texturas de melaminas se libera al desmontar el Studio (no sobrevive indefinidamente al navegar fuera) (`src/Studio3D.jsx:80-111`).
  3. Salir del Studio (Home/Back) con el modal AR abierto revoca el blob URL del GLB exportado — no quedan object URLs colgando (`src/Studio3D.jsx:472-489`).
  4. Un error en el render 3D muestra un fallback recuperable (ej. render 2D existente + mensaje), no una pantalla blanca de toda la SPA — hay un Error Boundary que envuelve el Studio/Viewer (`src/main.jsx`, `src/app.jsx`).
  5. En un navegador sin WebGL o ante context-loss, la creación del `WebGLRenderer` no crashea la app: se captura el fallo y degrada al panel 2D (`src/Studio3D.jsx:259-268`).
**Plans:** 2 plans
- [ ] 01-PLAN.md — Endurecimiento del motor 3D en Studio3D.jsx: dispose por reconstrucción + cache de texturas (STAB-01/02), revoke de blob AR (STAB-03), WebGLRenderer robusto + context-loss + auto-captura del loop rAF (STAB-05 + parte async de STAB-04)
- [ ] 02-PLAN.md — Error Boundary de clase (ErrorBoundary.jsx) + wrap del Studio en app.jsx para fallback recuperable ante throws síncronos (parte síncrona de STAB-04)
**UI hint**: yes

### Phase 2: Corrección de lógica y routing
**Goal**: El routing y los datos se comportan de forma correcta y predecible — sin warnings de React, con hotspots que apuntan al mueble correcto y un scoping de sala que realmente filtra.
**Depends on**: Phase 1 (los fixes de estabilidad asientan el motor 3D antes de tocar la lógica de navegación y datos que lo alimentan)
**Requirements**: LOGIC-01, LOGIC-02, LOGIC-03
**Success Criteria** (what must be TRUE):
  1. Abrir un deep link inválido (`studio`/`room` sin sala resuelta) normaliza la vista sin warnings de React ni flash visible — la normalización vive en un efecto o en el inicializador de estado, no en el cuerpo del render (`src/app.jsx:42-45`).
  2. Cada hotspot de la vista de ambiente apunta siempre al mueble correcto mediante un mapeo explícito por dato (no por índice de array con módulo) y no se solapa al agregar un mueble (`src/RoomView.jsx:10-13, 28-32`).
  3. `furnitureForRoom(roomId)` devuelve solo los muebles de esa sala (filtrado real por un campo de datos), no el catálogo completo — la selección de sala tiene efecto observable (`src/data.jsx:108`).
**Plans:** 3 plans
- [x] 01-PLAN.md — Datos como fuente de verdad en data.jsx: membresía mueble↔ambiente (ROOMS.furniture) + spot por mueble + furnitureForRoom filtra real (LOGIC-03, D-01/D-02/D-03)
- [x] 02-PLAN.md — Normalización de deep links en el inicializador de estado de app.jsx (normalizeInit puro, sin setState en render, fallback a home) (LOGIC-01, D-05/D-06/D-07)
- [x] 03-PLAN.md — Hotspots de RoomView posicionados desde f.spot (sin índice módulo) + empty-state defensivo (LOGIC-02, D-03/D-04)
**UI hint**: yes

### Phase 3: Entrega real de la cotización
**Goal**: El usuario obtiene un PDF real de su cotización y, al "Solicitar", la cotización llega efectivamente al negocio vía un servicio externo liviano — sin promesas falsas en los botones.
**Depends on**: Phase 2 (la lógica de precios/datos que alimenta la cotización debe ser correcta antes de exportarla y enviarla)
**Requirements**: QUOTE-01, QUOTE-02, QUOTE-03
**Success Criteria** (what must be TRUE):
  1. El botón de exportar genera un PDF real client-side de la cotización (no un `.html` disfrazado de PDF) (`src/Studio3D.jsx:498-551`).
  2. "Solicitar" envía la cotización al negocio mediante un servicio externo (EmailJS/Formspree/endpoint) y confirma visiblemente el envío al usuario — sin backend propio (`src/Studio3D.jsx:707-715`).
  3. Cada etiqueta de botón describe con precisión su acción real (descargar PDF / solicitar / etc.) — sin promesas engañosas.
**Plans**: TBD
**UI hint**: yes

### Phase 4: Red de seguridad — tests + CI
**Goal**: El núcleo del producto (precios y geometría) queda cubierto por tests automatizados y un pipeline de CI corre lint + build + tests en cada push/PR, de modo que regresiones críticas no pasen silenciosas.
**Depends on**: Phase 3 (escribir los tests sobre `computeQuote`/geometría ya corregidos en Phases 1-3 evita escribir tests que codifiquen el comportamiento defectuoso; la red de seguridad protege lo recién estabilizado)
**Requirements**: SAFETY-01, SAFETY-02, SAFETY-03
**Success Criteria** (what must be TRUE):
  1. Existen tests automatizados que cubren `computeQuote` (y `baysForWidth`) con casos representativos y pasan en verde (`src/data.jsx:114-147`).
  2. Existen tests para la lógica de geometría/configuración clave (ej. `buildFurnitureGroup` y selección de datos por sala/mueble) (`src/Studio3D.jsx`, `src/data.jsx`).
  3. Un pipeline de CI corre lint + build + tests automáticamente en cada push/PR y falla si alguno falla.
**Plans**: TBD

### Phase 5: Accesibilidad y pulido
**Goal**: La app es operable por teclado y lectores de pantalla en sus controles clave, las transiciones no dejan timers colgados, y el repositorio queda limpio de artefactos de build.
**Depends on**: Phase 4 (pulido final; con la red de seguridad activa, estos cambios de bajo riesgo se hacen con confianza de no regresar)
**Requirements**: A11Y-01, A11Y-02, A11Y-03, A11Y-04
**Success Criteria** (what must be TRUE):
  1. Los botones de íconos (zoom, AR, cerrar) y los hotspots tienen labels accesibles (`aria-label`/texto) — un lector de pantalla los anuncia con nombre (`src/RoomView.jsx:28-32`, `src/Studio3D.jsx:628-633`).
  2. Los elementos clickeables clave usan semántica correcta (`<button>` o `role="button"` + `tabIndex` + handlers de teclado) y son operables por teclado (`src/Nav.jsx:8`, `src/Materiales.jsx:59-63`).
  3. La cadena de transiciones por `setTimeout` se limpia al navegar/desmontar — no quedan timers que disparen `setRoom`/`setView`/`setFlash` tras cambiar de vista (`src/app.jsx:48-57`).
  4. `dist/` está fuera del control de versiones y verificado como git-ignored (no se versiona output de build).
**Plans**: TBD
**UI hint**: yes

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Estabilidad crítica del motor 3D | 0/2 | Planned | - |
| 2. Corrección de lógica y routing | 3/3 | Complete ✓ | 2026-06-07 |
| 3. Entrega real de la cotización | 0/0 | Not started | - |
| 4. Red de seguridad — tests + CI | 0/0 | Not started | - |
| 5. Accesibilidad y pulido | 0/0 | Not started | - |

## Coverage

- v1 requirements: 18 total
- Mapped to phases: 18
- Unmapped: 0 ✓

---
*Roadmap created: 2026-06-07*
