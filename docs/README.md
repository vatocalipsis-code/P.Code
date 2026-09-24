# PlaneCode documentation

This directory separates **current reference** from **historical release notes**.

## Current reference

| Document | Purpose |
| --- | --- |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System boundaries, data flow, ownership, and three-layer model |
| [SPL_REFERENCE.md](SPL_REFERENCE.md) | SetPlan / .SPL syntax and typed SetLang structure |
| [RUNTIME_REFERENCE.md](RUNTIME_REFERENCE.md) | Validation, compilation, rendering, live SetData patching, parallax |
| [PLANG_CANON.md](PLANG_CANON.md) | PLang and SetLang canonical semantics |
| [SET_RENDER_CANON.md](SET_RENDER_CANON.md) | Scene-only SetRender contract |
| [PLANE_CODE_2.9.1.md](PLANE_CODE_2.9.1.md) | Current release delta |

## Historical notes

Files named `PLANE_CODE_<version>.md` below 2.9.1 are release history. Earlier documents may describe structures that were later superseded. When they conflict with the current reference, the current reference and current source win.

## Source map

```text
runtime/setlang-compiler.js  typed SetLang -> immutable Object Plan
runtime/validator.js         SetLang / SetData / SetRender validation
runtime/web-renderer.js      browser rendering + live data patching
runtime/compositor.js        earlier composition utility; not used by current web entry point
runtime/render-bindings.js   integration placeholder
web/main.js                  current browser/PWA wiring
release/set-lang.js          released SetLang object
release/set-data.js          released SetData object
release/set-render.js        released SetRender object
```
