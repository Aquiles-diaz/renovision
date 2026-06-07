---
phase: 03-entrega-real-de-la-cotizaci-n
plan: 01
subsystem: cotizador / document delivery
tags: [pdf, html2pdf, downloads, ux-copy]
requires:
  - "src/Studio3D.jsx downloadDoc (existing HTML document builder)"
provides:
  - "Real client-side PDF download for ficha técnica and presupuesto"
  - "Honest download-button labels naming the (PDF) output"
affects:
  - "src/Studio3D.jsx (downloadDoc + action-bar labels)"
  - "package.json / package-lock.json (html2pdf.js dependency)"
tech-stack:
  added:
    - "html2pdf.js ^0.14.0 (dynamic-imported, own bundle chunk)"
  patterns:
    - "Dynamic import() inside handler to keep heavy lib out of initial bundle"
    - "try/catch + console.error so a side-effect failure never freezes the UI"
key-files:
  created: []
  modified:
    - "src/Studio3D.jsx"
    - "package.json"
    - "package-lock.json"
decisions:
  - "D-01: reuse existing document HTML/CSS verbatim; only the output tail changed"
  - "D-02: filenames now use .pdf extension"
  - "D-03: html2pdf.js dynamic-imported so the 3D/cotizador initial load is not penalized"
  - "D-08: button copy now honestly describes the PDF download"
metrics:
  duration: "~3 min"
  completed: "2026-06-07"
  tasks: 3
  files: 3
requirements: [QUOTE-01, QUOTE-03]
---

# Phase 3 Plan 01: Real PDF delivery + honest download labels Summary

Both document-download buttons now generate a real client-side PDF via a lazily-loaded `html2pdf.js`, reusing the existing document markup verbatim, and the button copy honestly says "Descargar … (PDF)". Closes QUOTE-01 and the download-button half of QUOTE-03.

## What Was Built

- **Task 1 — html2pdf.js dependency.** Installed `html2pdf.js ^0.14.0` as a runtime dependency via `npm install` (package.json + package-lock.json updated). Declared so it can be dynamic-imported.
- **Task 2 — real PDF generation.** Rewrote `downloadDoc(kind)` (`src/Studio3D.jsx`) into an `async` function. The entire document HTML/CSS string is kept verbatim (D-01). The old `text/html` `Blob` + `createObjectURL` + `<a download=...html>` + `setTimeout(revokeObjectURL, 4000)` tail was removed entirely. New tail: `const { default: html2pdf } = await import("html2pdf.js")`, build a detached `<div>`, set its `innerHTML` to the same `html` string, then `await html2pdf().set({ filename: ...".pdf" }).from(holder).save()`. Filename uses `.pdf` (D-02). Wrapped in `try/catch` with `console.error` on failure so a PDF error never freezes the button or crashes the Studio.
- **Task 3 — honest labels.** The two `.dlbtn` buttons now read `↓ Descargar ficha técnica (PDF)` and `↓ Descargar presupuesto (PDF)` (D-08). Wiring (`onClick`/`dlbtn` class) unchanged. The `.btn--red` "Solicitar →" CTA was left untouched (Plan 02's scope).

## Verification

- `npm run build` exits 0 after every task.
- Build output confirms html2pdf is code-split into its own chunk (`assets/html2pdf-*.js`, ~982 kB) and is NOT in the initial `index-*.js` bundle (~1.13 MB, unchanged from before) — satisfies D-03 / the must-have "html2pdf.js is not in the initial bundle".
- No `text/html` Blob or `.html` filename remains in `downloadDoc`.
- 3D/AR code paths untouched — only `downloadDoc` and two button labels changed.

## Deviations from Plan

None — plan executed exactly as written.

## Commits

- `24f6656` chore(03-01): add html2pdf.js dependency
- `0b4f720` feat(03-01): downloadDoc emits real PDF via lazy html2pdf
- `50ed5ed` feat(03-01): honest PDF labels on download buttons

## Known Stubs

None. No placeholder/empty-data stubs introduced.

## Self-Check: PASSED

- FOUND: src/Studio3D.jsx contains `await import("html2pdf.js")` and `.pdf` filename
- FOUND: package.json dependency `html2pdf.js ^0.14.0`
- FOUND: commits 24f6656, 0b4f720, 50ed5ed
- CONFIRMED: no `new Blob([html]` / `.html` download remains in downloadDoc
