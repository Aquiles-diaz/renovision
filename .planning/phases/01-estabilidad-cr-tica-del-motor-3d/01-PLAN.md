---
phase: 01-estabilidad-cr-tica-del-motor-3d
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/Studio3D.jsx
autonomous: true
requirements: [STAB-01, STAB-02, STAB-03, STAB-04, STAB-05]
must_haves:
  truths:
    - "Cambiar repetidamente ancho/melamina/patas/línea NO aumenta de forma sostenida renderer.info.memory.geometries (las geometrías y materiales del grupo previo se liberan en cada reconstrucción)"
    - "Las melaminas siguen viéndose texturizadas después de cambiar de melamina varias veces (las texturas compartidas NO se destruyen en el dispose por reconstrucción)"
    - "Al desmontar el Studio se libera el cache de texturas (_texCache queda vacío y sus texturas disposed)"
    - "Salir del Studio con el modal AR abierto revoca el blob URL del GLB (no quedan object URLs colgando)"
    - "En un navegador sin WebGL o ante context-loss, la app NO crashea: degrada al panel 2D existente con un mensaje, y el context puede restaurarse"
    - "Un error lanzado dentro del loop requestAnimationFrame NO deja la app congelada/en blanco: el loop se auto-captura, cancela el rAF y degrada al panel 2D"
  artifacts:
    - path: "src/Studio3D.jsx"
      provides: "disposeGroup, disposeTextureCache, isWebGLAvailable helpers; rebuild+unmount dispose wiring; arUrl unmount revoke effect; guarded WebGLRenderer creation; webglcontextlost/restored handling; no3D 2D-fallback state"
      contains: "function disposeGroup("
  key_links:
    - from: "rebuild effect (Viewer3D, ~Studio3D.jsx:351-359)"
      to: "disposeGroup(st.group)"
      via: "called before scene.remove(st.group)"
      pattern: "disposeGroup\\(st\\.group\\)"
    - from: "mount-effect unmount cleanup (~Studio3D.jsx:339-347)"
      to: "disposeTextureCache() + disposeGroup(final group)"
      via: "appended to existing cleanup return"
      pattern: "disposeTextureCache\\(\\)"
    - from: "webglcontextlost handler"
      to: "event.preventDefault()"
      via: "required so 'restored' can fire"
      pattern: "preventDefault\\(\\)"
---

<objective>
Endurecer el motor 3D en `src/Studio3D.jsx` para eliminar las fugas de memoria GPU y los crashes del render. Cubre STAB-01 (dispose de geometrías+materiales por reconstrucción), STAB-02 (liberar el cache de texturas al desmontar), STAB-03 (revocar el blob URL de AR al desmontar), STAB-05 (creación robusta del WebGLRenderer + context-loss), y la mitad asíncrona de STAB-04 (el loop rAF se auto-captura y degrada al panel 2D mediante un flag local `no3D`).

Purpose: El usuario puede explorar anchos/melaminas/patas en sesiones largas sin que la memoria GPU crezca ni la app se rompa; cualquier fallo del render degrada a un fallback recuperable en vez de pantalla blanca.

Output: `src/Studio3D.jsx` modificado con helpers `disposeGroup`, `disposeTextureCache`, `isWebGLAvailable`, wiring de dispose en reconstrucción y desmontaje, efecto de revocación de `arUrl` al desmontar, creación guardada del renderer, listeners de context-loss, y un estado `no3D` que conmuta al panel 2D existente.

CRITICAL OWNERSHIP RULE (resuelve el conflicto STAB-01 vs STAB-02): el dispose por reconstrucción libera SOLO geometry + material, NUNCA `material.map`. Las texturas viven en el `_texCache` module-global, son compartidas por las reconstrucciones siguientes y por el exportador GLB, y se liberan UNA sola vez en el desmontaje vía `disposeTextureCache()`. Disponer `material.map` en la reconstrucción deja los muebles negros/sin textura.
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
@CLAUDE.md

<interfaces>
<!-- Identificadores y líneas exactas en src/Studio3D.jsx que las tareas extienden. -->
<!-- El ejecutor debe usar estos directamente — sin explorar el codebase. -->

Module-global texture cache (Studio3D.jsx:80-93):
- const _texLoader = new THREE.TextureLoader();
- const _texCache = {};  // map url -> THREE.Texture, compartido por viewer + exportador GLB
- function getMelaminaTexture(url) // popula _texCache[url] lazy
- function loadMelaminaTexture(url) // versión async usada por exportFurnitureToGLB

buildFurnitureGroup({ furniture, width, bays, melamina, legId }) (Studio3D.jsx:114-240):
- Geometrías frescas por build: BoxGeometry (:138), EdgesGeometry (:144), CylinderGeometry/BoxGeometry patas (:229-231)
- Materiales frescos por build: bodyMat (:123), edgeMat LineBasicMaterial (:130), innerMat (:131), handleMat (:168), glassMat (:200), legMat (:213-220)
- tex = getMelaminaTexture(melamina.img) (:122) -> referenciado por bodyMat.map / innerMat.map -> COMPARTIDO, NO disponer

Viewer3D mount effect (Studio3D.jsx:249-348):
- crea scene/camera/renderer/controls/luces/floor/grid/group
- renderer creado SIN guarda en :259-268
- listener pattern existente: renderer.domElement.addEventListener("pointerdown", stopAuto) (:336), removido en cleanup (:343)
- rAF loop (:314-320): animate() llama controls.update() + renderer.render(scene, camera)
- stateRef.current asignado en :338 con { scene, camera, renderer, controls, group, raf, mount, onResize, ro, stopAuto }
- cleanup return (:339-347): cancelAnimationFrame, removeEventListener resize, ro.disconnect, removeEventListener pointerdown, renderer.dispose, remove domElement

Viewer3D rebuild effect (Studio3D.jsx:351-377):
- scene.remove(st.group) (:355) descarta el grupo viejo SIN dispose (la fuga)
- group = buildFurnitureGroup(...) (:357); st.group = group (:359)
- dep array (:377): [furniture.id, width, bays, melamina.id, legId]

StudioScreen state + efectos:
- const [arUrl, setArUrl] = useState(null) (:443)
- const [imgErr, setImgErr] = useState(false) (:442)  // patrón boolean-flag de degradación a copiar
- openAR (:472-483) revoca prev antes de asignar; closeAR (:484-489) revoca y pone null
- panel 2D existente (render): JSX en :652-671 — destino del fallback no3D
- Viewer3D usado en :609-617 dentro de <div className="viewer">
</interfaces>
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Helpers de dispose + wiring de reconstrucción y desmontaje (STAB-01, STAB-02)</name>
  <files>src/Studio3D.jsx</files>
  <read_first>
    - src/Studio3D.jsx (líneas 80-93 cache; 114-240 buildFurnitureGroup; 338-359 mount cleanup + rebuild effect)
    - .planning/phases/01-estabilidad-cr-tica-del-motor-3d/01-RESEARCH.md (Pattern 1, Pattern 2, Pitfall 1, sección "Ownership rule")
    - .planning/phases/01-estabilidad-cr-tica-del-motor-3d/01-PATTERNS.md (STAB-01, STAB-02, "Shared Patterns: Effect cleanup")
  </read_first>
  <action>
    Agregar dos helpers a module-scope, junto a buildFurnitureGroup / _texCache. (1) `disposeGroup(group)`: si group es falsy retorna; recorre con group.traverse, dispone obj.geometry si existe, y para cada material (normalizando material que puede ser array o único) llama m.dispose(). NO llamar m.map.dispose() ni tocar material.map bajo ninguna circunstancia — las texturas son cache-owned y compartidas (ver Pitfall 1). (2) `disposeTextureCache()`: itera las keys de _texCache, llama _texCache[url]?.dispose() y luego delete _texCache[url], dejando el objeto vacío.
    Wiring de reconstrucción: en el rebuild effect (~:351-359), llamar `disposeGroup(st.group)` inmediatamente ANTES de `scene.remove(st.group)`. No reordenar el resto del efecto.
    Wiring de desmontaje: en el cleanup return del mount effect (~:339-347), DESPUÉS del cancelAnimationFrame y las removeEventListener existentes, y antes o después de renderer.dispose() (mantener el orden cancel -> remove listeners -> dispose -> detach), agregar: `disposeGroup(stateRef.current.group)`, `renderer.renderLists.dispose()`, `renderer.forceContextLoss()` y `disposeTextureCache()`. Conservar el detach del domElement existente al final. No introducir TypeScript ni dependencias nuevas; mantener JSX/JS plano.
  </action>
  <verify>
    <automated>npm run build</automated>
  </verify>
  <acceptance_criteria>
    - src/Studio3D.jsx contiene "function disposeGroup(" y "function disposeTextureCache(".
    - disposeGroup NO contiene la subcadena ".map.dispose" ni "material.map" (grep -v '^*' del cuerpo de la función no debe mostrar disposición de texturas).
    - El rebuild effect llama disposeGroup(st.group) en una línea que aparece ANTES de la línea con scene.remove(st.group).
    - El cleanup del mount effect contiene disposeTextureCache() y renderer.forceContextLoss().
    - `npm run build` termina con exit code 0.
    - Verificación manual de no-regresión (registrada en SUMMARY): tras `npm run dev`, cambiar melamina 3+ veces deja el mueble texturizado (no negro/blanco), confirmando que las texturas compartidas no se disponen por reconstrucción.
  </acceptance_criteria>
  <done>disposeGroup y disposeTextureCache existen y están cableados; reconstrucción dispone geom+mat sin tocar texturas; desmontaje libera grupo final, renderLists, fuerza context loss y vacía el cache de texturas; el build pasa.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: Revocar blob URL de AR al desmontar (STAB-03)</name>
  <files>src/Studio3D.jsx</files>
  <read_first>
    - src/Studio3D.jsx (líneas 443 estado arUrl; 461-468 efectos existentes de StudioScreen; 472-489 openAR/closeAR)
    - .planning/phases/01-estabilidad-cr-tica-del-motor-3d/01-RESEARCH.md (Pattern 3)
    - .planning/phases/01-estabilidad-cr-tica-del-motor-3d/01-PATTERNS.md (STAB-03, "Shared Patterns: Object-URL lifecycle")
  </read_first>
  <action>
    En StudioScreen, junto a los demás useEffect (cerca de :461-468), agregar un useEffect cuyo dep array sea [arUrl] y cuya función retorne una cleanup que, si arUrl es truthy, llame URL.revokeObjectURL(arUrl). Esto COMPLEMENTA (no reemplaza) los revokes existentes en openAR (:476-479) y closeAR (:484-489): la cleanup dispara al cambiar arUrl (revocando el valor previo) y al desmontar (revocando el valor final), cubriendo la fuga de "navegar Home/Back con el modal AR abierto". No modificar openAR ni closeAR.
  </action>
  <verify>
    <automated>npm run build</automated>
  </verify>
  <acceptance_criteria>
    - src/Studio3D.jsx contiene un useEffect con dep array [arUrl] cuya cleanup llama URL.revokeObjectURL(arUrl).
    - openAR y closeAR permanecen sin cambios (siguen conteniendo sus URL.revokeObjectURL existentes).
    - `npm run build` termina con exit code 0.
  </acceptance_criteria>
  <done>Existe un efecto [arUrl] que revoca el blob URL en cleanup; desmontar el Studio con AR abierto ya no deja object URLs colgando; el build pasa.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 3: WebGLRenderer robusto + context-loss + auto-captura del loop rAF con fallback no3D (STAB-05, mitad async de STAB-04)</name>
  <files>src/Studio3D.jsx</files>
  <read_first>
    - src/Studio3D.jsx (líneas 243-348 Viewer3D completo; 259-268 creación renderer; 314-320 loop rAF; 336/343 patrón add/removeEventListener; 442/658-670 patrón boolean-flag imgErr; 609-617 uso de Viewer3D; 652-671 panel 2D)
    - .planning/phases/01-estabilidad-cr-tica-del-motor-3d/01-RESEARCH.md (Pattern 4 approach 1, Pattern 5, Pitfall 2, Pitfall 3)
    - .planning/phases/01-estabilidad-cr-tica-del-motor-3d/01-PATTERNS.md (STAB-04 rAF, STAB-05, "2D fallback (shared sink)", "Boolean-flag degradation")
  </read_first>
  <action>
    (a) Agregar a module-scope un helper `isWebGLAvailable()` que en try/catch cree un canvas con document.createElement("canvas") y devuelva booleano según window.WebGLRenderingContext && (canvas.getContext("webgl2") || canvas.getContext("webgl")); en catch devolver false.
    (b) Estado de fallback: agregar en Viewer3D un useState booleano `no3D` (siguiendo el patrón boolean-flag de imgErr). Al inicio del mount effect, si !isWebGLAvailable() llamar setNo3D(true) y hacer early return del efecto (degradar al panel 2D). Envolver la creación `new THREE.WebGLRenderer({...})` (:259-268) en try/catch: en catch hacer console.error del fallo, setNo3D(true) y early return.
    (c) Context-loss: tras crear el renderer, registrar sobre renderer.domElement un listener 'webglcontextlost' cuyo handler llame event.preventDefault() (OBLIGATORIO para que 'restored' pueda dispararse — ver Pitfall 3), cancelAnimationFrame del raf actual y setNo3D(true); y un listener 'webglcontextrestored' que ponga setNo3D(false) y dispare un re-init (recomendado: bump de una React key para remontar Viewer3D — ver RESEARCH Open Question 1). Registrar ambos junto al addEventListener('pointerdown', stopAuto) existente (:336) y removerlos en el mismo bloque de cleanup (:343).
    (d) Auto-captura del loop rAF: envolver el cuerpo de animate() (:315-320) en try/catch; en catch, console.error, cancelAnimationFrame(raf) y setNo3D(true) (NO re-lanzar — el Error Boundary NO captura throws de requestAnimationFrame, ver Pitfall 2). El boundary síncrono se cablea en el plan 02.
    (e) Render condicional: cuando no3D sea true, Viewer3D debe renderizar un fallback dentro de className="viewer__canvas" (o que el contenedor padre muestre) el panel 2D / mensaje "tu navegador no soporta 3D — mostrando render 2D", reutilizando el patrón de degradación existente. Mantener el `<div ref={mountRef} className="viewer__canvas" />` montado cuando no3D es false. No romper el flujo AR ni la exportación GLB.
    No introducir TypeScript ni dependencias; usar solo APIs de three@0.163 y React 18 ya instaladas.
  </action>
  <verify>
    <automated>npm run build</automated>
  </verify>
  <acceptance_criteria>
    - src/Studio3D.jsx contiene "function isWebGLAvailable(" y un useState para no3D dentro de Viewer3D.
    - La creación de new THREE.WebGLRenderer está dentro de un bloque try/catch y existe un early return cuando isWebGLAvailable() es false.
    - Existe un addEventListener("webglcontextlost", ...) cuyo handler contiene event.preventDefault(); y un addEventListener("webglcontextrestored", ...); ambos se remueven en el cleanup.
    - El cuerpo del loop animate() (renderer.render) está dentro de un try/catch que en catch llama cancelAnimationFrame y setNo3D(true) y NO re-lanza.
    - Cuando no3D es true, Viewer3D no intenta renderizar con WebGL y muestra un fallback 2D/mensaje.
    - `npm run build` termina con exit code 0.
    - Verificación manual (registrada en SUMMARY): la experiencia 3D y AR normales siguen funcionando cuando WebGL está disponible (no-regresión).
  </acceptance_criteria>
  <done>isWebGLAvailable existe; la creación del renderer está guardada con early return a no3D; los listeners de context-loss usan preventDefault y se limpian; el loop rAF se auto-captura degradando a no3D; el panel 2D actúa como fallback recuperable; el build pasa.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| GPU driver / WebGL context → app | El context puede perderse (reset de GPU, backgrounding) o no existir; entrada no confiable en cuanto a disponibilidad/estabilidad. |
| Navegador (object URLs / memoria GPU) → app | Recursos que persisten hasta ser liberados explícitamente (texturas, geometrías, blob URLs). |

No hay red, secretos, PII ni input de usuario en esta fase (app cliente sin backend — ver CONCERNS.md / RESEARCH Security Domain).

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-01-01 | Denial of Service | rebuild effect + buildFurnitureGroup (fuga de geometrías/materiales GPU) | mitigate | disposeGroup() en cada reconstrucción y en el desmontaje (Task 1); renderer.info.memory.geometries se mantiene plano. |
| T-01-02 | Denial of Service | _texCache module-global (crece indefinidamente) | mitigate | disposeTextureCache() en el desmontaje del Studio (Task 1). |
| T-01-03 | Denial of Service | arUrl blob URLs colgando | mitigate | Efecto de cleanup [arUrl] que revoca object URLs (Task 2). |
| T-01-04 | Denial of Service | new WebGLRenderer / loop rAF sin guarda (crash → pantalla congelada) | mitigate | Probe isWebGLAvailable + try/catch + context-loss con preventDefault + auto-captura del rAF degradando a no3D (Task 3). |
| T-01-SC | Tampering | npm installs | accept | Esta fase NO instala paquetes nuevos; usa three@0.163.0 y react@18.3.1 ya presentes y pinneados en el lockfile (ver RESEARCH "Package Legitimacy Audit"). Sin superficie de supply-chain nueva. |
</threat_model>

<verification>
- `npm run build` pasa (exit 0) tras los tres tasks.
- Manual (sesión `npm run dev`): cambiar ancho/melamina/patas/línea repetidamente mantiene `renderer.info.memory.geometries` plano (no crece de forma sostenida) — handle objetivo de STAB-01.
- Manual: cambiar de melamina varias veces deja el mueble texturizado (confirma que las texturas compartidas no se disponen por reconstrucción).
- Manual: salir del Studio con el modal AR abierto no deja object URLs colgando.
- Manual: la experiencia 3D/AR existente sigue intacta cuando WebGL está disponible.
</verification>

<success_criteria>
- STAB-01: geometrías y materiales se disponen en cada reconstrucción; sin fuga de geometrías GPU.
- STAB-02: el cache de texturas se libera (disposed + vaciado) al desmontar el Studio.
- STAB-03: el blob URL de AR se revoca al cambiar arUrl y al desmontar.
- STAB-05: creación del renderer guardada; sin WebGL o ante context-loss degrada al panel 2D sin crashear; el context puede restaurarse (preventDefault presente).
- STAB-04 (parte async): un throw en el loop rAF se auto-captura y degrada a no3D en vez de congelar la app.
- No se introdujo TypeScript ni dependencias nuevas; la experiencia 3D/AR no se rompió.
</success_criteria>

<output>
Create `.planning/phases/01-estabilidad-cr-tica-del-motor-3d/01-01-SUMMARY.md` when done.
</output>
