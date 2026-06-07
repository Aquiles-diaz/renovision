---
phase: 02-correcci-n-de-l-gica-y-routing
plan: 03
type: execute
wave: 2
depends_on: [02-01]
files_modified: [src/RoomView.jsx]
autonomous: true
requirements: [LOGIC-02]
must_haves:
  truths:
    - "Each hotspot in the room view is positioned from its own furniture's spot field, so it always points at the correct furniture"
    - "Adding a furniture item to a room does not cause hotspot overlap (positions come from data, not array index modulo)"
    - "A room with zero furniture renders a defensive empty-state message instead of an empty stage"
    - "Clicking a hotspot calls onPick with that furniture's id"
    - "Cubre D-03, D-04 (CONTEXT.md): hotspots posicionados desde f.spot (sin índice módulo) y empty-state defensivo cuando un ambiente queda sin muebles"
  artifacts:
    - path: "src/RoomView.jsx"
      provides: "Hotspots rendered from f.spot; index-modulo positioning removed; empty-state message"
      contains: "f.spot"
  key_links:
    - from: "RoomView hotspots"
      to: "furnitureForRoom(room.id) items' spot"
      via: "map over list using f.spot.x / f.spot.y"
      pattern: "f\\.spot"
---

<objective>
Render room-view hotspots from each furniture item's own `spot` field (the data added in Plan 01), removing the `spots[i % spots.length]` index-modulo positioning so every hotspot points at the correct furniture and never overlaps; add a defensive empty-state when a room has zero furniture (LOGIC-02, D-03/D-04).

Purpose: Hotspot→furniture mapping must be explicit per-datum, stable as the catalog grows, and degrade gracefully for an empty room.
Output: Updated `src/RoomView.jsx`.
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
@src/RoomView.jsx

<interfaces>
From src/data.jsx (delivered by Plan 02-01):
  furnitureForRoom(roomId) → FURNITURE[]  // curated, resolved subset; [] for unknown room
  each FURNITURE item has: id, name, icon, widths[], and spot:{ x:"NN%", y:"NN%" }
Existing CSS classes (styles/styles.css): .hotspot, .room__stage, .room__title, .room__panel, .lead, .fcard
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Position hotspots from f.spot and add the empty-state</name>
  <read_first>
    - src/RoomView.jsx (full file — list = furnitureForRoom(room.id), hotspot map ~24-28, title/panel ~30-61)
    - src/data.jsx FURNITURE spot fields and furnitureForRoom (delivered by Plan 02-01)
    - .planning/phases/02-correcci-n-de-l-gica-y-routing/02-CONTEXT.md decisions D-03, D-04 (render hotspots from f.spot, remove spots[i%spots.length]; defensive empty-state message when a room has 0 furniture)
  </read_first>
  <action>
    Drive the hotspot list from `furnitureForRoom(room.id)` and position each hotspot button using that item's own `f.spot` (left from `f.spot.x`, top from `f.spot.y`). Remove any module-local `spots` array and any `spots[i % spots.length]` / index-based positioning. Each hotspot's `onClick` must call `onPick(f.id)` and carry the furniture name as its accessible title so it points at the correct furniture. Add a defensive empty-state: when the curated list is empty, render a clear message (reusing existing classes such as `room__title`/`lead`) instead of a bare empty stage, rather than mapping over an empty array silently. Do not change the cinematic transition, navigation props, the side panel `fcard` quote rendering, or any unrelated markup; this is a positioning-source + empty-state change only.
  </action>
  <verify>
    <automated>npm run build</automated>
  </verify>
  <acceptance_criteria>
    - `src/RoomView.jsx` contains no `spots[` index-modulo expression and no module-local `spots` positioning array.
    - Each hotspot's inline style derives `left`/`top` from `f.spot.x` / `f.spot.y`, and its `onClick` calls `onPick(f.id)`.
    - When `furnitureForRoom(room.id)` is empty, a visible empty-state message renders (the component branches on an empty list rather than only mapping it).
    - The side-panel furniture cards and the navigation/transition props are unchanged.
    - `npm run build` exits 0.
  </acceptance_criteria>
  <done>Hotspots are positioned from each item's f.spot (no index modulo), point at the correct furniture via onPick(f.id), and an empty room shows a defensive message.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| data layer → RoomView | RoomView trusts `furnitureForRoom` output; a malformed/empty list must not crash the stage. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-02-05 | Denial of Service | RoomView with an empty furniture list | mitigate | Defensive empty-state branch (D-04) renders a message instead of mapping an empty array into a blank stage. |
| T-02-06 | Tampering | hotspot→furniture mapping | mitigate | Position and click target both derive from the same `f` record (`f.spot`, `onPick(f.id)`), eliminating index-modulo drift that could mis-target furniture. |
</threat_model>

<verification>
- `npm run build` exits 0.
- No `spots[` index-modulo positioning remains in RoomView.
- Hotspots use `f.spot` and `onPick(f.id)`; empty room renders a message.
</verification>

<success_criteria>
Every hotspot is positioned from its own furniture's `spot` and targets that furniture via `onPick(f.id)` (no index-modulo, no overlap as the catalog grows), and an empty room renders a defensive message. LOGIC-02 satisfied.
</success_criteria>

<output>
Create `.planning/phases/02-correcci-n-de-l-gica-y-routing/02-03-SUMMARY.md` when done
</output>
</output>
