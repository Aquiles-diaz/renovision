# Phase 2: Corrección de lógica y routing - Discussion Log

> **Audit trail only.** No es input para planning/research/execution — las decisiones viven en CONTEXT.md.

**Date:** 2026-06-07
**Phase:** 02-correcci-n-de-l-gica-y-routing
**Mode:** discuss
**Areas discussed:** Catálogo por ambiente, Modelo de datos mueble↔ambiente, Posición de hotspots, Fallback de deep link inválido

## Questions & Answers

### Área 1 — Qué muebles van en cada ambiente (LOGIC-03)
- **Opciones:** Curá vos un mapeo sensato / Te doy yo el mapeo exacto / Amplio con exclusiones
- **Elección:** Curá vos un mapeo sensato (Claude cura, usuario revisa en CONTEXT.md)

### Área 2 — Modelo de datos mueble↔ambiente (LOGIC-03)
- **Opciones:** En cada ambiente (unifica con hotspots) / Campo rooms:[] en cada mueble / Por tag/categoría
- **Elección:** En cada ambiente — la membresía vive en cada ROOM

### Área 3 — Posición de los hotspots (LOGIC-02)
- **Opciones:** Coords junto a la lista del ambiente / Coords fijas por mueble / Array estable por id
- **Elección:** Coords fijas por mueble — cada FURNITURE gana `spot:{x,y}` global
- **Nota de reconciliación:** Combinado con Área 2 → el ambiente posee la membresía, el mueble posee su coordenada. Sin conflicto.

### Área 4 — Fallback de deep link inválido (LOGIC-01)
- **Opciones:** En el inicializador → building / En useEffect → building / En el inicializador → home
- **Elección:** En el inicializador → home (sin parpadeo, sin setState-en-render, fallback a la portada)

## Deferred Ideas
- CATALOG-01 (catálogo editable fuera del código) — v2
- TYPES-01 (TypeScript en data.jsx) — v2
