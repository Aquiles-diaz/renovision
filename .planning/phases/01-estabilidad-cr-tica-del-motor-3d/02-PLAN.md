---
phase: 01-estabilidad-cr-tica-del-motor-3d
plan: 02
type: execute
wave: 2
depends_on: ["01-01"]
files_modified:
  - src/ErrorBoundary.jsx
  - src/app.jsx
autonomous: true
requirements: [STAB-04]
must_haves:
  truths:
    - "Un error lanzado de forma SÍNCRONA durante el render/commit del Studio (ej. throw en el mount effect de Viewer3D o fallo del elemento <model-viewer>) NO deja en blanco toda la SPA: se muestra un fallback recuperable en lugar del Studio"
    - "El fallback es recuperable: el usuario puede salir del estado de error (navegando o vía un control de reintentar / key bump) sin recargar la página"
    - "El boundary registra el error con console.error (sin telemetría externa — app cliente)"
  artifacts:
    - path: "src/ErrorBoundary.jsx"
      provides: "Class component ErrorBoundary con getDerivedStateFromError + componentDidCatch + fallback recuperable"
      contains: "getDerivedStateFromError"
    - path: "src/app.jsx"
      provides: "<StudioScreen> envuelto en <ErrorBoundary> con fallback y key recuperable"
      contains: "ErrorBoundary"
  key_links:
    - from: "src/app.jsx (branch view===\"studio\", ~:97-103)"
      to: "src/ErrorBoundary.jsx"
      via: "import { ErrorBoundary } y wrap de <StudioScreen>"
      pattern: "<ErrorBoundary"
    - from: "ErrorBoundary"
      to: "getDerivedStateFromError + componentDidCatch"
      via: "lifecycle de class component React 18"
      pattern: "getDerivedStateFromError"
---

<objective>
Cerrar la mitad síncrona de STAB-04: crear un Error Boundary de clase (`src/ErrorBoundary.jsx`) y envolver el branch `view==="studio"` en `src/app.jsx`, de modo que un error lanzado durante el render/commit del Studio (un throw en el mount effect de Viewer3D, o un fallo del custom element `<model-viewer>`) muestre un fallback recuperable en vez de dejar en blanco toda la SPA.

Purpose: Cualquier fallo síncrono del render 3D degrada a un fallback recuperable. Junto con la auto-captura del loop rAF del plan 01 (que cubre los throws asíncronos), se completa STAB-04: ni los errores síncronos ni los del loop dejan pantalla blanca.

Output: `src/ErrorBoundary.jsx` (nuevo, class component named export) y `src/app.jsx` modificado para importar y envolver `<StudioScreen>` en `<ErrorBoundary>` con un fallback y una key/resetKeys que hagan el fallback recuperable.

Boundary scope (decisión de RESEARCH/A3): envolver el branch del Studio en app.jsx, NO `<App/>` en main.jsx — así el fallback puede ser específico del Studio. main.jsx NO se modifica.
NOTA crítica (Pitfall 2): un Error Boundary de React NO captura throws dentro de requestAnimationFrame/setTimeout/promesas. Esa ruta async la cubre la auto-captura del loop rAF entregada en el plan 01 (estado no3D). Este plan cubre exclusivamente los throws síncronos de render/commit.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/01-estabilidad-cr-tica-del-motor-3d/01-RESEARCH.md
@.planning/phases/01-estabilidad-cr-tica-del-motor-3d/01-PATTERNS.md
@.planning/phases/01-estabilidad-cr-tica-del-motor-3d/01-01-SUMMARY.md
@CLAUDE.md
@src/Nav.jsx

<interfaces>
<!-- Estructuras exactas que las tareas extienden. Usar directamente, sin explorar. -->

Convención de archivo de componente (src/Nav.jsx — único análogo de estructura):
- Línea 1: banner de comentario "/* ============ reno · vision — NAV ============ */"
- Línea 2: import React from "react";
- Named export: export function RenoNav({ ... }) { ... }
  (Todos los componentes del repo son named exports; App es el único default export.)
  NO existe ningún class component en el repo — usar la forma canónica de React docs (RESEARCH Pattern 4).

app.jsx — branch del Studio a envolver (app.jsx:97-103):
{view==="studio" && room && (
  <StudioScreen room={room} initialFurnitureId={initialFurniture}
    initialWidth={init.w} initialMatId={init.mel}
    onConfig={onStudioConfig}
    onBack={()=>{ setView("room"); writeUrl({ view:"room", room:room.id }); }}
    onHome={goHome} onMateriales={goMateriales}/>
)}

app.jsx — estilo de import existente a imitar (app.jsx:5-8):
import { RoomView } from "./RoomView.jsx";
import { StudioScreen } from "./Studio3D.jsx";

app.jsx — estado disponible para key/fallback: view, room (roomById), furnId (:33-39), goHome, goBuilding.
</interfaces>
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Crear src/ErrorBoundary.jsx (class component recuperable)</name>
  <files>src/ErrorBoundary.jsx</files>
  <read_first>
    - src/Nav.jsx (estructura de archivo: banner, import React, named export)
    - .planning/phases/01-estabilidad-cr-tica-del-motor-3d/01-RESEARCH.md (Pattern 4, Pitfall 4, Open Question 2)
    - .planning/phases/01-estabilidad-cr-tica-del-motor-3d/01-PATTERNS.md (sección src/ErrorBoundary.jsx — "FLAG no class-component analog exists")
  </read_first>
  <action>
    Crear el archivo nuevo `src/ErrorBoundary.jsx` siguiendo la convención de Nav.jsx: banner de comentario en la primera línea ("/* ============ reno · vision — ERROR BOUNDARY ============ */"), luego `import React from "react";`, y un NAMED export `export class ErrorBoundary extends React.Component`.
    Implementar el ciclo de vida canónico de React 18: constructor que inicializa this.state = { hasError: false }; estático getDerivedStateFromError() que retorna { hasError: true }; componentDidCatch(error, info) que hace console.error("3D render error:", error, info.componentStack) (solo console.error — app cliente, sin telemetría, ver CLAUDE.md).
    Hacer el fallback RECUPERABLE (STAB-04 exige recuperable, ver Pitfall 4): en render(), si this.state.hasError, devolver this.props.fallback (si se pasó) o un fallback por defecto; e incluir una vía de reset — un método que ponga this.state.hasError=false y un control "Reintentar" (button) en el fallback por defecto que lo invoque. Adicionalmente, soportar reset por navegación: el consumidor (app.jsx, Task 2) le pasará una `key`; documentar en un comentario que el cambio de key remonta el boundary y limpia hasError. Si this.state.hasError es false, devolver this.props.children.
    No introducir TypeScript ni dependencias (NO usar react-error-boundary); class component plano en JSX.
  </action>
  <verify>
    <automated>npm run build</automated>
  </verify>
  <acceptance_criteria>
    - Existe el archivo src/ErrorBoundary.jsx.
    - Contiene "export class ErrorBoundary extends React.Component", "getDerivedStateFromError" y "componentDidCatch".
    - componentDidCatch usa console.error (no fetch ni endpoint externo).
    - El fallback por defecto incluye un control de reintentar que resetea this.state.hasError a false.
    - Es un named export (no default), siguiendo la convención del repo.
    - `npm run build` termina con exit code 0.
  </acceptance_criteria>
  <done>ErrorBoundary.jsx existe como class component named export con getDerivedStateFromError + componentDidCatch (console.error) y un fallback recuperable con reintentar; el build pasa.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: Envolver <StudioScreen> en <ErrorBoundary> en src/app.jsx (recuperable)</name>
  <files>src/app.jsx</files>
  <read_first>
    - src/app.jsx (líneas 5-8 imports; 33-39 estado; 79-103 render branches; 97-103 branch del Studio)
    - .planning/phases/01-estabilidad-cr-tica-del-motor-3d/01-RESEARCH.md (Recommended Structure, Pattern 4, Pitfall 4)
    - .planning/phases/01-estabilidad-cr-tica-del-motor-3d/01-PATTERNS.md (sección src/app.jsx — wrap del branch + key)
    - src/ErrorBoundary.jsx (la API del componente creada en Task 1: props children, fallback, key)
  </read_first>
  <action>
    En el bloque de imports (~:5-8), agregar `import { ErrorBoundary } from "./ErrorBoundary.jsx";` siguiendo el estilo de named import existente.
    En el branch `view==="studio" && room` (~:97-103), envolver el `<StudioScreen .../>` existente con `<ErrorBoundary>`, sin alterar ninguna de las props que StudioScreen ya recibe. Pasar al boundary una `key` recuperable tied al config/vista activos (recomendado: key derivada de furnId, o `${furnId}` ) de modo que navegar/cambiar de módulo remonte el boundary y limpie hasError (Pitfall 4). Opcionalmente pasar un prop `fallback` con un mensaje breve en español acorde a la marca; si no se pasa, ErrorBoundary usa su fallback por defecto recuperable. No envolver `<App/>` en main.jsx (mantener el scope del boundary en el Studio).
    No tocar main.jsx. No introducir TypeScript ni dependencias.
  </action>
  <verify>
    <automated>npm run build</automated>
  </verify>
  <acceptance_criteria>
    - src/app.jsx contiene `import { ErrorBoundary } from "./ErrorBoundary.jsx";`.
    - El branch view==="studio" envuelve <StudioScreen ...> dentro de <ErrorBoundary ...> con todas las props originales de StudioScreen intactas.
    - El <ErrorBoundary> recibe una key derivada del config/vista (ej. key={furnId}) para hacer el fallback recuperable por navegación.
    - src/main.jsx permanece sin cambios.
    - `npm run build` termina con exit code 0.
    - Verificación manual (registrada en SUMMARY): el Studio sigue renderizando y operando normalmente cuando no hay error (no-regresión); cambiar de módulo/vista remonta el boundary.
  </acceptance_criteria>
  <done>app.jsx importa ErrorBoundary y envuelve StudioScreen con una key recuperable; main.jsx intacto; un throw síncrono del Studio degrada a fallback recuperable en vez de pantalla blanca; el build pasa.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Render tree del Studio → resto de la SPA | Un throw síncrono no controlado en el subárbol del Studio puede tumbar toda la app (pantalla blanca). El boundary aísla ese subárbol. |

No hay red, secretos, PII ni input de usuario en esta fase (app cliente sin backend).

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-01-05 | Denial of Service | Studio render/commit (throw síncrono → pantalla blanca de toda la SPA) | mitigate | ErrorBoundary de clase envolviendo el branch del Studio con fallback recuperable (Tasks 1-2). |
| T-01-SC | Tampering | npm installs | accept | No se instalan paquetes nuevos (se descarta react-error-boundary a favor del class component hand-rolled, ver RESEARCH Standard Stack). Sin superficie de supply-chain nueva. |
</threat_model>

<verification>
- `npm run build` pasa (exit 0) tras ambos tasks.
- Manual (sesión `npm run dev`): el Studio renderiza y opera normalmente sin error (no-regresión).
- Manual: forzar un throw síncrono temporal en el render del Studio muestra el fallback recuperable (no pantalla blanca de la SPA); el control "Reintentar" o el cambio de módulo/vista limpia el estado de error.
</verification>

<success_criteria>
- STAB-04 (parte síncrona): un error de render/commit del Studio degrada a un fallback recuperable, no a pantalla blanca de toda la SPA.
- El boundary es un class component named export en su propio archivo (reutilizable en fases futuras).
- El fallback es recuperable (reintentar y/o remonte por key).
- main.jsx sin cambios; sin TypeScript ni dependencias nuevas.
</success_criteria>

<output>
Create `.planning/phases/01-estabilidad-cr-tica-del-motor-3d/01-02-SUMMARY.md` when done.
</output>
