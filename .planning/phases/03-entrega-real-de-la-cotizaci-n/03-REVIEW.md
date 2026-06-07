---
phase: 03-entrega-real-de-la-cotizaci-n
reviewed: 2026-06-07T00:00:00Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - src/Studio3D.jsx
  - src/emailjs.config.js
  - src/sendQuote.js
  - styles/styles.css
  - package.json
findings:
  critical: 1
  warning: 3
  info: 2
  total: 6
status: resolved
resolved_at: 2026-06-07
resolved_findings: [CR-01, WR-01, WR-02, WR-03, IN-01, IN-02]
---

# Phase 03: Code Review Report

**Reviewed:** 2026-06-07
**Depth:** standard
**Files Reviewed:** 5
**Status:** resolved (all 6 findings applied 2026-06-07; `npm run build` exits 0)

## Summary

Phase 3 delivers the EmailJS quote-send flow, a contact modal with a four-state machine
(idle/sending/success/error), and a rewritten `downloadDoc` that lazy-loads `html2pdf.js`.
The overall architecture is sound: credential guard in `sendQuote.js` degrades cleanly,
the modal state machine is correct, and the PDF path handles failure without crashing.

One real crash path exists in `downloadDoc`: `leg.name` and `line.name` are dereferenced
before the `try` block, so a stale URL with an unknown `legId` or `lineId` will throw an
unhandled `TypeError` that propagates to the caller, bypassing the error-swallowing `catch`.
Three warnings cover a stale-closure lint hazard, dual-send on button double-click, and
form data surviving across modal open/close cycles (unintended persist-on-success). Two
info items flag a `console.error` left in production and the redundant double-replace in
phone validation.

---

## Critical Issues

### CR-01: Unhandled `TypeError` in `downloadDoc` when `leg` or `line` is `undefined`

**File:** `src/Studio3D.jsx:612,619`

**Issue:** `leg` and `line` are resolved via `.find()` on lines 583–584, but their `.name`
and `.spec` properties are accessed inside the template literal (lines 612 and 619) which is
**outside** the `try` block that starts at line 626. If a URL-deserialized `legId` or
`lineId` ever fails to match the catalog (e.g., a stale link after a data rename), the
expression throws a `TypeError: Cannot read properties of undefined (reading 'name')`. That
exception is uncaught — the `catch` at line 637 only covers the `await import(...)` / PDF
path. The Studio page effectively crashes for the user with no fallback message.

Currently `legId` is initialised to `"sin"` (always in `LEGS`) and `lineId` to `"BASE"`
(always in `LINES`), so the crash does not trigger in normal use. The risk activates if
either catalog is ever extended/renamed while old share-links still circulate, or if any
future URL-read path injects an unvalidated value.

**Fix:** Add null guards before the template literal, or wrap the entire HTML-building block
inside the `try`. The simplest one-liner guards:

```js
async function downloadDoc(kind) {
  const leg  = LEGS.find((l) => l.id === legId)  ?? LEGS[0];   // fallback to first leg
  const line = LINES.find((l) => l.id === lineId) ?? LINES[0]; // fallback to first line
  // ... rest of function unchanged
```

Alternatively, move the entire block from line 583 through line 625 inside the existing
`try` so the `catch` swallows the crash and logs it instead of propagating.

---

## Warnings

### WR-01: Stale closure — `closeContact` missing from `useEffect` dependency array

**File:** `src/Studio3D.jsx:521-533`

**Issue:** The `useEffect` that registers the `Escape` key handler captures `closeContact`
via closure, but `closeContact` is not listed in the dependency array `[contactOpen]`. React
linting rules (`react-hooks/exhaustive-deps`) will flag this. In practice the effect still
works correctly today because `closeContact` only calls stable `setState` setters — but the
pattern is fragile: if `closeContact` is ever modified to read props or other state, the
stale closure will silently use the old value.

**Fix:** Either memoize `closeContact` with `useCallback` and add it to the deps array, or
inline the close logic directly in the effect:

```js
useEffect(() => {
  if (!contactOpen) return undefined;
  const t = setTimeout(() => nameInputRef.current?.focus(), 0);
  const onKey = (e) => {
    if (e.key === "Escape") {
      setContactOpen(false);
      setSendState("idle");
    }
  };
  window.addEventListener("keydown", onKey);
  return () => { clearTimeout(t); window.removeEventListener("keydown", onKey); };
}, [contactOpen]);
```

---

### WR-02: PDF download buttons have no loading/disabled state — double-click fires two concurrent pdf jobs

**File:** `src/Studio3D.jsx:797-801`

**Issue:** `downloadDoc` is an `async` function but the two `.dlbtn` buttons (`↓ Descargar
ficha técnica (PDF)` and `↓ Descargar presupuesto (PDF)`) are never disabled during
execution. A fast double-click (or impatient user on slow hardware) will launch two
concurrent `html2pdf.js` jobs, each appending a hidden overlay to `document.body` and
triggering separate download dialogs. This does not crash the app but produces duplicate
file-save prompts and wastes memory.

**Fix:** Track a loading boolean per button (or a single `dlLoading` flag), disable both
buttons while any PDF job runs, and re-enable in a `finally` block:

```js
const [dlLoading, setDlLoading] = useState(false);

async function downloadDoc(kind) {
  if (dlLoading) return;
  setDlLoading(true);
  try {
    // ... existing body
  } catch (err) {
    console.error("downloadDoc: PDF generation failed", err);
  } finally {
    setDlLoading(false);
  }
}
// In JSX:
<button className="dlbtn" onClick={() => downloadDoc("tecnico")} disabled={dlLoading}>
```

---

### WR-03: Contact form fields are not cleared after a successful send — stale data on re-open

**File:** `src/Studio3D.jsx:512-519`

**Issue:** `openContact()` resets `sendState` to `"idle"` but does not clear `cName`,
`cEmail`, `cPhone`, or `cMessage`. After a successful submission the user sees the
"Cotización enviada" screen, closes the modal, then potentially reopens it. The form
re-appears pre-filled with the previous submission's data. For a multi-user or kiosk-like
context (e.g., a showroom tablet) this leaks one visitor's contact details into the next
session's form view.

Even in a personal-use scenario the UX is confusing: pressing "Solicitar cotización →" again
after a success should feel like a fresh form.

**Fix:** Reset the four field states in `openContact` (or in `closeContact` after success):

```js
function openContact() {
  setSendState("idle");
  setCName("");
  setCEmail("");
  setCPhone("");
  setCMessage("");
  setContactOpen(true);
}
```

---

## Info

### IN-01: `console.error` left in production path of `downloadDoc`

**File:** `src/Studio3D.jsx:639`

**Issue:** `console.error("downloadDoc: PDF generation failed", err)` is intentional debug
output that will appear in production browser consoles. While not harmful, it reveals
internal implementation details and violates the project's no-debug-artifacts convention.
Consider removing or gating behind a dev-mode flag.

**Fix:** Remove the log, or conditionally log only in development:

```js
if (import.meta.env.DEV) console.error("downloadDoc: PDF generation failed", err);
```

---

### IN-02: Redundant double-replace in phone validation

**File:** `src/Studio3D.jsx:538`

**Issue:**
```js
const phoneDigits = cPhone.replace(/[\s+\-]/g, "").replace(/\D/g, "");
```
The first replace removes spaces, `+`, and `-`. The second removes all remaining non-digits.
The second replace is a superset of the first — the first replace is entirely redundant.
This is a logic smell that could confuse a future maintainer about the intended validation
strategy.

**Fix:** Use the single superset replace:

```js
const phoneDigits = cPhone.replace(/\D/g, "");
```

---

_Reviewed: 2026-06-07_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
