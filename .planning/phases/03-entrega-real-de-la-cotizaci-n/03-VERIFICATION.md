---
phase: 03-entrega-real-de-la-cotizaci-n
verified: 2026-06-07T00:00:00Z
status: human_needed
score: 7/7 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Click 'Descargar ficha técnica (PDF)' and 'Descargar presupuesto (PDF)' in a running browser"
    expected: "A real .pdf file downloads (not an .html file), with the correct document layout (logo, specs, total)"
    why_human: "html2pdf.js rendering depends on browser DOM and canvas — code-level verification confirmed the wiring is correct, but PDF visual output requires a running browser"
  - test: "Click 'Solicitar cotización →', fill name + email or phone, click submit with empty credentials"
    expected: "Modal opens; submit stays disabled until name + (email or phone) provided; on submit the error panel shows 'El envío no está disponible… descargá el presupuesto en PDF' (no crash, no page reload); form fields are preserved; 'Reintentar' button returns to editable form"
    why_human: "State-machine behavior and form field preservation across the error path require a running browser — all code paths verified statically but UI flow needs human confirmation"
  - test: "After a successful EmailJS send (user must supply real credentials first)"
    expected: "Modal shows persistent '¡Cotización enviada!' panel (no auto-dismiss); 'Cerrar' button closes the modal"
    why_human: "End-to-end success path requires real EmailJS credentials (documented user-setup action) and a live network call — the code wiring is verified but the live flow cannot be verified without credentials"
---

# Phase 3: Entrega Real de la Cotización — Verification Report

**Phase Goal:** El usuario obtiene un PDF real de su cotización y, al "Solicitar", la cotización llega efectivamente al negocio vía un servicio externo liviano (EmailJS) — sin promesas falsas en los botones, con confirmación visible del envío.
**Verified:** 2026-06-07
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | "Clicking 'Descargar ficha técnica (PDF)' downloads a real .pdf file (not .html)" | VERIFIED | `downloadDoc` uses `await import("html2pdf.js")` (line 628); filename ends in `.pdf` (line 633); no `text/html` Blob or `.html` download path exists anywhere in the file |
| 2 | "Clicking 'Descargar presupuesto (PDF)' downloads a real .pdf file (not .html)" | VERIFIED | Same `downloadDoc` with `kind === "presupuesto"` path; both buttons wired to `downloadDoc("tecnico")` / `downloadDoc("presupuesto")` at lines 797-801 |
| 3 | "html2pdf.js is not in the initial bundle (code-split)" | VERIFIED | `npm run build` exits 0; build output shows `html2pdf-Bp-Y7te9.js` as a separate chunk (982 kB); the initial `index-ZspoFz94.js` does not include it |
| 4 | "Clicking 'Solicitar cotización →' opens a contact modal (not a file download)" | VERIFIED | CTA at line 803: `onClick={openContact}`, label "Solicitar cotización →"; `openContact` sets `contactOpen=true`; modal rendered at line 958 gated on `contactOpen` |
| 5 | "Submit is disabled until name non-empty AND at least one valid email or phone" | VERIFIED | `canSend = nameValid && (emailValid \|\| phoneValid)` at line 541; submit button has `disabled={!canSend \|\| sendState === "sending"}` at line 1057 |
| 6 | "Missing/misconfigured EmailJS credentials degrade to a clear error (no crash)" | VERIFIED | `sendQuote.js` throws `EMAILJS_NOT_CONFIGURED` when any credential is empty (line 23-25); error handler at line 577 branches on `err.message === "EMAILJS_NOT_CONFIGURED"` → `errorKind = "config"`; error panel at lines 1037-1044 shows the missing-credentials message pointing to PDF download |
| 7 | "Button labels honestly describe their real action" | VERIFIED | Download buttons read "↓ Descargar ficha técnica (PDF)" and "↓ Descargar presupuesto (PDF)" (lines 798, 801); CTA reads "Solicitar cotización →" (line 804); no old labels ("PDF Técnico", bare "Presupuesto", "Solicitar →") remain |

**Score:** 7/7 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/Studio3D.jsx` | `downloadDoc` rewritten to emit PDF via html2pdf; contact modal + state machine; CTA rewired | VERIFIED | Dynamic import at line 628; modal at line 958; `openContact` wired at line 803 |
| `src/emailjs.config.js` | Named exports for three EmailJS credentials (empty by default) | VERIFIED | Exports `EMAILJS_SERVICE_ID`, `EMAILJS_TEMPLATE_ID`, `EMAILJS_PUBLIC_KEY` as empty strings with documentation |
| `src/sendQuote.js` | Async `sendQuote(params)` with `EMAILJS_NOT_CONFIGURED` guard | VERIFIED | Guard at line 23-25; `emailjs.send(...)` at line 27; no HTML construction, no PDF attachment |
| `styles/styles.css` | `.contact-modal__box` and form rules extending ar-modal tokens | VERIFIED | `.contact-modal__box` at line 549 with `var(--bg-2)`, `var(--line-strong)`, `border-radius:16px`, `width:min(440px,94vw)` |
| `package.json` | `html2pdf.js` and `@emailjs/browser` declared as dependencies | VERIFIED | Both present: `"html2pdf.js": "^0.14.0"` and `"@emailjs/browser": "^4.4.1"` |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `cotizar__actions .btn--red CTA` | `openContact` | `onClick={openContact}` | WIRED | Line 803 confirmed |
| `Studio3D.jsx modal submit` | `sendQuote` | `await sendQuote(params)` | WIRED | Line 574 confirmed |
| `src/sendQuote.js` | `@emailjs/browser` | `emailjs.send(...)` | WIRED | Line 27 of sendQuote.js confirmed |
| `email params` | shareable URL | `link: window.location.href` | WIRED | Line 570 of Studio3D.jsx confirmed |
| `downloadDoc` buttons | `html2pdf.js` | `await import("html2pdf.js")` inside handler | WIRED | Line 628 confirmed; dynamic import only |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `downloadDoc` HTML content | `furniture`, `room`, `quote`, `mat`, `leg`, `line` | React state computed from `computeQuote` / `melaminaById` in `data.jsx` | Yes — live config data from in-scope state | FLOWING |
| `sendQuote params` | `furniture.name`, `room.name`, `quote.total`, `mat.name`, `window.location.href` | Same React state + current URL | Yes — live data built at submit time | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| `npm run build` exits 0 | `npm run build` | Exit 0; html2pdf code-split into own chunk | PASS |
| html2pdf NOT in initial bundle | Build output chunk listing | `html2pdf-*.js` is a separate asset chunk, absent from `index-*.js` | PASS |
| No `.html` download path in `downloadDoc` | grep for `new Blob\(\[html\]`, `text\/html`, `\.html` in Studio3D.jsx | No matches | PASS |
| `sendQuote.js` contains `EMAILJS_NOT_CONFIGURED` guard | grep | Present at line 23-25 | PASS |

### Probe Execution

No probe scripts declared for this phase. Step 7c: SKIPPED (no probe-*.sh files found).

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| QUOTE-01 | 03-01-PLAN.md | PDF real del documento de cotización (no `.html` disfrazado) | SATISFIED | `downloadDoc` uses `html2pdf.js` dynamic import; `.pdf` filenames; no Blob/`.html` path remains |
| QUOTE-02 | 03-02-PLAN.md | "Solicitar" envía al negocio via EmailJS con confirmación visible | SATISFIED (code) / HUMAN for live flow | All code paths verified; live end-to-end requires credentials (documented user-setup) |
| QUOTE-03 | 03-01-PLAN.md + 03-02-PLAN.md | Etiquetas de botones describen con precisión la acción real | SATISFIED | "Descargar ficha técnica (PDF)", "Descargar presupuesto (PDF)", "Solicitar cotización →" — all honest labels present |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/emailjs.config.js` | 18-20 | Empty-string credentials (intentional stub) | Info | Documented user-setup action; graceful degradation path exists and is verified; not a code defect |

No `TBD`, `FIXME`, `XXX`, `TODO`, or `HACK` markers found in any phase-modified file.

### Human Verification Required

#### 1. PDF Download — Visual Output Confirmation

**Test:** In a running browser (`npm run dev`), navigate to any configured furniture in the Studio, click "Descargar ficha técnica (PDF)" and then "Descargar presupuesto (PDF)".
**Expected:** A real `.pdf` file downloads in each case (not an `.html` file). The PDF visually shows the logo ("reno."), furniture name, specs table, melamine/leg selections, total price, and footer text — matching the prior HTML document layout.
**Why human:** `html2pdf.js` renders through the browser DOM and canvas APIs. The code wiring is verified (dynamic import, `from(holder).save()`, `.pdf` filename), but the final rendered output can only be confirmed visually in a live browser session.

#### 2. Contact Modal — State Machine and Error Degradation

**Test:** In a running browser, click "Solicitar cotización →". Verify: (a) modal opens; (b) submit button is disabled with no inputs; (c) entering only a name keeps submit disabled; (d) entering name + valid email or name + valid phone enables submit; (e) clicking submit with the default empty credentials triggers the error panel (not a crash) showing "El envío no está disponible… descargá el presupuesto en PDF"; (f) form fields are preserved; (g) "Reintentar" returns to the editable form.
**Expected:** All described behaviors match the UI-SPEC contract.
**Why human:** React state-machine transitions and form field preservation across the error → retry cycle require a running browser. Static analysis confirms the code paths exist but visual/interactive confirmation is needed.

#### 3. Live Email Delivery (After User Supplies Credentials)

**Test:** After the user populates `src/emailjs.config.js` with real Service ID, Template ID, and Public Key, submit a complete contact form.
**Expected:** (a) Button shows "Enviando…" during send; (b) on success, persistent "¡Cotización enviada!" panel appears (does NOT auto-dismiss); (c) email arrives at the business inbox with all config fields and the shareable link; (d) "Cerrar" closes the modal.
**Why human:** End-to-end delivery requires real EmailJS credentials and a live network call. Credential supply is a documented user-setup action; the code wiring is verified but the live round-trip cannot be tested programmatically without credentials.

### Gaps Summary

No code gaps. All must-haves are implemented and wired. The only outstanding items are behavioral verifications that require a running browser (PDF rendering quality, modal interaction flow) and a live-send test that requires the user to supply EmailJS credentials — the latter is a documented, expected human-setup action with verified graceful degradation in code.

---

_Verified: 2026-06-07_
_Verifier: Claude (gsd-verifier)_
