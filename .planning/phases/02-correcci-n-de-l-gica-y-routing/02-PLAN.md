---
phase: 02-correcci-n-de-l-gica-y-routing
plan: 02
type: execute
wave: 1
depends_on: []
files_modified: [src/app.jsx]
autonomous: true
requirements: [LOGIC-01]
must_haves:
  truths:
    - "Opening an invalid deep link (studio/room without a resolvable room) lands on home with no React warning and no visible flash"
    - "A deep link whose room id does not exist falls back to home"
    - "Routing normalization happens in the state initializer, not in the render body, and uses no setState/setTimeout during render"
    - "The cinematic building→room transition (enterRoom) and shareable-URL behavior remain intact"
  artifacts:
    - path: "src/app.jsx"
      provides: "Pure normalizeInit over readUrl() feeding useState; no setView during render"
      contains: "normalizeInit"
  key_links:
    - from: "App initial state"
      to: "readUrl()"
      via: "normalizeInit(readUrl()) before useState"
      pattern: "normalizeInit\\(readUrl\\(\\)\\)"
---

<objective>
Normalize invalid deep links in the state initializer instead of the render body, eliminating the `setTimeout(setView)` block and the resulting React warning / visible flash (LOGIC-01, D-05/D-06/D-07). Validate both the missing-room and non-existent-room cases; fall back to home.

Purpose: A shared/deep link pointing at `studio`/`room` without a resolvable room must open cleanly on home, never rendering the routed view first.
Output: Updated `src/app.jsx` with a pure `normalizeInit` and no render-phase state mutation.
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
@src/app.jsx

<interfaces>
From src/data.jsx — helpers App relies on for validation:
  roomById(id)      → ROOM | undefined
  furnitureById(id) → FURNITURE | undefined
readUrl() returns { view, room, m, w, mel } where room/view come from untrusted URL params.
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Normalize deep links in a pure initializer; remove render-phase setState</name>
  <read_first>
    - src/app.jsx (readUrl ~11-20, normalizeInit ~33-40, App initializer ~42-48, enterRoom ~51-60)
    - .planning/phases/02-correcci-n-de-l-gica-y-routing/02-CONTEXT.md decisions D-05, D-06, D-07 (normalize in the initializer not the render body; cover missing room AND non-existent room id; fallback target is home; remove the setTimeout/setView block)
  </read_first>
  <action>
    Ensure App derives its initial state by calling a pure `normalizeInit(readUrl())` once before the `useState` calls, and that no `setView`/`setTimeout` runs during the render body to "fix" routing (remove any such block, including the historical `app.jsx:42-45` pattern if present). `normalizeInit` must: resolve the URL room via `roomById(init.room)`; treat `view === "studio"` or `view === "room"` as requiring a resolved room (`needsRoom`); and when `needsRoom` is true but the room is unresolved (missing room param OR `roomById` returns undefined), force `view` to `"home"`. Return the normalized object with the resolved room. Feed `init.view`/`init.room` into `useState`. Do NOT alter `enterRoom`, `writeUrl`, `pickFurniture`, `onStudioConfig`, or any of the cinematic-transition `setTimeout`s in `enterRoom` — those are intended runtime behavior, not the render-phase bug. Keep `normalizeInit` pure (no hooks, no side effects, no setState).
  </action>
  <verify>
    <automated>npm run build</automated>
  </verify>
  <acceptance_criteria>
    - `src/app.jsx` contains a pure `normalizeInit` function and App's initial state comes from `normalizeInit(readUrl())` evaluated before/at the `useState` calls.
    - `normalizeInit` references `roomById` and returns `view: "home"` when `view` is `studio`/`room` and the room is unresolved (both the missing-room and non-existent-id cases).
    - The render body of `App` contains no `setView(`, `setRoom(`, or `setTimeout(` call (the cinematic `setTimeout`s live inside `enterRoom`, not the render body).
    - `enterRoom`, `writeUrl`, `readUrl`, `pickFurniture`, `goHome`, and `onStudioConfig` are unchanged in behavior.
    - `npm run build` exits 0.
  </acceptance_criteria>
  <done>Invalid deep links normalize to home via a pure initializer; no render-phase setState; cinematic transition and shareable URL untouched.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| URL query → initial app state | `view` and `room` from a shared/deep link are untrusted and may be inconsistent or point at a non-existent room. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-02-03 | Tampering | normalizeInit(readUrl()) | mitigate | Validate `view` against room resolvability via `roomById`; force `home` for any unresolved studio/room link before state is set, so a crafted URL cannot render a roomless studio/room view. |
| T-02-04 | Information Disclosure | deep link to non-existent room | accept | Falling back to home reveals nothing; no data is gated behind room ids. |
</threat_model>

<verification>
- `npm run build` exits 0.
- Render body of App has no setView/setRoom/setTimeout.
- normalizeInit forces home for studio/room links lacking a resolvable room.
</verification>

<success_criteria>
Deep-link normalization lives in a pure state initializer, both invalid cases (missing room param, non-existent room id) fall back to home, no React render-phase warning, and the cinematic building→room transition plus shareable URLs are preserved. LOGIC-01 satisfied.
</success_criteria>

<output>
Create `.planning/phases/02-correcci-n-de-l-gica-y-routing/02-02-SUMMARY.md` when done
</output>
