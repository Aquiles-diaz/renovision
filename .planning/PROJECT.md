# reno · vision

## What This Is

reno · vision es una SPA cliente (React 18 + Vite 5) que funciona como configurador 3D de muebles con cotización instantánea ("cotizador"). El usuario elige líneas, ambientes, materiales (melaminas), patas y dimensiones, ve el mueble renderizado en 3D (three.js) con vista AR (@google/model-viewer), y obtiene un precio calculado en el momento. No tiene backend: catálogo y precios viven hard-coded en el código y el estado persiste en la URL.

## Core Value

El configurador 3D + cotizador debe funcionar de forma fluida y confiable: el usuario arma su mueble, lo ve en 3D/AR sin que la app se rompa ni se ralentice, y obtiene un precio correcto. Si todo lo demás falla, esto no puede fallar.

## Requirements

### Validated

<!-- Inferido del código existente — ya funciona y se usa. -->

- ✓ Navegación entre vistas (home, materiales, building, room, studio) vía router condicional en `app.jsx` — existing
- ✓ Catálogo de muebles, melaminas, patas, líneas y ambientes — existing (`data.jsx`)
- ✓ Cálculo de cotización (`computeQuote`) a partir de configuración — existing
- ✓ Render 3D procedural del mueble con three.js (`buildFurnitureGroup`) — existing (`Studio3D.jsx`)
- ✓ Exportación GLB + vista AR vía `@google/model-viewer` — existing
- ✓ Persistencia de la configuración en el query string de la URL — existing
- ✓ Vista de ambientes con hotspots (`RoomView.jsx`) — existing

### Active

<!-- Mejoras de este milestone: resolver los concerns documentados en .planning/codebase/CONCERNS.md, por fases. -->

- [ ] Estabilidad crítica del motor 3D: disponer geometrías/materiales en cada rebuild, liberar cache de texturas y blob URLs de AR, Error Boundary global, guard de WebGLRenderer/context-loss
- [ ] Corrección de lógica/routing: eliminar setState durante render en `app.jsx`, arreglar mapeo de hotspots por índice en `RoomView.jsx`, hacer que `furnitureForRoom` filtre por sala en `data.jsx`
- [ ] Entrega real de la cotización: generar PDF de verdad (client-side) y que "Solicitar" envíe la cotización al negocio vía servicio (EmailJS/Formspree/endpoint)
- [ ] Red de seguridad: tests del núcleo de precios (`computeQuote`) y geometría, + CI básico (lint + build)
- [ ] Accesibilidad y pulido: labels en botones de íconos/hotspots, roles en elementos clickeables, limpiar cadena de setTimeout de transiciones, sacar `dist/` del control de versiones

### Out of Scope

- Migración a TypeScript — diferida; este milestone prioriza estabilidad y cobertura sobre tipado (decisión del usuario)
- Backend completo / base de datos / autenticación — la app es cliente; "Solicitar" usará un servicio liviano, no un backend propio
- Rediseño visual / nueva identidad de marca — fuera de este ciclo de mejoras

## Context

- **Stack:** React 18 + Vite 5, JavaScript (JSX, sin TypeScript), three.js `^0.163.0`, `@google/model-viewer`. Sin tests, sin CI.
- **Arquitectura:** router condicional hecho a mano en `src/app.jsx` sobre componentes presentacionales planos en `src/`, navegación compartida `RenoNav`, un único `styles/styles.css` global.
- **Datos:** fuente única hard-coded en `src/data.jsx` (`FURNITURE`, `MELAMINAS`, `LEGS`, `LINES`, `ROOMS`, `computeQuote`). Sin variables de entorno ni secretos.
- **Mapa del código:** `.planning/codebase/` (STACK, ARCHITECTURE, STRUCTURE, INTEGRATIONS, CONCERNS).
- **Concerns conocidos a atacar:** memory leaks de GPU al reconstruir geometría, falta de Error Boundary (pantalla blanca ante error 3D), setState durante render, botones de "PDF"/"Solicitar" engañosos, mapeo frágil de hotspots, ausencia de tests/CI. Detalle y severidad en `.planning/codebase/CONCERNS.md`.
- **Git:** se inicializó un repositorio dedicado para el proyecto (antes git resolvía al repo accidental de la carpeta home del usuario).

## Constraints

- **Tech stack**: Mantener React 18 + Vite + JSX — no introducir TypeScript en este milestone.
- **Sin backend propio**: el envío de cotización debe resolverse con un servicio externo liviano (EmailJS/Formspree/endpoint), no con infraestructura propia.
- **Cliente puro**: la app debe seguir funcionando sin servidor; el estado sigue en la URL.
- **Compatibilidad**: las correcciones no deben romper la experiencia 3D/AR existente.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Inicializar repo git propio en `renovision/` | Git resolvía al repo accidental de `C:/Users/aquil` (toda la home sin trackear); el proyecto necesita historia limpia | ✓ Good |
| Entrega de cotización vía servicio externo (EmailJS/Formspree) + PDF client-side | El usuario quiere que "Solicitar" realmente envíe al negocio sin montar backend propio | — Pending |
| Posponer migración a TypeScript | Priorizar estabilidad + cobertura de tests sobre tipado en este ciclo | — Pending |
| Trabajo por fases sobre los concerns documentados | Riesgo ordenado por impacto: estabilidad → lógica → funcionalidad → red de seguridad → pulido | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-06-07 after initialization*
