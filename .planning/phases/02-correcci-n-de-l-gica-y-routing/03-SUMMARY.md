---
phase: 02-correcci-n-de-l-gica-y-routing
plan: 03
subsystem: ui-room-view
tags: [react, hotspots, empty-state]
provides:
  - hotspots positioned by f.spot (stable per-data mapping)
  - defensive empty-state when a room has no furniture
affects: [room-navigation]
tech-stack:
  added: []
  patterns: [data-driven rendering, defensive empty-state]
key-files:
  created: []
  modified: [src/RoomView.jsx]
key-decisions:
  - "D-03: render hotspots from f.spot, drop spots[i%spots.length]"
  - "D-04: empty-state message instead of empty stage"
duration: ~5min
completed: 2026-06-07
---

# Phase 2: Corrección de lógica y routing — Plan 03 Summary

**Los hotspots se posicionan por dato (`f.spot`) en vez de índice%módulo, y un ambiente sin muebles muestra un mensaje (LOGIC-02 + D-04).**

## Performance
- **Duration:** ~5 min (parte del diff consolidado de Fase 2)
- **Tasks:** 1 (hotspots por f.spot + empty-state)
- **Files modified:** 1

## Accomplishments
- Eliminados el array local `spots` y el `spots[i%spots.length]`; cada hotspot se renderiza con `style={{ left:f.spot.x, top:f.spot.y }}`, `key={f.id}` estable → siempre apunta al mueble correcto, sin solapamiento.
- Empty-state defensivo (`empty = list.length === 0`): el stage muestra "Sin muebles disponibles en este ambiente" y el panel "No hay muebles asignados a este ambiente todavía." en vez de quedar vacío.

## Task Commits
1. **Hotspots por f.spot + empty-state** — `c5365b9`

## Files Created/Modified
- `src/RoomView.jsx` — hotspots por `f.spot`, branch de empty-state en stage y panel.

## Decisions & Deviations
- Decisiones D-03 (consumo) / D-04 aplicadas tal cual.
- Depende de Plan 01 (`f.spot` + `furnitureForRoom` curado), ya entregado en el mismo commit.
- Misma desviación de proceso (diff consolidado `c5365b9`).

## Next Phase Readiness
- Vista de ambiente correcta y robusta; lista para accesibilidad (Fase 5: aria-labels de hotspots).
