# Phase 1: Estabilidad crítica del motor 3D - Pattern Map

**Mapped:** 2026-06-07
**Files analyzed:** 4 (3 MODIFY + 1 NEW)
**Analogs found:** 4 / 4 (all in-repo)

> This is a brownfield stability phase. Most "patterns to copy from" live **inside the same file being modified** (`src/Studio3D.jsx`) — the existing `useEffect` cleanup, the existing AR-revoke calls, the existing 2D render panel. The only genuinely NEW file is `src/ErrorBoundary.jsx`, for which there is **no existing class-component analog** (flagged below). The planner should treat the existing patterns in `Studio3D.jsx` as the canonical style to extend, not replace.

## File Classification

| File | Action | Role | Data Flow | Closest Analog | Match Quality |
|------|--------|------|-----------|----------------|---------------|
| `src/Studio3D.jsx` | MODIFY | component (3D viewer + studio screen) | event-driven (rAF render loop) + request-response (AR export) | itself (existing effects/cleanup in same file) | exact (self) |
| `src/ErrorBoundary.jsx` | NEW | provider / error-boundary | event-driven (catches render errors) | `src/Nav.jsx` (file structure only) — **no class-component analog exists** | role-mismatch (structure only) |
| `src/app.jsx` | MODIFY | router / top-level state | request-response (conditional view render) | itself (existing `view==="studio"` branch, line 97-103) | exact (self) |
| `src/main.jsx` | MODIFY (likely NOT needed) | bootstrap | — | itself | exact (self) |

**Boundary-scope decision (from RESEARCH.md Recommended Structure + A3):** wrap the `view==="studio"` branch inside `src/app.jsx`, NOT `<App/>` in `main.jsx`. This keeps the fallback Studio-specific (the 2D render panel). So `main.jsx` likely needs **no change** — kept in the table only to record that decision.

## Pattern Assignments

### `src/Studio3D.jsx` (MODIFY — component, event-driven + request-response)

**Analog:** itself. All five STAB fixes extend code already present in this file. Below are the exact existing excerpts each fix must mirror/extend, with line numbers.

---

#### STAB-01 — disposeGroup in rebuild effect

**Existing rebuild effect to extend** (`Studio3D.jsx:351-359`) — note `scene.remove(st.group)` discards the old group with **no disposal**:
```javascript
useEffect(() => {
  const st = stateRef.current;
  if (!st || !st.scene) return;
  const { scene, controls, camera } = st;
  scene.remove(st.group);              // ← old group dropped, never disposed (the leak)

  const group = buildFurnitureGroup({ furniture, width, bays, melamina, legId });
  scene.add(group);
  st.group = group;
```
Effect dep array (`Studio3D.jsx:377`): `[furniture.id, width, bays, melamina.id, legId]`.

**What the group contains** (from `buildFurnitureGroup`, `Studio3D.jsx:114-240`) — every item below is freshly allocated per build and MUST be disposed; the shared `tex` must NOT:
- Geometries: `BoxGeometry` (`:138`), `EdgesGeometry` (`:144`), `CylinderGeometry`/`BoxGeometry` legs (`:229-231`).
- Materials: `bodyMat` MeshStandardMaterial (`:123`), `edgeMat` LineBasicMaterial (`:130`), `innerMat` (`:131`), `handleMat` (`:168`), `glassMat` (`:200`), `legMat` (`:213-220`).
- **DO NOT dispose** `bodyMat.map` / `innerMat.map` — that is the shared `tex` from `getMelaminaTexture(melamina.img)` (`:122`), owned by `_texCache`.

**Pattern to add** (new module-scope helper near `buildFurnitureGroup`):
```javascript
function disposeGroup(group) {
  if (!group) return;
  group.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose();
    const mats = Array.isArray(obj.material) ? obj.material : obj.material ? [obj.material] : [];
    for (const m of mats) m.dispose();   // NOT m.map.dispose() — texture is cache-owned
  });
}
```
Call `disposeGroup(st.group)` immediately before `scene.remove(st.group)` at `:355`.

---

#### STAB-02 — disposeTextureCache on unmount

**Existing module-global cache to release** (`Studio3D.jsx:80-93`):
```javascript
const _texLoader = new THREE.TextureLoader();
const _texCache = {};
function getMelaminaTexture(url) {
  if (!url) return null;
  if (!_texCache[url]) {
    const t = _texLoader.load(url);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    /* ... */
    _texCache[url] = t;
  }
  return _texCache[url];
}
```

**Existing unmount cleanup to extend** (`Studio3D.jsx:339-347`) — this is the canonical cleanup style for this file (cancelAnimationFrame, removeEventListener, disconnect, dispose, remove DOM node):
```javascript
return () => {
  cancelAnimationFrame(stateRef.current.raf);
  window.removeEventListener("resize", onResize);
  ro.disconnect();
  renderer.domElement.removeEventListener("pointerdown", stopAuto);
  renderer.dispose();
  if (renderer.domElement.parentNode)
    renderer.domElement.parentNode.removeChild(renderer.domElement);
};
```

**Pattern to add** — new module-scope helper + extend this cleanup to also call `disposeGroup(stateRef.current.group)`, `renderer.renderLists.dispose()`, `renderer.forceContextLoss()`, and `disposeTextureCache()`:
```javascript
function disposeTextureCache() {
  for (const url in _texCache) {
    _texCache[url]?.dispose();
    delete _texCache[url];
  }
}
```

---

#### STAB-03 — revoke arUrl on unmount

**Existing revoke calls to complement (NOT replace)** — in `openAR` (`Studio3D.jsx:476-479`) and `closeAR` (`:485-489`):
```javascript
// openAR — revokes previous before assigning new
setArUrl((prev) => {
  if (prev) URL.revokeObjectURL(prev);
  return url;
});
// closeAR
setArUrl((prev) => {
  if (prev) URL.revokeObjectURL(prev);
  return null;
});
```
Gap: navigating Home/Back with the AR modal open never revokes the final `arUrl`. `arUrl` state declared at `:443`.

**Existing useEffect-cleanup style in StudioScreen to mirror** (`Studio3D.jsx:466-468`):
```javascript
useEffect(() => {
  if (onConfig) onConfig({ furnId, width, matId });
}, [furnId, width, matId, onConfig]);
```

**Pattern to add** (new effect alongside the other StudioScreen effects, ~`:443`):
```javascript
useEffect(() => {
  return () => { if (arUrl) URL.revokeObjectURL(arUrl); };
}, [arUrl]);
```

---

#### STAB-04 — surface async rAF-loop errors

**Existing render loop that can throw invisibly** (`Studio3D.jsx:314-320`):
```javascript
let raf;
const animate = () => {
  raf = requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);   // a WebGL throw here NEVER reaches an Error Boundary
};
animate();
```
**Pattern (RESEARCH.md approach 1 — local fallback):** wrap the loop body in try/catch; on throw → `cancelAnimationFrame(raf)` + set a new local `no3D` state. The boundary (below) handles synchronous mount/commit throws; this self-catch handles async loop throws. Both converge on the 2D fallback panel.

---

#### STAB-05 — robust WebGLRenderer + context loss

**Existing unguarded renderer creation** (`Studio3D.jsx:259-268`):
```javascript
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: false,
  preserveDrawingBuffer: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(W, H);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
mount.appendChild(renderer.domElement);
```
**Existing addEventListener/removeEventListener pairing pattern in this same effect** (the style to copy for the context-loss listeners) — `:336` adds, `:343` removes:
```javascript
renderer.domElement.addEventListener("pointerdown", stopAuto);   // add
// ...cleanup:
renderer.domElement.removeEventListener("pointerdown", stopAuto); // remove
```
**Pattern to add:** an `isWebGLAvailable()` probe + try/catch around `new THREE.WebGLRenderer`, both degrading to a local `no3D` state (early `return` from the effect). Add `webglcontextlost` (with `event.preventDefault()`) / `webglcontextrestored` listeners on `renderer.domElement`, registered next to the existing `pointerdown` listener and removed in the same cleanup block (`:343`). See RESEARCH.md Pattern 5 for the full excerpt.

---

#### 2D fallback (shared sink for STAB-04 + STAB-05)

**Existing 2D render panel** that all failure modes degrade to (`Studio3D.jsx:652-671`) — this is the fallback UI, already present:
```jsx
<div className="render">
  <div className="render__img">
    <div className="render__scrim"></div>
    <div className="render__chip"><span className="tag">Render · {mat.tone}</span></div>
    {renderSrc && !imgErr ? (
      <img className="render__photo" src={renderSrc}
           alt={`${furniture.name} ${mat.tone}`} onError={() => setImgErr(true)} />
    ) : (
      <div className="render__placeholder">
        {furniture.name} · {mat.tone}
        <span>[ falta {renderSrc} ]</span>
      </div>
    )}
  </div>
  {/* ... */}
</div>
```
**Existing `onError`→state→placeholder degradation pattern** (`:442`, `:663`, `:665-670`) is the precedent: a boolean state flag (`imgErr`) flips to swap the live element for a static panel. The new `no3D` flag should follow this exact shape — flag set on failure, conditional render swaps `<Viewer3D>` for the 2D panel / a "tu navegador no soporta 3D" message inside `viewer`/`viewer__canvas`.

---

### `src/ErrorBoundary.jsx` (NEW — provider / error-boundary)

**Analog for FILE STRUCTURE only:** `src/Nav.jsx` (smallest standalone component file). Mirror its conventions:
- Header comment banner: `/* ============ reno · vision — ERROR BOUNDARY ============ */`
- `import React from "react";` at top (`Nav.jsx:2`)
- **Named export** (`export function RenoNav(...)` at `Nav.jsx:4`) — every component in this repo is a named export (`StudioScreen`, `Home`, `Materiales`, `BuildingSection`, `RoomView`, `RenoNav`, `FIcon`); `App` is the lone default export. Follow the named-export convention: `export class ErrorBoundary extends React.Component`.

**FLAG — no class-component analog exists.** Grep for `extends Component` / `componentDidCatch` / `getDerivedStateFromError` across `**/*.jsx` returned **zero matches**. Every component in this codebase is a function component using hooks. The ErrorBoundary MUST be a class component — React 18 provides no hook equivalent (RESEARCH.md Pattern 4, "Don't Hand-Roll" table). This is the one place the planner cannot copy an in-repo structural pattern; use the canonical React-docs class shape from RESEARCH.md Pattern 4 (lines 195-205):
```javascript
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
Per RESEARCH.md Open Question 2 + Pitfall 4: consider a `resetKeys`/`key` reset path or a "reintentar" button so the fallback is recoverable (STAB-04 requires *recoverable*). Logging uses `console.error` only (CLAUDE.md: client-only, no telemetry endpoint).

---

### `src/app.jsx` (MODIFY — router; wrap Studio branch)

**Analog:** itself. Existing studio branch to wrap (`app.jsx:97-103`):
```jsx
{view==="studio" && room && (
  <StudioScreen room={room} initialFurnitureId={initialFurniture}
    initialWidth={init.w} initialMatId={init.mel}
    onConfig={onStudioConfig}
    onBack={()=>{ setView("room"); writeUrl({ view:"room", room:room.id }); }}
    onHome={goHome} onMateriales={goMateriales}/>
)}
```
**Existing import style to mirror** for the new component (`app.jsx:5-8`) — named imports from `./X.jsx`:
```javascript
import { RoomView } from "./RoomView.jsx";
import { StudioScreen } from "./Studio3D.jsx";
```
Add `import { ErrorBoundary } from "./ErrorBoundary.jsx";` in this block and wrap `<StudioScreen .../>` with `<ErrorBoundary fallback={...} key={furnId}>`. Per RESEARCH.md Pitfall 4, a `key` tied to view/config remounts the boundary on navigation so the user is not stuck on the fallback.

---

### `src/main.jsx` (likely NO CHANGE)

Current bootstrap (`main.jsx:1-7`) renders `<App />` only. RESEARCH.md (Recommended Structure, Anti-Patterns) recommends a Studio-scoped boundary in `app.jsx`, NOT an `<App/>`-wrapping boundary here — wrapping here would lose the 2D-panel fallback specificity. Listed for completeness; no edit expected unless the planner also wants an app-wide generic boundary.

## Shared Patterns

### Effect cleanup (cancel → remove listeners → dispose → detach)
**Source:** `src/Studio3D.jsx:339-347` (the Viewer3D mount-effect return).
**Apply to:** STAB-01 final-group dispose, STAB-02 texture-cache release, STAB-05 context-loss listener removal — all extend THIS cleanup block. Keep its existing order; append the new dispose calls.
```javascript
return () => {
  cancelAnimationFrame(stateRef.current.raf);
  window.removeEventListener("resize", onResize);
  ro.disconnect();
  renderer.domElement.removeEventListener("pointerdown", stopAuto);
  renderer.dispose();
  if (renderer.domElement.parentNode)
    renderer.domElement.parentNode.removeChild(renderer.domElement);
};
```

### Boolean-flag degradation (live element → static fallback)
**Source:** `src/Studio3D.jsx:442` (`const [imgErr, setImgErr] = useState(false)`) + `:658-670` conditional render.
**Apply to:** the new `no3D` flag for STAB-04 (rAF catch) and STAB-05 (no-WebGL / init-throw / context-loss). Same shape: `useState(false)` → set true on failure → conditional swap to the 2D panel.

### Object-URL lifecycle (create → revoke)
**Source:** `src/Studio3D.jsx:476-489` (AR) and `:543-550` (`downloadDoc`, the `setTimeout(() => URL.revokeObjectURL(url), 4000)` pattern).
**Apply to:** STAB-03 unmount revoke. The codebase already revokes on replace/close/timeout; the new effect adds the missing unmount/dep-change revoke.

### Named-export module + banner comment
**Source:** every component file (`Nav.jsx:1-4`, `Studio3D.jsx:1`, `app.jsx:1`).
**Apply to:** new `ErrorBoundary.jsx` — banner comment line + `export class ...` (named, not default).

## No Analog Found

| File / Concern | Role | Reason | Planner Action |
|------|------|--------|----------------|
| `src/ErrorBoundary.jsx` (class lifecycle) | error-boundary | **No class component exists anywhere in the repo** (grep: 0 matches for `extends Component` / `componentDidCatch` / `getDerivedStateFromError`). All components are function+hooks. React 18 has no hook boundary. | Use RESEARCH.md Pattern 4 canonical class shape; copy only file *structure* (banner, import, named export) from `src/Nav.jsx`. |
| WebGL availability probe | utility | No feature-detection / capability-probe helper exists in the codebase. | Use RESEARCH.md Pattern 5 `isWebGLAvailable()`. |
| context-loss restore (key-bump remount) | component lifecycle | No existing remount-on-key pattern in the app (router is plain conditional render, no `key` usage on views). | RESEARCH.md Open Question 1 recommends a `key`-bump remount of `Viewer3D`; new pattern. |

## Metadata

**Analog search scope:** `src/` (all `.jsx`: app, main, Studio3D, Nav, Home, Materiales, BuildingSection, RoomView, RoomView, data).
**Files scanned / read:** `src/Studio3D.jsx`, `src/app.jsx`, `src/main.jsx`, `src/Nav.jsx`; grep across `**/*.jsx` for class-component markers.
**Key finding:** All five STAB fixes extend existing in-file patterns; only `ErrorBoundary.jsx` introduces a structurally new (class) component with no in-repo precedent.
**Pattern extraction date:** 2026-06-07
