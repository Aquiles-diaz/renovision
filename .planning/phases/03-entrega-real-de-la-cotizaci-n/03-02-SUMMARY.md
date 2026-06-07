---
phase: 03-entrega-real-de-la-cotizaci-n
plan: 02
subsystem: cotizador / quote delivery (outbound email)
tags: [emailjs, contact-modal, send-state-machine, validation, graceful-degradation]
requires:
  - "src/Studio3D.jsx StudioScreen render scope (furniture, room, line, width, quote, mat, leg, fmtAR)"
  - "window.location.href as the shareable config link (round-tripped via writeUrl in app.jsx)"
  - ".ar-modal overlay + .ar-modal__box/.ar-modal__close tokens (styles.css)"
provides:
  - "Real outbound quote delivery to the business via EmailJS (first network call in the app)"
  - "Contact-form modal with idle/sending/success/error state machine, retry-without-data-loss"
  - "Graceful degradation when EmailJS credentials are missing (no crash, points user to PDF)"
  - "Honest primary CTA: 'Solicitar cotización →' that genuinely sends"
affects:
  - "src/Studio3D.jsx (new modal + state machine + handlers + CTA rewire)"
  - "styles/styles.css (.contact-modal* form styling)"
  - "package.json / package-lock.json (@emailjs/browser dependency)"
  - "src/emailjs.config.js, src/sendQuote.js (new modules)"
tech-stack:
  added:
    - "@emailjs/browser ^4.4.1 (top-level import; network-only on submit)"
  patterns:
    - "Isolate the sole outbound network call in one async service module (sendQuote)"
    - "Local useState state machine idle→sending→success|error; success/error are persistent panels"
    - "Typed sentinel error (EMAILJS_NOT_CONFIGURED) to branch graceful-degradation copy"
    - "Controlled form inputs preserved across error→retry (never cleared)"
key-files:
  created:
    - "src/emailjs.config.js"
    - "src/sendQuote.js"
  modified:
    - "src/Studio3D.jsx"
    - "styles/styles.css"
    - "package.json"
    - "package-lock.json"
decisions:
  - "D-04: outbound delivery via EmailJS, no backend; public key is non-secret by design"
  - "D-05: email carries contact + config summary + window.location.href link; PDF NOT attached"
  - "D-06: modal reuses the existing AR-modal/overlay pattern for visual coherence"
  - "D-07: success and error are persistent in-modal panels (not 1.8s toasts)"
  - "D-08: CTA copy is honest — 'Solicitar cotización →' now genuinely sends"
metrics:
  duration: "~6 min"
  completed: "2026-06-07"
  tasks: 3
  files: 6
requirements: [QUOTE-02, QUOTE-03]
---

# Phase 3 Plan 02: Real quote delivery via EmailJS + contact modal Summary

Replaced the fake "Solicitar →" download with a real contact-form modal that sends the quote (contact data + full config summary + shareable URL) to the business via EmailJS — the app's first outbound network call — with an idle/sending/success/error state machine, retry without data loss, and graceful degradation to the PDF path when credentials are absent. Closes QUOTE-02 and the CTA half of QUOTE-03. No backend introduced.

## What was built

- **`src/emailjs.config.js` (new):** three named credential exports (`EMAILJS_SERVICE_ID`, `EMAILJS_TEMPLATE_ID`, `EMAILJS_PUBLIC_KEY`), empty by default, mirroring the named-constant convention of `src/data.jsx`. Public key is non-secret by design (D-04); empty values trigger the graceful-fallback error, not a crash.
- **`src/sendQuote.js` (new):** the sole place the outbound network call lives. Async `sendQuote(params)` defensively checks all three credentials and `throw new Error("EMAILJS_NOT_CONFIGURED")` when any is missing (T-03-04); otherwise calls `emailjs.send(...)`. It does not build params and never attaches a PDF (D-05).
- **`src/Studio3D.jsx` (modified):** imports `sendQuote`; adds `contactOpen`, controlled `name/email/phone/message`, `sendState`, `errorKind`, and a `nameInputRef`. `openContact`/`closeContact` mirror `openAR`/`closeAR`. Esc closes and the Nombre field autofocuses on open. Validation: name required after trim, email optional (`^\S+@\S+\.\S+$`), phone optional (≥8 digits after stripping spaces/`+`/`-`), submit enabled only when name valid AND (email valid OR phone valid). Submit handler trims/length-caps free-text fields (T-03-02), builds the config-summary params + `link: window.location.href` (D-05), and `await sendQuote` in try/catch — success → persistent confirmation panel; error → inline error block + `Reintentar`, branching on `EMAILJS_NOT_CONFIGURED` for the missing-credentials copy, with fields preserved. The CTA was rewired from `downloadDoc("presupuesto")` to `openContact` with label `Solicitar cotización →`. `downloadDoc` and the two `.dlbtn` buttons (Plan 01) were left untouched.
- **`styles/styles.css` (modified):** `.contact-modal__box` extends the `.ar-modal__box` tokens (`var(--bg-2)`, `var(--line-strong)`, `border-radius:16px`) sized `width:min(440px,94vw)` / `height:auto`; field labels 12px/700 uppercase; inputs on `var(--panel)` with `1px solid var(--line)`; error styling uses `var(--red)`, success uses neutral `var(--ink)` (no green). Overlay reuses `.ar-modal` as-is. Only weights 400/700; no new fonts or color tokens.

## ⚠️ Required user setup (end-to-end sending will NOT work until done)

The contact modal is fully wired, but EmailJS credentials ship empty by design. With them empty, submitting shows the graceful "el envío no está disponible… descargá el presupuesto en PDF" error (no crash). To enable real sending, the user MUST:

1. Create an EmailJS account, an Email Service, and an Email Template at https://dashboard.emailjs.com
2. Paste the real **Service ID**, **Template ID**, and **Public Key** into `src/emailjs.config.js`:
   - Service ID → Email Services → (your service)
   - Template ID → Email Templates → (your template)
   - Public Key → Account → General → API Keys
3. Build the matching EmailJS email template whose variables match the params sent by `sendQuote`:
   `name`, `email`, `phone`, `message`, `mueble`, `sala`, `linea`, `ancho`, `alto`, `profundidad`, `cuerpos`, `melamina`, `patas`, `total`, `link`

Until steps 1–3 are done, no email leaves the browser.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] CTA line numbers had shifted from the plan**
- **Found during:** Task 2
- **Issue:** The plan referenced the primary CTA at `src/Studio3D.jsx:713-715` with label `Solicitar →`. Plan 01's PDF-label edits had shifted it to lines 719-721 (the `.dlbtn` buttons now occupy 713-718).
- **Fix:** Matched and rewired the CTA by its exact text/`onClick` content rather than line number; verified `downloadDoc` and both `.dlbtn` buttons were untouched.
- **Files modified:** src/Studio3D.jsx
- **Commit:** a9a1c49

No other deviations — the plan executed as written.

## Authentication / Setup Gates

- **Task 0 (package-legitimacy checkpoint, blocking-human):** `@emailjs/browser` required explicit human verification as the official EmailJS SDK before install. The user confirmed it is legitimate and typed "approved"; Task 1 then installed `@emailjs/browser ^4.4.1`. This is normal gated flow, not a failure.

## Known Stubs

- `src/emailjs.config.js` ships three empty-string credentials. This is an **intentional, documented user-setup stub**, not a defect: the code degrades gracefully (typed `EMAILJS_NOT_CONFIGURED` error → clear in-modal message pointing to the PDF download) rather than crashing. The plan's `user_setup` block and the "Required user setup" section above own resolution. No future plan is required — the user supplies the credentials.

## Verification

- `npm run build` exits 0 after all three tasks (verified per-task and as the final gate).
- The sole outbound network call lives in `src/sendQuote.js` (`emailjs.send`); the rest of the app stays client-pure.
- `Solicitar cotización →` opens the modal instead of downloading; `downloadDoc` and the two `.dlbtn` buttons are untouched.
- With empty credentials, the submit path throws `EMAILJS_NOT_CONFIGURED` and the modal shows the missing-credentials error (degrade-to-PDF), no crash.
- The 3D/AR experience is untouched (only the action-bar CTA, the new modal, the two new modules, and CSS were added).

## Self-Check: PASSED

- FOUND: src/emailjs.config.js
- FOUND: src/sendQuote.js
- FOUND: commit 2e7e9ea (Task 1)
- FOUND: commit a9a1c49 (Task 2)
- FOUND: commit 1ac475c (Task 3)
