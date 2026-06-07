---
phase: 02-correcci-n-de-l-gica-y-routing
plan: 01
subsystem: data-layer
tags: [react, data-model, catalog, filtering]
provides:
  - ROOMS[].furniture membership list per ambiente (curated mapping)
  - FURNITURE[].spot {x,y} hotspot coordinate per mueble
  - furnitureForRoom(roomId) real filtering reusing roomById/furnitureById
affects: [RoomView, room-navigation]
tech-stack:
  added: []
  patterns: [data-driven membership, finder reuse]
key-files:
  created: []
  modified: [src/data.jsx]
key-decisions:
  - "D-01/D-02: membership lives on each ROOM; furnitureForRoom returns curated list, not FURNITURE.slice()"
  - "D-03: each FURNITURE gains a global spot:{x,y}"
duration: ~10min
completed: 2026-06-07
---

# Phase 2: Corrección de lógica y routing — Plan 01 Summary

**`furnitureForRoom` ahora filtra real por ambiente y cada mueble lleva su coordenada de hotspot (LOGIC-03 + base de LOGIC-02).**

## Performance
- **Duration:** ~10 min (parte del diff consolidado de Fase 2)
- **Tasks:** 2 (ROOMS.furniture + FURNITURE.spot; furnitureForRoom real)
- **Files modified:** 1

## Accomplishments
- Cada `ROOM` declara `furniture:[id,...]` con el mapeo curado de CONTEXT.md D-02 (8 ambientes, ≥2 muebles c/u).
- Cada item de `FURNITURE` gana `spot:{x,y}` global (5 coordenadas distintas).
- `furnitureForRoom(roomId)` reescrito: `roomById` → `room.furniture` → `furnitureById` + `.filter(Boolean)`; ambiente desconocido/sin lista → `[]`. Eliminado el `FURNITURE.slice()`.

## Task Commits
1. **Modelo de datos (ROOMS.furniture + FURNITURE.spot + furnitureForRoom)** — `c5365b9`
   (entregado dentro del diff consolidado de Fase 2, sobre baseline `bf0f250`)

## Files Created/Modified
- `src/data.jsx` — `ROOMS` con `furniture:[...]`, `FURNITURE` con `spot:{x,y}`, `furnitureForRoom` con filtrado real.

## Decisions & Deviations
- Decisiones D-01/D-02/D-03 aplicadas tal cual.
- Desviación de proceso (no de contenido): el código se implementó como un diff único de Fase 2 (`c5365b9`) y el split formal en planes + verificación se hizo a continuación; la verificación goal-backward confirmó el código contra estos planes (VERIFICATION status: passed).

## Next Phase Readiness
- `f.spot` y la lista curada quedan disponibles para que Plan 03 (RoomView) renderice hotspots por dato y maneje el empty-state.
