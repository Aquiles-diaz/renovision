# Phase 3: Entrega real de la cotización - Pattern Map

**Mapped:** 2026-06-07
**Files analyzed:** 5 (3 modified, 2 new)
**Analogs found:** 5 / 5 (every new/modified file has an in-repo analog)

> Brownfield React 18 + Vite + JSX SPA. TypeScript forbidden this milestone. Client-only, no own backend. All analogs live in this repo; prefer them over RESEARCH.md examples. The new modal MUST visually match `.ar-modal` (see 03-UI-SPEC.md) — this map points at the exact source lines to copy.

---

## File Classification

| New/Modified File | New? | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|------|-----------|----------------|---------------|
| `src/Studio3D.jsx` → `downloadDoc(kind)` | modified | utility (doc generator) | file-I/O (Blob download → PDF) | itself (`downloadDoc`) + `exportFurnitureToGLB`/`openAR` (dynamic-import + object-URL hygiene) | exact (in-place rewrite) |
| `src/Studio3D.jsx` → contact modal + send wiring | modified | component (modal) + handler | request-response (EmailJS send) + event-driven (form) | AR modal block (`Studio3D.jsx:842-865`) + `openAR`/`closeAR` (`472-489`) + `copyLink`/`copied` (`491-496`) | exact (same file, same modal idiom) |
| `src/emailjs.config.js` (or `import.meta.env`) | **new** | config | n/a (constants) | `src/data.jsx` single-source-of-truth constants module | role-match |
| `src/sendQuote.js` | **new** | service | request-response (network, first outbound call) | `exportFurnitureToGLB` async builder (`Studio3D.jsx` GLB export) — isolates a side-effecting async into one fn | role-match |
| `styles/styles.css` → `.contact-modal*` rules | modified | config (styling) | n/a | `.ar-modal` / `.ar-modal__box` / `.ar-modal__close` (`styles.css:496-546`) + `.btn--red` (`158-165`) | exact (extend same tokens) |

> The planner may collapse `src/emailjs.config.js` + `src/sendQuote.js` into a single module, or fold config into `import.meta.env` (CONTEXT D-04 / "Claude's Discretion"). Keep the network call isolated in one function either way (CONTEXT: "aislarla en una función/módulo de envío").

---

## Pattern Assignments

### `downloadDoc(kind)` rewrite — HTML → real PDF (modified, utility, file-I/O)

**Analog:** `src/Studio3D.jsx:498-551` (the function itself) + the dynamic-import + object-URL-revoke discipline from `openAR` (`472-483`).

**Keep as-is — the HTML/CSS string (`Studio3D.jsx:508-541`).** CONTEXT D-01 mandates reusing the existing markup; only the *output* path changes. The inline doc CSS (`.logo`/`.acc`/`.tag`/`.total`, lines 510-523) is the print layout html2pdf will rasterize. The `.acc` red dot (`#e23a2b`, line 513) is the brand glyph the UI-SPEC reserves accent for.

**Current download tail to REPLACE (`Studio3D.jsx:542-550`):**
```javascript
const blob = new Blob([html], { type: "text/html" });
const url = URL.createObjectURL(blob);
const a = document.createElement("a");
a.href = url;
a.download = `reno-${furniture.id}-${tech ? "ficha-tecnica" : "presupuesto"}.html`;
document.body.appendChild(a);
a.click();
a.remove();
setTimeout(() => URL.revokeObjectURL(url), 4000);
```

**Replacement shape — dynamic import (D-03) + html2pdf, `.pdf` extension (D-02):**
```javascript
// make the handler async; lazy-load so html2pdf stays out of the initial bundle
const { default: html2pdf } = await import("html2pdf.js");
const holder = document.createElement("div");
holder.innerHTML = html;            // reuse the SAME html string built above
await html2pdf()
  .set({ filename: `reno-${furniture.id}-${tech ? "ficha-tecnica" : "presupuesto"}.pdf` })
  .from(holder)
  .save();
```

**Dynamic-import + cleanup precedent to mirror — `openAR` (`Studio3D.jsx:472-483`):**
```javascript
function openAR() {
  setArLoading(true);
  exportFurnitureToGLB({ furniture, width, bays, melamina: mat, legId })
    .then((url) => { /* ...swap url... */ setArLoading(false); })
    .catch(() => setArLoading(false));   // <-- always clear the loading flag on failure
}
```
Apply the same `try/catch` + loading-flag-reset hygiene to the async `downloadDoc` so a PDF failure never freezes a button (mirrors the GLB `.catch` and the object-URL revoke in `closeAR`, `484-489`). No bare `<a download>` object URL should be left dangling.

---

### Contact modal + "Solicitar" wiring (modified, component + handler, request-response)

**Analog (markup + overlay mechanics):** AR modal block, `Studio3D.jsx:842-865`.

**Overlay/box/close/stopPropagation pattern to copy verbatim (structure):**
```jsx
{/* AR MODAL — copy this overlay+box+close skeleton for the contact modal */}
{arUrl && (
  <div className="ar-modal" onClick={closeAR}>                      {/* overlay click closes */}
    <div className="ar-modal__box" onClick={(e) => e.stopPropagation()}>  {/* box swallows clicks */}
      <button className="ar-modal__close" onClick={closeAR}>✕</button>     {/* 38×38 top-right */}
      {/* ...content... */}
      <div className="ar-modal__hint">{/* footer copy */}</div>
    </div>
  </div>
)}
```
For the contact modal: gate on `contactOpen` instead of `arUrl`; reuse `ar-modal` overlay class; use a new `.contact-modal__box` (form-sized, see styles below); add `aria-label="Cerrar"` to the `✕` button (UI-SPEC Interaction Contract); `e.stopPropagation()` stays.

**Open/close handler analog — `openAR`/`closeAR` (`Studio3D.jsx:472-489`).** Add `openContact()` / `closeContact()` beside them. Rewire the CTA at `Studio3D.jsx:713-715` from `onClick={() => downloadDoc("presupuesto")}` to `onClick={openContact}`, and update copy to `Solicitar cotización →` (UI-SPEC).

**Ephemeral-feedback / state idiom — `copyLink` + `copied` (`Studio3D.jsx:491-496` and the button at `623-625`):**
```javascript
const [copied, setCopied] = useState(false);
function copyLink() {
  navigator.clipboard?.writeText(window.location.href).then(() => {
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);   // transient toast idiom
  });
}
// button label flips on state: {copied ? "¡Link copiado!" : "↗ Copiar link"}
```
The `copied` boolean + label-flip is the established feedback idiom. For the modal, extend it to a 3-value local machine (UI-SPEC State machine): `const [sendState, setSendState] = useState("idle")` → `"idle" | "sending" | "success" | "error"`. Unlike the 1.8s toast, **success/error are persistent panels** (D-07 / UI-SPEC) — do NOT auto-dismiss them. Controlled form inputs via `useState` (same local-state-per-view pattern as all the existing `setWidth`/`setMatId` state at `Studio3D.jsx:439-445`); preserve inputs across `error → sending` retry.

**Reuse `window.location.href` as the shareable link in the email (D-05).** Identical source to `copyLink` (line 492). The URL already encodes full config via `writeUrl` in `src/app.jsx:21-31` (mirrored from Studio via `onConfig` → `onStudioConfig`, `app.jsx:76-78`). Do NOT build a new link mechanism — pass `window.location.href` straight into the EmailJS payload.

**Email summary data is already in scope at the call site:** `furniture`, `room`, `line`/`lineId`, `width`, `furniture.alto`, `furniture.prof`, `quote.bays`, `mat` (melamina), `leg`/`legId`, and `fmtAR(quote.total)` — all present in `StudioScreen` render scope (see `downloadDoc` reading them, `Studio3D.jsx:499-540`). Build the email params object from these.

---

### `src/sendQuote.js` (new, service, request-response — first outbound network call)

**Analog:** `exportFurnitureToGLB` (async builder isolating a side-effect into one promise-returning fn) — same "one function owns the messy external thing" shape used by `openAR`.

**Pattern to follow:** export one async function that takes a plain params object and returns a promise; throw on failure so the caller's `try/catch` (modal `sending → error`) handles it — mirroring `openAR`'s `.then/.catch`.
```javascript
import emailjs from "@emailjs/browser";
import { EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY } from "./emailjs.config.js";

export async function sendQuote(params) {
  // defensive: missing-credentials path (UI-SPEC: graceful fallback to PDF download)
  if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
    throw new Error("EMAILJS_NOT_CONFIGURED");
  }
  return emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, params, {
    publicKey: EMAILJS_PUBLIC_KEY,
  });
}
```
The caller in `StudioScreen` distinguishes `EMAILJS_NOT_CONFIGURED` to show the "El envío no está disponible…" copy (UI-SPEC Missing-credentials row) vs. the generic "No se pudo enviar" error.

> `@emailjs/browser` may be a normal top-level import (small SDK, network-only on submit). Only `html2pdf.js` must be dynamic-imported per D-03 (bundle-size constraint protects the 3D core value).

---

### `src/emailjs.config.js` (new, config — constants module)

**Analog:** `src/data.jsx` — the repo's established single-source-of-truth constants module (catalog/pricing live there; every view imports named constants). Mirror its "named exports of plain values" convention.

```javascript
// EmailJS credentials — client-side by design (public key is NOT secret).
// User provides these (CONTEXT D-04). May instead read import.meta.env.VITE_* (Vite) — planner's call.
export const EMAILJS_SERVICE_ID  = "";   // user-provided
export const EMAILJS_TEMPLATE_ID = "";   // user-provided
export const EMAILJS_PUBLIC_KEY  = "";   // user-provided
```
Document in the plan that these are user-supplied setup (CONTEXT Integration Points) and that empty values trigger the graceful-fallback error state, not a crash.

---

## Shared Patterns

### Modal overlay + box + close (reuse, do not reinvent)
**Source:** `styles/styles.css:496-546` (`.ar-modal`, `.ar-modal__box`, `.ar-modal__close`, `.ar-modal__hint`).
**Apply to:** the new contact modal.
```css
.ar-modal { position:fixed; inset:0; z-index:60; background:rgba(0,0,0,.78);
  backdrop-filter:blur(6px); display:grid; place-items:center; padding:24px; }
.ar-modal__box { background:var(--bg-2); border:1px solid var(--line-strong); border-radius:16px; /* ... */ }
.ar-modal__close { position:absolute; right:14px; top:14px; width:38px; height:38px;
  border-radius:10px; border:1px solid var(--line); background:rgba(12,12,11,.7); color:#fff; }
```
Reuse `.ar-modal` overlay as-is; add `.contact-modal__box` that extends the same tokens (`var(--bg-2)`, `var(--line-strong)`, `border-radius:16px`) but sized `width:min(440px,94vw); height:auto` for a form (UI-SPEC Box row). Reuse `.ar-modal__close` for the `✕`.

### Primary CTA button styling
**Source:** `styles/styles.css:134-165` (`.btn`, `.btn--red`).
**Apply to:** the modal submit button and the action-bar CTA.
```css
.btn { font-size:12px; font-weight:700; letter-spacing:.16em; text-transform:uppercase;
  padding:15px 26px; border-radius:999px; /* ... */ }
.btn--red { background:var(--red); color:#fff; }
.btn--red:hover { background:var(--red-soft); transform:translateY(-2px); }
```
Accent (`--red`/`--red-soft`) is reserved for THIS primary CTA only (UI-SPEC Color). Secondary download buttons stay neutral `.dlbtn` (`styles.css:703`). Error text/border reuse `--red`; success uses neutral `--ink` (no green).

### Ephemeral feedback / local state machine
**Source:** `src/Studio3D.jsx:491-496` (`copyLink` + `setCopied`/`setTimeout(…,1800)`); local-state declarations at `439-445`.
**Apply to:** modal `sendState` (idle/sending/success/error) and any transient toasts. Note: modal success/error are persistent panels, NOT 1.8s toasts (D-07).

### Async side-effect isolation + cleanup hygiene
**Source:** `openAR`/`closeAR` (`src/Studio3D.jsx:472-489`) — `.then/.catch`, always reset loading flag, `URL.revokeObjectURL` on swap/close.
**Apply to:** the async `downloadDoc` (no dangling object URLs) and the `sendQuote` caller (catch → error state, never leave `sending` stuck).

### Shareable link (do not rebuild)
**Source:** `src/app.jsx:11-31` (`readUrl`/`writeUrl`) + `Studio3D.jsx:466-468` (`onConfig`) + `app.jsx:76-78` (`onStudioConfig`). The current URL (`window.location.href`) already round-trips full config.
**Apply to:** the EmailJS payload `link` param (D-05). Source it from `window.location.href`, exactly as `copyLink` does.

---

## No Analog Found

None. Every file maps to an in-repo precedent. The only genuinely new *capability* is an outbound network call (EmailJS) — the repo has zero prior `fetch`/SDK calls (CONTEXT: "el primer touchpoint de red saliente") — but the *structural* analog (isolate the async side-effect in one function, `.then/.catch` at the call site) is well established by `exportFurnitureToGLB`/`openAR`.

---

## Metadata

**Analog search scope:** `src/Studio3D.jsx`, `src/app.jsx`, `src/data.jsx` (referenced), `styles/styles.css`, `package.json`.
**Files scanned:** 5.
**New npm deps introduced this phase:** `html2pdf.js` (dynamic-imported, D-03), `@emailjs/browser` (D-04). Neither present in `package.json` yet (current deps: react, react-dom, three, @google/model-viewer).
**Pattern extraction date:** 2026-06-07.
