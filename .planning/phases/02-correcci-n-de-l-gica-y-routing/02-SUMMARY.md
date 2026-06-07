---
phase: 02-correcci-n-de-l-gica-y-routing
plan: 02
subsystem: routing
tags: [react, routing, deep-link, state-initializer]
provides:
  - normalizeInit pure initializer for invalid deep links
  - removal of render-phase setState anti-pattern
affects: [app-router]
tech-stack:
  added: []
  patterns: [pure state initializer, no setState-in-render]
key-files:
  created: []
  modified: [src/app.jsx]
key-decisions:
  - "D-05: normalize in the state initializer, not in render body"
  - "D-06: handle both missing room and non-existent room id"
  - "D-07: fallback target is home"
duration: ~5min
completed: 2026-06-07
---

# Phase 2: Corrección de lógica y routing — Plan 02 Summary

**Los deep links inválidos se normalizan en el inicializador de estado, sin `setState` en el render ni parpadeo (LOGIC-01).**

## Performance
- **Duration:** ~5 min (parte del diff consolidado de Fase 2)
- **Tasks:** 1 (normalizeInit + remoción del bloque setTimeout)
- **Files modified:** 1

## Accomplishments
- Nueva función pura `normalizeInit(readUrl())` que corrige `view` antes de `useState`.
- Eliminado el bloque `if((view==="studio"||view==="room") && !room){ setTimeout(setView…) }` del cuerpo del render (anti-patrón setState-en-render).
- Cubre los dos casos inválidos: falta `room` en la URL y `room` id inexistente (`roomById`→undefined). Fallback a **home** (D-07). La vista rota nunca se renderiza → sin warning de React, sin flash.

## Task Commits
1. **normalizeInit + remoción de setState-en-render** — `c5365b9`

## Files Created/Modified
- `src/app.jsx` — `normalizeInit`, init via `normalizeInit(readUrl())`, `useState(init.room)`; sin setState en render.

## Decisions & Deviations
- Decisiones D-05/D-06/D-07 aplicadas tal cual.
- Sin cambios a `enterRoom` (transición cinematográfica) ni a `readUrl`/`writeUrl` (URL compartible).
- Misma desviación de proceso que Plan 01 (diff consolidado `c5365b9`, planificado/verificado después).

## Next Phase Readiness
- Routing estable; no bloquea fases siguientes.
