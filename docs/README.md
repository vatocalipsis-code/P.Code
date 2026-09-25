# P.Code documentation

This directory separates current reference from historical release notes.

## Current reference

| Document | Purpose |
| --- | --- |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System boundaries, data flow, ownership, and three-layer model |
| [SPL_REFERENCE.md](SPL_REFERENCE.md) | SetPlan / .SPL syntax and typed SetLang structure |
| [RUNTIME_REFERENCE.md](RUNTIME_REFERENCE.md) | Public Runtime API, lifecycle, validation, events, PNG path, and browser integration |
| [PLANG_CANON.md](PLANG_CANON.md) | PLang and SetLang canonical semantics |
| [SET_RENDER_CANON.md](SET_RENDER_CANON.md) | Scene-only SetRender contract |
| [PLANE_CODE_2.10.0.md](PLANE_CODE_2.10.0.md) | Target-generation release delta |

## Historical notes

Files named PLANE_CODE_<version>.md below 2.10.0 are release history. Earlier documents may describe structures later superseded. When they conflict with current reference, current reference and current source win.

## Source map

- runtime/public-runtime.js: the only Host-facing P.Code runtime boundary
- runtime/public-runtime-core.js: internal lifecycle implementation and test seam
- runtime/setlang-compiler.js: typed SetLang to immutable Object Plan
- runtime/validator.js: Set envelopes, SetLang, SetData, and SetRender validation
- runtime/web-renderer.js: browser rendering, interaction, and live SetData patching
- web/main.js: client/PWA integration through Public Runtime API v1
- release/: released complete Set envelopes
