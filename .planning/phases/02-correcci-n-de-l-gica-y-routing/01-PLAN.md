---
phase: 02-correcci-n-de-l-gica-y-routing
plan: 01
type: execute
wave: 1
depends_on: []
files_modified: [src/data.jsx]
autonomous: true
requirements: [LOGIC-03]
must_haves:
  truths:
    - "furnitureForRoom(roomId) returns only the curated furniture of that room, not the full catalog"
    - "Two different rooms return different furniture lists (observable filtering)"
    - "An unknown or membership-less room id returns an empty list, never a crash"
    - "Each FURNITURE item carries a distinct spot:{x,y} coordinate consumed downstream by RoomView"
  artifacts:
    - path: "src/data.jsx"
      provides: "ROOMS with per-room furniture id lists, FURNITURE with spot fields, real furnitureForRoom filter"
      contains: "furniture:"
  key_links:
    - from: "furnitureForRoom"
      to: "ROOMS[].furniture + FURNITURE"
      via: "roomById then map(furnitureById).filter(Boolean)"
      pattern: "room\\.furniture\\.map\\(furnitureById\\)"
---

<objective>
Make `src/data.jsx` the single source of truth for room↔furniture membership and per-furniture hotspot coordinates, and make `furnitureForRoom(roomId)` filter for real instead of returning the whole catalog (LOGIC-03, D-01/D-02). Also add the `spot:{x,y}` field to every FURNITURE item (D-03 foundation) that Plan 02 (RoomView) consumes.

Purpose: Selecting different rooms must produce observably different furniture sets, and downstream hotspot rendering needs stable per-item coordinates.
Output: Updated `src/data.jsx` with `ROOMS[].furniture`, `FURNITURE[].spot`, and a real `furnitureForRoom`.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md
@.planning/phases/02-correcci-n-de-l-gica-y-routing/02-CONTEXT.md
@src/data.jsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Curate room membership and add per-furniture spot coordinates</name>
  <read_first>
    - src/data.jsx (FURNITURE ~53-98, ROOMS ~101-110, helpers furnitureById/roomById)
    - .planning/phases/02-correcci-n-de-l-gica-y-routing/02-CONTEXT.md decisions D-01, D-02, D-03 (the exact curated mapping per room and the spot field requirement)
  </read_first>
  <action>
    Add a `furniture` field to every entry of `ROOMS` holding the curated list of furniture ids for that room, exactly per D-02: sala → mesatv, contenedor, vajillero; comedor → vajillero, contenedor, mesatv; recibidor → consola, contenedor; cabina → columna, consola, vajillero; dormitorio → columna, consola, vajillero; estudio → columna, consola, contenedor; lavanderia → columna, contenedor; garaje → columna, contenedor. Use the id strings exactly as they appear in FURNITURE (mesatv, vajillero, consola, contenedor, columna). Every room must list at least two ids (D-04 guarantee). Add a `spot:{ x, y }` field (string percentages) to each FURNITURE item, distributing coordinates across the stage so no two of the five items share the same position — each item gets a distinct x and y so that any room's subset never overlaps. Do not change pricing fields, render paths, kind, widths, or any other existing FURNITURE/ROOMS property. The membership list belongs on ROOM, the spot belongs on FURNITURE — do not mix them.
  </action>
  <verify>
    <automated>node -e "const m=require('node:module');" ; npm run build</automated>
  </verify>
  <acceptance_criteria>
    - Every entry in ROOMS has a `furniture` array of ≥2 string ids, all of which exist in FURNITURE.
    - sala and comedor have different furniture-id arrays (order/content differs), proving membership is per-room data.
    - Every entry in FURNITURE has a `spot` object with string `x` and `y` percentage values, and no two FURNITURE items share an identical `{x,y}` pair.
    - No existing FURNITURE/ROOMS field (base, perBay, widths, render, kind, floor, struct, name, sub) was removed or altered.
    - `npm run build` exits 0.
  </acceptance_criteria>
  <done>ROOMS carry curated furniture id lists; FURNITURE items carry distinct spot coordinates; build passes.</done>
</task>

<task type="auto">
  <name>Task 2: Rewrite furnitureForRoom to filter real</name>
  <read_first>
    - src/data.jsx (furnitureForRoom ~113-117, roomById, furnitureById)
    - .planning/phases/02-correcci-n-de-l-gica-y-routing/02-CONTEXT.md decision D-01 (filtering must be observable; reuse roomById/furnitureById; return [] for unknown/empty room)
  </read_first>
  <action>
    Replace the body of `furnitureForRoom(roomId)` so it resolves the room via `roomById(roomId)`, and if the room is missing or has no `furniture` list returns an empty array; otherwise maps `room.furniture` through `furnitureById` and filters out any unresolved (falsy) ids before returning. It must no longer return `FURNITURE.slice()` or any whole-catalog form. Keep the function pure and reuse the existing `roomById`/`furnitureById` helpers rather than re-implementing lookups.
  </action>
  <verify>
    <automated>node --input-type=module -e "import('./src/data.jsx').then(d=>{const sala=d.furnitureForRoom('sala').map(f=>f.id);const com=d.furnitureForRoom('comedor').map(f=>f.id);if(JSON.stringify(sala)===JSON.stringify(com))throw new Error('rooms not distinct');if(d.furnitureForRoom('nope').length!==0)throw new Error('unknown room not empty');if(sala.length!==3)throw new Error('sala wrong count');console.log('ok',sala,com);})"</automated>
  </verify>
  <acceptance_criteria>
    - `furnitureForRoom('sala')` and `furnitureForRoom('comedor')` return different id sets (observable filtering, LOGIC-03).
    - `furnitureForRoom('nonexistent')` returns `[]` (length 0), no throw.
    - The returned array contains resolved FURNITURE objects (each has `.id` and `.spot`), not raw id strings.
    - The function body references `roomById` and `furnitureById` and contains no `FURNITURE.slice` and no whole-catalog return.
    - `npm run build` exits 0.
  </acceptance_criteria>
  <done>furnitureForRoom returns the curated, resolved subset per room and [] for unknown rooms; distinct rooms yield distinct lists.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| URL query → app state | `room` id from a shared/deep link is untrusted and may not exist (handled in Plan 03). |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-02-01 | Tampering | furnitureForRoom(roomId) input | mitigate | `roomById` guard + `.filter(Boolean)` reject unknown/unresolved ids, returning `[]` instead of leaking the full catalog or throwing. |
| T-02-02 | Denial of Service | render of a room with malformed membership | accept | Pure client data, no external input beyond a URL id; worst case is an empty list, already handled by the empty-state in Plan 02. |
</threat_model>

<verification>
- `npm run build` exits 0.
- Distinct rooms (sala vs comedor) return distinct furniture id lists.
- Unknown room id returns `[]`.
- Every FURNITURE item has a unique `spot`.
</verification>

<success_criteria>
ROOMS carry curated `furniture` id lists, FURNITURE items carry distinct `spot:{x,y}` coordinates, and `furnitureForRoom` filters real (observable per-room difference, `[]` for unknown). LOGIC-03 satisfied at the data layer.
</success_criteria>

<output>
Create `.planning/phases/02-correcci-n-de-l-gica-y-routing/02-01-SUMMARY.md` when done
</output>
