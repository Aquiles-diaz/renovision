<!-- GSD:project-start source:PROJECT.md -->
## Project

**reno · vision**

reno · vision es una SPA cliente (React 18 + Vite 5) que funciona como configurador 3D de muebles con cotización instantánea ("cotizador"). El usuario elige líneas, ambientes, materiales (melaminas), patas y dimensiones, ve el mueble renderizado en 3D (three.js) con vista AR (@google/model-viewer), y obtiene un precio calculado en el momento. No tiene backend: catálogo y precios viven hard-coded en el código y el estado persiste en la URL.

**Core Value:** El configurador 3D + cotizador debe funcionar de forma fluida y confiable: el usuario arma su mueble, lo ve en 3D/AR sin que la app se rompa ni se ralentice, y obtiene un precio correcto. Si todo lo demás falla, esto no puede fallar.

### Constraints

- **Tech stack**: Mantener React 18 + Vite + JSX — no introducir TypeScript en este milestone.
- **Sin backend propio**: el envío de cotización debe resolverse con un servicio externo liviano (EmailJS/Formspree/endpoint), no con infraestructura propia.
- **Cliente puro**: la app debe seguir funcionando sin servidor; el estado sigue en la URL.
- **Compatibilidad**: las correcciones no deben romper la experiencia 3D/AR existente.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- JavaScript (ES Modules, JSX) - All application source under `src/` (`.jsx` files). `package.json` declares `"type": "module"`.
- HTML - Single entry document `index.html`. Also generated dynamically as downloadable documents in `src/Studio3D.jsx` (`downloadDoc`).
- CSS - Single global stylesheet `styles/styles.css` (~1912 lines).
- SVG - Inline SVG markup for icons and the building cross-section (`src/Studio3D.jsx` `FIcon`, `src/BuildingSection.jsx`).
## Runtime
- Browser (client-side single-page app). No server-side runtime; the app renders entirely in the browser via React DOM.
- Node.js - Required only for the dev/build toolchain (Vite). No explicit version pinned (no `.nvmrc` / `engines` field).
- npm (inferred from `package-lock.json`)
- Lockfile: present (`package-lock.json`, lockfile format v3)
## Frameworks
- React `^18.3.1` (`react`, `react-dom`) - UI framework. App mounted via `createRoot` in `src/main.jsx`. Uses function components and hooks (`useState`, `useEffect`, `useRef`, `useMemo`, `useCallback`).
- three `^0.163.0` - Real-time 3D rendering of the configured furniture (`src/Studio3D.jsx`). Uses `WebGLRenderer`, `Scene`, `PerspectiveCamera`, `MeshStandardMaterial`, lights, shadows.
- `@google/model-viewer` `^3.5.0` - Web component (`<model-viewer>`) for AR viewing (WebXR / Scene Viewer / Quick Look). Imported as a side-effect in `src/main.jsx` and used as a custom element in `src/Studio3D.jsx`.
- Not detected. No test runner, test files, or test scripts.
- Vite `^5.4.11` - Dev server and production bundler. Config in `vite.config.js`.
- `@vitejs/plugin-react` `^4.3.4` - React Fast Refresh and JSX transform (Babel-based, present in `node_modules`).
## Key Dependencies
- `three` `^0.163.0` - Core to the Studio 3D viewer and GLB export; the product's headline feature.
- `react` / `react-dom` `^18.3.1` - Entire UI/component tree and view routing.
- `@google/model-viewer` `^3.5.0` - Augmented-reality preview; bundles `lit` and `@monogrid/gainmap-js` transitively.
- None. No HTTP client, state library, router library, or backend SDKs. State and routing are hand-rolled (see `src/app.jsx`).
## Configuration
- No environment variables. No `.env*` files present. `.gitignore` only ignores `node_modules/` and `dist/`.
- All catalog/pricing data is hard-coded in `src/data.jsx`.
- `vite.config.js`:
- Entry HTML: `index.html` loads `/src/main.jsx` as a module.
- `dev` → `vite --port 5173`
- `build` → `vite build`
- `preview` → `vite preview --port 5173`
## Platform Requirements
- Node.js with npm.
- `npm install`, then `npm run dev` (serves on http://localhost:5173).
- Static hosting. `npm run build` emits a static bundle to `dist/` (already present: `dist/index.html`, `dist/assets/`). No server required.
- AR features require AR-capable devices/browsers (Android Scene Viewer, iOS Quick Look, or WebXR). External web fonts are loaded from Google Fonts (`index.html`).
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## System Overview
```text
```
## Component Responsibilities
| Component | Responsibility | File |
|-----------|----------------|------|
| `main` (bootstrap) | Mounts React, imports global CSS and `model-viewer` side-effect | `src/main.jsx` |
| `App` | View router, top-level state, URL sync, cinematic transition | `src/app.jsx` |
| `Home` | Landing page; reveal-on-scroll; CTAs into other views | `src/Home.jsx` |
| `Materiales` | Melamine catalog grid; expandable cards; CTA to Studio | `src/Materiales.jsx` |
| `BuildingSection` | Interactive SVG cross-section; click a room to enter | `src/BuildingSection.jsx` |
| `RoomView` | Room render placeholder + hotspots + furniture list | `src/RoomView.jsx` |
| `StudioScreen` | The configurator: pick module/width/melamine/legs, 3D viewer, quote, AR, document download | `src/Studio3D.jsx` |
| `Viewer3D` | three.js canvas lifecycle, lights, controls, camera fit | `src/Studio3D.jsx` (internal) |
| `buildFurnitureGroup` | Procedurally builds the furniture as a `THREE.Group` (shared by 3D + GLB export) | `src/Studio3D.jsx` |
| `RenoNav` | Shared top navigation | `src/Nav.jsx` |
| `FIcon` | Inline SVG furniture icons (also reused by RoomView) | `src/Studio3D.jsx` |
| data + pricing | All catalog constants, lookups, quote computation, currency format | `src/data.jsx` |
## Pattern Overview
- Conditional-render "router" keyed on a `view` string in `App` state (no router library).
- URL query string is the canonical shareable state, written via `history.replaceState`.
- One module (`src/data.jsx`) is the single source of truth for catalog + pricing; every view imports from it.
- Procedural geometry: furniture is generated from data (`alto`, `prof`, `widths`, `kind`) rather than loaded as static models. The same `buildFurnitureGroup` feeds both the live viewer and the GLB exported for AR.
## Layers
- Purpose: mount the app, register global side-effects.
- Location: `src/main.jsx`, `index.html`.
- Depends on: React DOM, `@google/model-viewer`, `styles/styles.css`.
- Purpose: routing, top-level state, transitions, URL sync.
- Location: `src/app.jsx`.
- Used by: all views (receives callbacks like `onSelect`, `onPick`, `onConfig`).
- Purpose: screens and UI.
- Location: `src/Home.jsx`, `src/Materiales.jsx`, `src/BuildingSection.jsx`, `src/RoomView.jsx`, `src/Studio3D.jsx`, `src/Nav.jsx`.
- Depends on: `src/data.jsx`, global CSS, static assets.
- Purpose: catalog data and business logic (pricing).
- Location: `src/data.jsx`.
- Depends on: nothing (pure constants + pure functions).
- Purpose: real-time rendering, geometry generation, GLB export, AR handoff.
- Location: `src/Studio3D.jsx` (`Viewer3D`, `buildFurnitureGroup`, `exportFurnitureToGLB`).
- Depends on: `three`, `@google/model-viewer`, melamine textures in `public/assets/melaminas/`.
## Data Flow
### Primary Path: configure & quote
### Secondary Flow: AR preview
### Secondary Flow: document download
- React `useState`/`useMemo` local to each view; `App` owns cross-view state (`view`, `room`, `furnId`). The URL query string is the durable/shareable mirror of that state (`readUrl`/`writeUrl`). No global store.
## Key Abstractions
- Purpose: data-driven furniture/melamine/leg/room definitions.
- Examples: `FURNITURE`, `MELAMINAS`, `LEGS`, `LINES`, `ROOMS` in `src/data.jsx`.
- Pattern: arrays of plain objects + `*ById` finder helpers (`furnitureById`, `melaminaById`, `roomById`).
- Purpose: turn a furniture record + selections into 3D geometry.
- Examples: `buildFurnitureGroup` (`src/Studio3D.jsx:114`), branching on `furniture.kind` (`drawers`, `doors-shelf`, `doors-drawer`, `doors-glasstop`).
- Pattern: pure builder returning a `THREE.Group`; reused for both live render and GLB export.
- Purpose: deterministic pricing from selections.
- Examples: `computeQuote` (`src/data.jsx:119`) using base + per-bay cost + line/melamine multipliers + leg price; `baysForWidth` derives body count.
## Entry Points
- Triggers: initial page load; loads `/src/main.jsx`.
- Triggers: module load; calls `createRoot(...).render(<App/>)` and registers the `model-viewer` element.
- Triggers: render; reads initial state from the URL (`readUrl`) so deep links open directly into a room/studio config.
## Architectural Constraints
- **Threading:** Single-threaded browser main thread. A `requestAnimationFrame` loop drives three.js rendering (`src/Studio3D.jsx:315`).
- **Global state:** Module-level mutable caches in `src/Studio3D.jsx`: `_texLoader` and `_texCache` (shared texture cache across all Viewer/exporter instances).
- **Circular imports:** `src/RoomView.jsx` imports `FIcon` from `src/Studio3D.jsx`, which pulls the full (three.js-heavy) Studio module into the Room view's import graph. No cycle, but a cross-view coupling.
- **No type safety:** Plain JS; correctness of the data shapes in `src/data.jsx` is enforced only by usage.
## Anti-Patterns
### setState during render to "normalize" routing
### "PDF" buttons that emit HTML
### Hotspot-to-furniture mapping by index
## Error Handling
- Texture load failure → resolves to `null`, material falls back to a flat color (`loadMelaminaTexture`, `buildFurnitureGroup`).
- Missing module render image → `onError` flips `imgErr` and shows a "falta <file>" placeholder (`src/Studio3D.jsx:658`).
- GLB export failure → `.catch(() => setArLoading(false))` (`src/Studio3D.jsx:482`).
- Unknown melamine id → `melaminaById` falls back to `MELAMINAS[0]` (`src/data.jsx:110`).
## Cross-Cutting Concerns
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
