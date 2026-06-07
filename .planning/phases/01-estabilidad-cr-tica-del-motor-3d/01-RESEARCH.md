# Phase 1: Estabilidad crítica del motor 3D - Research

**Researched:** 2026-06-07
**Domain:** three.js resource lifecycle (disposal / GPU memory) + WebGL robustness + React 18 error boundaries, in a client-only React 18 + Vite SPA
**Confidence:** HIGH

> No CONTEXT.md exists for this phase (discuss-phase did not run). Research scope is constrained by `CLAUDE.md` project constraints (see `## Project Constraints (from CLAUDE.md)`) and the five phase requirements STAB-01..STAB-05.

## Summary

This is a **brownfield stability/refactor phase** on an existing, working 3D engine (`src/Studio3D.jsx`). No new packages are needed — every fix uses APIs already shipped by `three@0.163.0` and `react@18.3.1`, both confirmed installed. The work is surgical: add disposal traversal to the rebuild/unmount paths, give the module-global texture cache a release path, revoke AR blob URLs on unmount, wrap the Studio in a class-based Error Boundary, and guard `WebGLRenderer` creation + context-loss.

The single most important conceptual trap is the **ownership conflict between STAB-01 and STAB-02**: `buildFurnitureGroup` creates fresh geometries and materials on every rebuild (these are *owned by the build* and MUST be disposed per-rebuild), but the `MeshStandardMaterial`s reference **shared textures from the module-global `_texCache`** (owned by the module, shared across all builds and the GLB exporter). If the per-rebuild dispose traversal also disposes `material.map`, it will destroy a texture that the next build still expects to reuse, causing blank/black furniture. The correct strategy is: **dispose geometries + materials on every rebuild, but NEVER dispose textures during rebuild** — textures are disposed only once, at Studio unmount, when the whole cache is released (STAB-02).

The second trap is **async error invisibility (STAB-04)**: the render loop runs inside `requestAnimationFrame` (`Studio3D.jsx:315-320`). React error boundaries explicitly do NOT catch errors thrown in `requestAnimationFrame`/`setTimeout`/promise callbacks [CITED: react.dev/reference/react/Component]. So a boundary alone catches errors during React render/commit (e.g. a throw inside `Viewer3D`'s mount effect, or `<model-viewer>` element failure) but NOT a throw inside the animation loop. To make async render-loop failures recoverable, the loop must catch its own errors and surface them — either by cancelling the loop and setting local fallback state, or by storing the error and re-throwing it during the next React render so the boundary catches it.

**Primary recommendation:** Implement a single `disposeGroup(group)` helper (traverse, dispose geometry + material, skip `material.map`), call it in both the rebuild effect (before discarding the old group) and the unmount cleanup; add a `disposeTextureCache()` that disposes every `_texCache` texture and empties the object, called on Studio unmount; revoke `arUrl` in an unmount-safe `useEffect` cleanup; wrap `StudioScreen`/`Viewer3D` in a class `ErrorBoundary` with the existing 2D render panel as fallback; guard `new THREE.WebGLRenderer()` in try/catch behind a WebGL-availability probe and add `webglcontextlost`/`webglcontextrestored` listeners that degrade to the 2D panel.

## Project Constraints (from CLAUDE.md)

These are directives from `./CLAUDE.md` and `.planning/STATE.md`. Treat with the same authority as locked decisions — the planner must not recommend approaches that contradict them.

- **No TypeScript this milestone.** All code stays React 18 + Vite + JSX (`.jsx`). Error Boundary must be a plain-JS class component, not `.tsx`.
- **Client-only / no backend.** Fixes are pure browser-side; no server, no telemetry endpoint. Any logging is `console.warn`/`console.error` only.
- **Must not break the existing 3D/AR experience.** Disposal and guards must preserve current visual output (textured furniture, AR via `<model-viewer>`, GLB export). The shared `_texCache` + `buildFurnitureGroup` are reused by both the live viewer and the GLB exporter — changes must keep both working.
- **State stays in the URL.** No new global state store.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| STAB-01 | Geometrías y materiales se liberan (dispose) en cada reconstrucción del mueble | `disposeGroup()` traversal in rebuild effect (`Studio3D.jsx:351-359`) — dispose geometry + material, NOT textures. See Pattern 1. |
| STAB-02 | El cache global de texturas se libera cuando ya no se usa (no crece indefinidamente; freed on Studio unmount) | `disposeTextureCache()` clearing `_texCache` (`Studio3D.jsx:80-111`) on Studio unmount. See Pattern 2. |
| STAB-03 | Los blob URLs del export AR se revocan al cerrar el modal o desmontar el Studio | `useEffect` cleanup revoking `arUrl` (`Studio3D.jsx:472-489`). See Pattern 3. |
| STAB-04 | Un error en el render 3D no deja la app en pantalla blanca — Error Boundary con fallback recuperable | Class `ErrorBoundary` wrapping Studio (`main.jsx`/`app.jsx`); async-loop error surfacing. See Pattern 4. |
| STAB-05 | La creación del WebGLRenderer maneja fallos y context-loss sin crashear | WebGL probe + try/catch + `webglcontextlost`/`webglcontextrestored` (`Studio3D.jsx:259-268`). See Pattern 5. |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| GPU resource disposal (geometry/material) | Browser / Client (three.js) | — | WebGL resources live on the GPU; only the client three.js code can free them. |
| Texture cache lifecycle | Browser / Client (module-global state in `Studio3D.jsx`) | — | `_texCache` is a module-level singleton shared by viewer + exporter; release must be coordinated at the module boundary, triggered by React unmount. |
| AR blob URL revocation | Browser / Client (React component) | — | Object URLs are per-document browser memory; revoked via `URL.revokeObjectURL` tied to React lifecycle. |
| Render-error fallback | Browser / Client (React render tree) | — | Error boundary is a React-tree concern; fallback is the existing 2D render panel. |
| WebGL availability / context-loss | Browser / Client (canvas + WebGLRenderer) | — | Hardware/driver capability check and context-loss events are browser-only. |

**All five capabilities live entirely in the Browser/Client tier** — consistent with the no-backend constraint. There is no API/server tier to misassign work to. The planner should keep all tasks in `src/Studio3D.jsx`, plus one new Error Boundary component and its wrapping in `src/app.jsx` (or `src/main.jsx`).

## Standard Stack

No new dependencies. All work uses already-installed packages.

### Core (already installed — verified in node_modules)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `three` | 0.163.0 | 3D engine; provides `.dispose()` on geometry/material/texture, `renderer.dispose()`, `renderer.forceContextLoss()`, `renderer.info.memory` | The product's headline engine; disposal API is the canonical, only supported way to free GPU memory [CITED: threejs.org/docs How-to-dispose-of-objects] |
| `react` / `react-dom` | 18.3.1 | UI; error boundaries via class lifecycle `getDerivedStateFromError` + `componentDidCatch` | Boundaries are a built-in React feature; no library needed [CITED: react.dev/reference/react/Component] |

**Version verification:**
```
three          0.163.0   [VERIFIED: node_modules/three/package.json + package.json ^0.163.0]
react/react-dom 18.3.1    [VERIFIED: package.json ^18.3.1]
```
three r163 disposal and renderer APIs (`dispose`, `forceContextLoss`, `info.memory`, `renderLists.dispose`) are stable and present in this version [CITED: threejs.org/docs]. No version-specific breakage between r163 and current docs for these APIs.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-written `ErrorBoundary` class | `react-error-boundary` (npm) | Adds a dependency for ~30 lines of code. The official React docs explicitly show the hand-written class pattern; given the "no unnecessary deps / client-only" ethos, hand-roll the boundary. The boundary itself is NOT a "don't hand-roll" item — React provides no hook alternative, and the class is trivial and officially documented. [ASSUMED that hand-rolling is preferred here — confirm with user if a shared boundary lib is wanted later.] |
| Per-rebuild texture disposal | Keep textures cached, dispose only at unmount | Disposing textures per rebuild conflicts with the shared-cache design (STAB-01 vs STAB-02). Cache-and-release-once is correct. |

**Installation:** None. `npm install` of existing lockfile only.

## Package Legitimacy Audit

**Not applicable — this phase installs no external packages.** All work uses `three@0.163.0` and `react`/`react-dom@18.3.1`, already present in `package.json` and `node_modules`, verified against the registry-pinned lockfile. No slopcheck run required (no new package names introduced).

## Architecture Patterns

### System Architecture Diagram

```text
                      ┌─────────────────────────────────────────────┐
   user changes  ───► │  StudioScreen (React state: furnId/width/    │
   width/melamina/    │  matId/legId/arUrl)                          │
   legs/line          └───────────────┬─────────────────────────────┘
                                      │ props
                                      ▼
        ┌──────────────────────  ErrorBoundary (NEW, class) ──────────────────────┐
        │  catches errors thrown during React render/commit of children           │
        │  ┌───────────────────────────────────────────────────────────────────┐  │
        │  │  Viewer3D                                                          │  │
        │  │   mount effect:                                                    │  │
        │  │    probe WebGL ──► [no WebGL] ──► throw / set fallback ──┐         │  │
        │  │    new WebGLRenderer (try/catch) ────────────────────────┤         │  │
        │  │    addEventListener webglcontextlost/restored ───────────┘         │  │
        │  │                                                                    │  │
        │  │   rebuild effect [furnId,width,bays,matId,legId]:                  │  │
        │  │    disposeGroup(oldGroup)  ◄── STAB-01 (geom+mat, NOT textures)    │  │
        │  │    group = buildFurnitureGroup(...)  ──uses──► _texCache (shared)  │  │
        │  │                                                                    │  │
        │  │   rAF loop: renderer.render() ──[throws]──► loop catches,          │  │
        │  │             cancels rAF, surfaces error to boundary/fallback       │  │
        │  │             (boundary alone does NOT catch rAF throws)             │  │
        │  │                                                                    │  │
        │  │   unmount cleanup:                                                 │  │
        │  │    cancelAnimationFrame, remove listeners,                         │  │
        │  │    disposeGroup(group), renderer.dispose(),                        │  │
        │  │    renderer.renderLists.dispose(), forceContextLoss(),             │  │
        │  │    disposeTextureCache()  ◄── STAB-02                              │  │
        │  └───────────────────────────────────────────────────────────────────┘  │
        │  fallback UI on error: existing 2D render panel (render__photo /          │
        │  render__placeholder, Studio3D.jsx:652-671) + "tu navegador no            │
        │  soporta 3D" message                                                      │
        └───────────────────────────────────────────────────────────────────────────┘

   openAR() ──► exportFurnitureToGLB ──► URL.createObjectURL ──► arUrl (React state)
        │                                                            │
        │  closeAR() / replace in openAR / NEW unmount-cleanup effect│ revokeObjectURL
        └────────────────────────────── STAB-03 ────────────────────┘
```

The diagram traces the primary use case (user reconfigures → old GPU resources freed → new group built from shared textures → rendered) and the failure paths (no WebGL / context loss / render throw → degrade to 2D panel).

### Recommended Structure (minimal — brownfield)
```
src/
├── Studio3D.jsx     # add disposeGroup(), disposeTextureCache(); guard renderer;
│                    # context-loss listeners; arUrl unmount cleanup; surface rAF errors
├── ErrorBoundary.jsx (NEW)  # class component: getDerivedStateFromError + componentDidCatch + fallback
└── app.jsx          # wrap <StudioScreen> in <ErrorBoundary>
```
Keep the boundary in its own small file so it can wrap other views later (Phase 2+). Wrapping at `app.jsx` around the `studio` branch is sufficient for STAB-04; wrapping in `main.jsx` around `<App/>` would catch app-wide errors but lose the "fall back to 2D panel" specificity. **Recommend wrapping the Studio branch specifically** so the fallback can be the 2D render panel.

### Pattern 1: Dispose geometries + materials on rebuild (STAB-01) — DO NOT dispose textures

```javascript
// Source: threejs.org/docs How-to-dispose-of-objects [CITED]
// Dispose geometry and material on every group teardown.
// CRITICAL: do NOT dispose material.map — those textures are shared via _texCache
// and reused by the next build and by the GLB exporter (STAB-02 owns their lifecycle).
function disposeGroup(group) {
  if (!group) return;
  group.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose();
    const mats = Array.isArray(obj.material) ? obj.material : obj.material ? [obj.material] : [];
    for (const m of mats) {
      // Intentionally NOT calling m.map?.dispose() — textures are cache-owned.
      m.dispose();
    }
  });
}
```
**Where:** call `disposeGroup(st.group)` in the rebuild effect (`Studio3D.jsx:351-359`) *before* `scene.remove`/reassigning `st.group`, and again in the mount-effect unmount cleanup (`Studio3D.jsx:339-347`) for the final group.

**What the group contains to dispose** (from `buildFurnitureGroup`, `Studio3D.jsx:114-240`): `BoxGeometry`, `CylinderGeometry`, `EdgesGeometry`, `PlaneGeometry`-free here; `Mesh`/`LineSegments` materials: `MeshStandardMaterial` (bodyMat, innerMat, glassMat, legMat), `LineBasicMaterial` (edgeMat), handleMat. All of these are freshly allocated per build → all must be disposed per rebuild. The shared `tex` (from `getMelaminaTexture`) is referenced by `bodyMat.map`/`innerMat.map` → must NOT be disposed here.

**Verify it works:** `renderer.info.memory.geometries` should stabilize (not climb) across repeated width/melamina/leg changes [CITED: threejs.org/docs — info.memory reports geometries/textures]. This is the recommended objective check for STAB-01 verification.

### Pattern 2: Release the texture cache on Studio unmount (STAB-02)

```javascript
// Module-scope, alongside _texCache (Studio3D.jsx:80-111)
function disposeTextureCache() {
  for (const url in _texCache) {
    _texCache[url]?.dispose();   // textures DO need explicit dispose [CITED: threejs.org/docs]
    delete _texCache[url];
  }
}
```
**Where:** call in the `Viewer3D` mount-effect unmount cleanup (after `disposeGroup` of the final group and `renderer.dispose()`), OR in a Studio-level unmount effect. Because `_texCache` is module-global and re-populates lazily via `getMelaminaTexture` on the next build, **a full clear is safe for re-entry** — navigating back into the Studio simply reloads textures on demand. No ref-counting needed for a single-viewer app.

**Ownership rule (resolves STAB-01 vs STAB-02 conflict):**
- Geometries + materials → **build-owned** → disposed every rebuild (Pattern 1).
- Textures in `_texCache` → **module-owned** → disposed once, on Studio unmount (Pattern 2).

**Re-entry caveat:** if both the live `Viewer3D` and a GLB export could run concurrently and one unmounts while the other still needs a texture, a full clear could free a texture mid-use. In this app the GLB export (`exportFurnitureToGLB`) runs synchronously to produce a blob and does not retain live texture references after `URL.createObjectURL`, so a clear-on-unmount is safe. If concurrent lifetimes are ever introduced, switch to ref-counting. [ASSUMED: export does not hold textures past blob creation — based on reading `exportFurnitureToGLB` (`Studio3D.jsx:398-415`); low risk.]

### Pattern 3: Revoke AR blob URL on unmount (STAB-03)

```javascript
// In StudioScreen, alongside arUrl state (Studio3D.jsx:443)
useEffect(() => {
  return () => {
    if (arUrl) URL.revokeObjectURL(arUrl);
  };
}, [arUrl]);
```
This complements (does not replace) the existing revokes in `closeAR` (`485-489`) and the replace-in-`openAR` (`476-479`). The cleanup fires when `arUrl` changes (revoking the previous value) and on unmount (revoking the final value) — covering the "navigate Home/Back with modal open" leak in CONCERNS.md. [CITED: MDN URL.revokeObjectURL — object URLs persist until revoked or document unload.]

### Pattern 4: React 18 Error Boundary + async render-loop error surfacing (STAB-04)

```javascript
// src/ErrorBoundary.jsx — class component (NO hook equivalent in React 18) [CITED: react.dev]
import React from "react";
export class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, info) { console.error("3D render error:", error, info.componentStack); }
  render() {
    if (this.state.hasError) return this.props.fallback ?? <p>Algo salió mal.</p>;
    return this.props.children;
  }
}
```
Wrap the Studio in `app.jsx`:
```jsx
{view === "studio" && room && (
  <ErrorBoundary fallback={<StudioFallback room={room} .../>}>
    <StudioScreen ... />
  </ErrorBoundary>
)}
```

**What the boundary CATCHES** [CITED: react.dev/reference/react/Component]: errors thrown during rendering, in lifecycle methods, and in the constructors of the whole tree below it — e.g. a throw inside `Viewer3D`'s mount effect body that runs during commit, or a render-time throw.

**What it does NOT catch** [CITED: react.dev — quoted list]: event handlers, **asynchronous code (`setTimeout`, `requestAnimationFrame` callbacks, promises)**, server-side rendering, and errors in the boundary itself.

**Implication for this codebase:** the render loop at `Studio3D.jsx:315-320` runs `renderer.render()` inside `requestAnimationFrame`. A WebGL error thrown *there* will NOT reach the boundary. To make async render-loop failures recoverable, the loop must catch its own error and surface it. Two viable approaches:

1. **Local fallback state (simplest):** wrap the loop body in try/catch; on error, `cancelAnimationFrame`, set a component error flag, and render the 2D fallback locally (no boundary needed for this path).
2. **Re-throw on next render (routes to boundary):** store the caught error in a ref/state and call a state setter whose render path does `if (loopError) throw loopError;` — React then surfaces it to the boundary. This unifies sync and async error handling under one fallback.

Recommend approach 1 for the rAF loop (it's local to `Viewer3D` and the 2D panel is a sibling in `StudioScreen`), and rely on the boundary for synchronous mount-effect/render throws. The boundary is still required for STAB-04 because `new WebGLRenderer` in the mount effect and `<model-viewer>` element failures can throw synchronously during commit.

### Pattern 5: Robust WebGLRenderer creation + context loss (STAB-05)

```javascript
// Availability probe (run before creating the renderer)
function isWebGLAvailable() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext &&
      (c.getContext("webgl2") || c.getContext("webgl")));
  } catch { return false; }
}

// In Viewer3D mount effect, replacing Studio3D.jsx:259-268
if (!isWebGLAvailable()) { setNo3D(true); return; }  // degrade to 2D panel
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
} catch (e) {
  console.error("WebGL init failed:", e);
  setNo3D(true);
  return;
}

// Context-loss handling on the canvas
const canvas = renderer.domElement;
const onLost = (event) => {
  event.preventDefault();          // REQUIRED so 'restored' can fire later [CITED: MDN webglcontextlost]
  cancelAnimationFrame(stateRef.current.raf);
  setNo3D(true);                   // show 2D fallback instead of white/frozen canvas
};
const onRestored = () => {
  setNo3D(false);
  // re-init scene/renderer or re-run mount effect (e.g. via a key bump) to rebuild GPU resources
};
canvas.addEventListener("webglcontextlost", onLost, false);
canvas.addEventListener("webglcontextrestored", onRestored, false);
// remove both listeners in the unmount cleanup
```

**Key facts:**
- `webglcontextlost` MUST call `event.preventDefault()` or the context will never be restored [CITED: MDN WebGLContextEvent / webglcontextlost].
- On context loss, all GPU resources (geometries, textures, programs) are invalid; you must rebuild them on restore — the simplest robust path here is to re-run the whole `Viewer3D` mount effect by bumping a React `key` on the component when `onRestored` fires.
- `setNo3D` is the same fallback state used by the availability probe and (optionally) the rAF-loop catch — all three failure modes (no WebGL / init throw / context lost) converge on the existing 2D render panel.

### Anti-Patterns to Avoid
- **Disposing `material.map` during per-rebuild teardown.** Destroys shared cached textures → blank/black furniture on next build. (The exact STAB-01/STAB-02 conflict.)
- **Relying on the Error Boundary to catch rAF-loop throws.** It can't [CITED: react.dev]. Async loop must self-catch.
- **Calling `renderer.forceContextLoss()` on every rebuild.** That's an unmount-only operation; on rebuild you only dispose the group.
- **Wrapping `<App/>` in `main.jsx` as the only boundary.** Catches the error but the fallback can't be the Studio's 2D panel; prefer a Studio-scoped boundary for a recoverable, in-context fallback.
- **Forgetting `event.preventDefault()` in `webglcontextlost`.** Permanently dead canvas.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Freeing GPU memory | A custom GC / manual buffer tracking | `geometry.dispose()`, `material.dispose()`, `texture.dispose()`, `renderer.dispose()` | three.js's `.dispose()` is the only supported way to release WebGL resources; nothing else frees them [CITED: threejs.org/docs] |
| Detecting leaks for verification | A custom counter | `renderer.info.memory` (`{ geometries, textures }`) | Built-in, real-time GPU resource counts [CITED: threejs.org/docs] |
| Error boundary | Try/catch around JSX, render-prop hacks | Class component with `getDerivedStateFromError` + `componentDidCatch` | The only React-sanctioned mechanism; no hook exists [CITED: react.dev] |
| WebGL capability check | Parsing GPU strings | `canvas.getContext('webgl2'\|'webgl')` probe in try/catch | Standard, reliable feature detection [CITED: MDN] |

**Key insight:** Everything STAB-01..STAB-05 needs is already provided by three.js and React. The bug is *missing* the dispose/guard calls, not a missing library. Do not introduce abstractions or dependencies.

## Runtime State Inventory

This phase changes runtime resource lifecycle, not stored data or external service config. Checked all five categories:

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — no database, no datastore. Catalog/prices are hard-coded constants in `src/data.jsx`; app state lives in the URL query string only. [VERIFIED: codebase read + CLAUDE.md "Sin backend propio"] | None |
| Live service config | None — no external service holds any string from this phase. AR is delegated to `<model-viewer>` (device-side), no config persisted. [VERIFIED: CONCERNS.md security section — "No backend, no auth, no network calls"] | None |
| OS-registered state | None — pure browser SPA; no OS task/process registration. [VERIFIED: STACK.md / package.json scripts are dev/build/preview only] | None |
| Secrets / env vars | None — no `.env*` files, no env vars (`.gitignore` only ignores `node_modules/`, `dist/`). [VERIFIED: CLAUDE.md "No environment variables"] | None |
| Build artifacts | `dist/` exists locally but is git-ignored; not affected by these source changes beyond a normal rebuild. No stale package metadata (no egg-info / compiled binaries). [VERIFIED: gitStatus + CONCERNS.md A11Y-04] | Rebuild via `npm run build` after changes (normal) |

**The canonical question — after every file is updated, what runtime systems still hold old state?** Answer: **none.** This is purely in-memory GPU/browser resource management; the only "runtime state" is the live `_texCache`, `renderer`, and `arUrl` object URLs, all of which the phase's own fixes release. There is no persisted or external state to migrate.

## Common Pitfalls

### Pitfall 1: Per-rebuild texture disposal blanks the furniture
**What goes wrong:** A naive `disposeGroup` that calls `material.map?.dispose()` frees a texture still referenced by the shared `_texCache`; the next `buildFurnitureGroup` reuses the same (now-disposed) texture → furniture renders untextured/black.
**Why it happens:** `getMelaminaTexture` returns the *same* `THREE.Texture` instance across builds (`_texCache[url]`); disposing it via one material's `.map` invalidates it for all.
**How to avoid:** In the rebuild dispose path, dispose geometry + material only; never touch `material.map`. Dispose textures exclusively in `disposeTextureCache()` at unmount.
**Warning signs:** Furniture turns black/white after the first melamina change; `renderer.info.memory.textures` drops to 0 unexpectedly mid-session.

### Pitfall 2: Async render-loop errors silently white-screen despite a boundary
**What goes wrong:** A WebGL/driver error thrown inside the `requestAnimationFrame` loop is not caught by the Error Boundary; the loop dies or spams, and the canvas freezes/whitescreens with no fallback.
**Why it happens:** Boundaries do not catch async callback errors [CITED: react.dev].
**How to avoid:** try/catch the loop body; on error `cancelAnimationFrame` + set `setNo3D(true)` (local fallback) or re-throw on next render to route to the boundary.
**Warning signs:** Frozen/blank 3D canvas with no fallback UI and no `componentDidCatch` log; errors only visible in the console.

### Pitfall 3: Context never restored because `preventDefault()` was omitted
**What goes wrong:** After a `webglcontextlost` event, the browser never fires `webglcontextrestored`, leaving a permanently dead canvas.
**Why it happens:** The default action of `webglcontextlost` prevents restoration unless `event.preventDefault()` is called [CITED: MDN].
**How to avoid:** Always `event.preventDefault()` in the `webglcontextlost` handler.
**Warning signs:** GPU "recovers" elsewhere but this canvas stays blank after a tab backgrounding / GPU reset.

### Pitfall 4: Boundary state never resets, so the user is stuck on the fallback
**What goes wrong:** Once `hasError` is true, the boundary keeps showing the fallback even after the user navigates to a different config/view.
**Why it happens:** `getDerivedStateFromError` sets `hasError: true` and nothing resets it.
**How to avoid:** Give the boundary a `key` tied to the active view/config (or a `resetKeys` prop) so React remounts it on navigation; or expose a "reintentar" button that resets `hasError`.
**Warning signs:** Fallback panel persists after leaving and re-entering the Studio.

## Code Examples

All examples are inline in Patterns 1-5 above with `[CITED]` sources. Consolidated source mapping:
- Disposal traversal + `info.memory`: threejs.org/docs How-to-dispose-of-objects.
- Error boundary lifecycle + "does not catch async" list: react.dev/reference/react/Component.
- Object URL revocation: MDN URL.revokeObjectURL.
- Context-loss `preventDefault`: MDN WebGLContextEvent / webglcontextlost.

## State of the Art

| Old Approach (current code) | Current Best Practice | When Changed | Impact |
|-----------------------------|----------------------|--------------|--------|
| `scene.remove(group)` with no dispose (`Studio3D.jsx:355`) | `disposeGroup()` traversal before discard | Always — disposal has been required since early three.js | Fixes STAB-01 GPU leak |
| Module-global `_texCache` never released | Dispose + clear on unmount | — | Fixes STAB-02 |
| No error boundary | Class boundary (still class-only in React 18/19) | — | Fixes STAB-04; note React still has no hook boundary [CITED: react.dev] |
| Unconditional `new WebGLRenderer` | Probe + try/catch + context-loss listeners | — | Fixes STAB-05 |

**Deprecated/outdated:** none relevant. `renderer.info.memory`, `.dispose()`, `forceContextLoss()`, and `getDerivedStateFromError`/`componentDidCatch` are all current and stable in three r163 / React 18.3.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Hand-rolling the ErrorBoundary class (vs adding `react-error-boundary`) is preferred, consistent with the no-unnecessary-deps ethos | Standard Stack / Pattern 4 | Low — both work; user may prefer the lib for reset/retry ergonomics. Planner can offer as a discretion point. |
| A2 | `exportFurnitureToGLB` does not retain live texture references after blob creation, so clear-on-unmount of `_texCache` is safe | Pattern 2 | Low — based on reading `Studio3D.jsx:398-415`; if AR export and viewer ran concurrently across unmount, a clear could free an in-use texture. Mitigated because export is synchronous-to-blob. |
| A3 | Wrapping the Studio branch (not `<App/>` in main.jsx) is the right boundary scope for a 2D-panel fallback | Recommended Structure / Pattern 4 | Low — a design choice; whole-app boundary also satisfies STAB-04 but with a generic fallback. |

**These three assumptions are design/scope choices, not unverified facts.** All API-level claims (disposal, boundary behavior, context-loss) are `[CITED]` from official docs. No compliance/security/retention assumptions exist (none apply — client-only app).

## Open Questions

1. **Context-loss restore strategy: full remount vs in-place rebuild?**
   - What we know: on `webglcontextrestored`, all GPU resources are invalid and must be recreated.
   - What's unclear: whether the planner wants a simple `key`-bump remount of `Viewer3D` (easy, robust) or a finer in-place re-init (less flicker).
   - Recommendation: default to `key`-bump remount for robustness; it reuses the existing mount-effect setup path. Treat in-place as a later optimization.

2. **Should the boundary expose a "reintentar" (retry) button?**
   - What we know: STAB-04 requires a *recoverable* fallback. A reset path makes recovery explicit.
   - What's unclear: whether "recoverable" is satisfied by navigation-driven remount alone or needs an in-fallback retry control.
   - Recommendation: include a lightweight "reintentar" that resets `hasError` (and/or bumps a key) — cheap and directly satisfies "recoverable."

## Environment Availability

This phase is purely code changes to an already-installed stack — no new external tools/services. Existing toolchain confirmed:

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| three | All STAB items | ✓ | 0.163.0 | — |
| react / react-dom | STAB-04 | ✓ | 18.3.1 | — |
| Vite | dev/build | ✓ | ^5.4.11 | — |
| Node.js + npm | toolchain | ✓ (project builds) | not pinned | — |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** none.

WebGL itself is the runtime capability whose *absence* this phase explicitly handles (STAB-05) — by design the fix degrades gracefully when WebGL is unavailable, so it is not a blocking dependency.

## Security Domain

> `security_enforcement` is not set to `false` in config, so this section is included. However, this phase has a near-zero security surface.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No auth in app |
| V3 Session Management | no | No sessions/cookies |
| V4 Access Control | no | No protected resources |
| V5 Input Validation | no (this phase) | This phase touches no user input; the only string interpolation (HTML doc gen) is out of scope and uses trusted catalog data [CITED: CONCERNS.md security section] |
| V6 Cryptography | no | No crypto |

### Known Threat Patterns
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Resource exhaustion (GPU memory leak → crash) | Denial of Service | The disposal work in this phase IS the mitigation — STAB-01/02 prevent unbounded GPU growth; STAB-04/05 prevent a crash from white-screening the app. |

No new attack surface is introduced. No network, secrets, PII, or user-supplied data is involved [CITED: CONCERNS.md — "No backend, no auth, no secrets, no network calls"].

> **Note:** Validation Architecture section intentionally OMITTED — `workflow.nyquist_validation` is `false` in `.planning/config.json`. The recommended objective check for STAB-01 (`renderer.info.memory.geometries` stays flat across rebuilds) is still noted in Pattern 1 for the verifier to use manually.

## Sources

### Primary (HIGH confidence)
- threejs.org/docs — "How to dispose of objects" — geometry/material/texture/render-target disposal, `renderer.dispose()`, `renderer.renderLists.dispose()`, `renderer.forceContextLoss()`, `renderer.info.memory` (geometries/textures counts). Confirms textures need separate disposal from materials.
- react.dev/reference/react/Component — `getDerivedStateFromError`, `componentDidCatch`; explicit list of what boundaries do NOT catch (event handlers, async `setTimeout`/`requestAnimationFrame`/promises, SSR, errors in the boundary itself); class-only (no hook) in React 18.
- Local codebase (verified by direct read): `src/Studio3D.jsx`, `src/app.jsx`, `src/main.jsx`, `package.json`, `node_modules/three/package.json` (three 0.163.0), `.planning/codebase/CONCERNS.md`, `CLAUDE.md`, `.planning/config.json`.

### Secondary (MEDIUM confidence)
- MDN Web Docs — `URL.revokeObjectURL` (object URLs persist until revoked/document unload); `WebGLContextEvent` / `webglcontextlost` (must `preventDefault()` to allow restoration); `HTMLCanvasElement.getContext('webgl2'|'webgl')` feature detection. (Standard web platform APIs; widely documented.)

### Tertiary (LOW confidence)
- None. All claims are CITED from official docs or VERIFIED against the local codebase. Three design choices are flagged `[ASSUMED]` in the Assumptions Log (scope decisions, not facts).

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions verified in package.json + node_modules; no new packages.
- Architecture / disposal & boundary patterns: HIGH — cited from threejs.org and react.dev official docs, cross-checked against actual code line references.
- Pitfalls: HIGH — derived directly from the documented STAB-01/STAB-02 ownership conflict and the cited "boundaries don't catch async" rule.
- Context-loss specifics: MEDIUM-HIGH — MDN-sourced; standard WebGL behavior, not three-version-specific.

**Research date:** 2026-06-07
**Valid until:** ~2026-09-07 (90 days — three r163 and React 18.3 disposal/boundary APIs are stable; low churn risk)
