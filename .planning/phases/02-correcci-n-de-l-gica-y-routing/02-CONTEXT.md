# Phase 2: Corrección de lógica y routing - Context

**Gathered:** 2026-06-07
**Status:** Ready for planning

<domain>
## Phase Boundary

El routing y los datos se comportan de forma correcta y predecible: la normalización de deep links no usa `setState` durante el render, los hotspots de la vista de ambiente apuntan siempre al mueble correcto mediante un mapeo explícito por dato, y `furnitureForRoom(roomId)` filtra realmente los muebles por sala. Cubre LOGIC-01, LOGIC-02, LOGIC-03. NO incluye cambios al motor 3D (Fase 1), a la cotización/entrega (Fase 3), ni rediseño visual.

</domain>

<decisions>
## Implementation Decisions

### Asociación mueble↔ambiente (LOGIC-03)
- **D-01:** La membresía vive en cada **ambiente**: cada `ROOM` lleva su lista de muebles (ids) que aparecen en esa sala. `furnitureForRoom(roomId)` deja de devolver `FURNITURE.slice()` (todo el catálogo) y devuelve la lista curada de ese ambiente, resolviendo los ids contra `FURNITURE`. El filtrado debe tener efecto **observable**: ambientes distintos muestran conjuntos de muebles distintos.
- **D-02:** El mapeo mueble→ambiente lo cura Claude con criterio sensato (queda editable en `src/data.jsx` y revisable por el usuario). Default propuesto (ajustable):
  - **sala** (estar): Mesa TV, Contenedor, Vajillero
  - **comedor**: Vajillero, Contenedor, Mesa TV
  - **recibidor** (hall): Consola, Contenedor
  - **cabina** (vestidor): Columna, Consola, Vajillero
  - **dormitorio** (suite): Columna, Consola, Vajillero
  - **estudio** (home office): Columna, Consola, Contenedor
  - **lavandería** (servicio): Columna, Contenedor
  - **garaje** (guardado): Columna, Contenedor
  - Criterio: muebles "sociales" (Mesa TV, Vajillero) en ambientes de estar/comer; muebles de guardado/altura (Columna, Consola) en ambientes privados y de servicio. El usuario puede reordenar/reasignar sin cambiar el mecanismo.

### Posicionamiento de hotspots (LOGIC-02)
- **D-03:** Las coordenadas del hotspot son **fijas por mueble**: cada item de `FURNITURE` gana un campo `spot: { x, y }` (porcentajes) global. Los hotspots en `RoomView` se renderizan leyendo `f.spot` de cada mueble de la lista curada, **eliminando** el `spots[i%spots.length]` por índice con módulo. Como cada mueble tiene una coordenada distinta y dentro de un ambiente los muebles son distintos, no hay solapamiento.
- **D-04:** Empty state defensivo: si un ambiente quedara con 0 muebles, la vista muestra un mensaje (ej. "sin muebles disponibles en este ambiente") en vez de un stage vacío. El mapeo curado (D-02) garantiza ≥2 muebles por ambiente, pero el manejo se implementa igual por robustez.

### Normalización de routing (LOGIC-01)
- **D-05:** La normalización de deep links inválidos ocurre en el **inicializador de estado** (al derivar el estado inicial desde `readUrl()`), no en el cuerpo del render y no con `setState`/`setTimeout` durante el render (se elimina el bloque `app.jsx:42-45`). Sin parpadeo: la vista rota nunca se renderiza.
- **D-06:** La validación cubre dos casos: (a) `view` es `studio`/`room` pero no hay `room` en la URL; (b) el `room` id de la URL no existe (`roomById` devuelve undefined). En ambos, la vista inicial se corrige.
- **D-07:** El destino del fallback es **home** (la portada), no `building`.

### Claude's Discretion
- Forma exacta del campo en `ROOM` (array de ids `furniture:[...]` vs objetos) — el planner elige la más limpia, respetando D-01/D-03.
- Implementación concreta del inicializador (función pura que normaliza el resultado de `readUrl()` antes de pasar a `useState`).
- Copia exacta del empty state y estilos del mensaje.
- Coordenadas `spot` concretas de cada mueble (distribuidas para no amontonarse en el stage).

</decisions>

<specifics>
## Specific Ideas

- El filtrado por sala debe ser **visible**: si el usuario entra a dos ambientes distintos, debe ver listas de muebles distintas (no el mismo catálogo completo).
- Mantener intacto el comportamiento cinematográfico building→room (`enterRoom`) y la URL compartible — esta fase corrige lógica, no rediseña la navegación.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requisitos y alcance
- `.planning/ROADMAP.md` §"Phase 2: Corrección de lógica y routing" — goal, success criteria (3), requirements LOGIC-01/02/03.
- `.planning/REQUIREMENTS.md` §"Lógica y routing (LOGIC)" — definición de LOGIC-01, LOGIC-02, LOGIC-03.

### Concerns de origen
- `.planning/codebase/CONCERNS.md` — los anti-patrones que esta fase resuelve (setState en render, hotspots por índice, furnitureForRoom ignora el argumento).

No external specs adicionales — el resto de los requisitos quedan capturados en las decisiones de arriba.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/data.jsx:96-105` `ROOMS` (8 ambientes con `id`, `struct`, `name`, `sub`, `floor`) — se le agrega la lista de muebles por ambiente (D-01).
- `src/data.jsx:53-93` `FURNITURE` (5 módulos) — se le agrega `spot:{x,y}` por mueble (D-03).
- `src/data.jsx:108` `furnitureForRoom(roomId)` — hoy `return FURNITURE.slice()`; se reescribe para filtrar real (D-01).
- `src/app.jsx:11-20` `readUrl()` — fuente del estado inicial; el inicializador de normalización envuelve/consume su resultado (D-05/D-06).

### Established Patterns
- `src/RoomView.jsx:10-13, 28-32` — `spots` array + `spots[i%spots.length]`; es exactamente lo que D-03 reemplaza por `f.spot`.
- `src/app.jsx:34-45` — `readUrl()` → `useState(init.*)`; punto donde se inserta la normalización en el inicializador (D-05).
- Estado en la URL via `writeUrl`/`history.replaceState` — no se toca; sigue siendo el estado compartible.

### Integration Points
- `RoomView` consume `furnitureForRoom(room.id)` y renderiza hotspots + lista lateral — ambos pasan a depender de la lista curada y de `f.spot`.
- `App` decide la vista inicial; la normalización corregida alimenta `useState(view/room)`.

</code_context>

<deferred>
## Deferred Ideas

- Catálogo/precios editables fuera del código (CMS o archivo externo) — CATALOG-01, diferido a v2.
- Migración a TypeScript de `data.jsx` — TYPES-01, diferido a v2.

None adicional — la discusión se mantuvo dentro del scope de la fase.

</deferred>

---

*Phase: 02-correcci-n-de-l-gica-y-routing*
*Context gathered: 2026-06-07*
