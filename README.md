# P.Code

P.Code is a standalone declarative interface engine. Applications describe an interface with an `.SPL` SetPlan; P.Code validates and compiles the static interface model, binds live data, and renders the resulting Object Plan.

**Former name:** `PlaneCode` (retained only in historical release records and compatibility-sensitive identifiers).

**Current release:** `2.9.1`

## Start here

- [Documentation index](docs/README.md)
- [Architecture](docs/ARCHITECTURE.md)
- [SPL reference](docs/SPL_REFERENCE.md)
- [Runtime reference](docs/RUNTIME_REFERENCE.md)
- [PLang / SetLang canon](docs/PLANG_CANON.md)
- [SetRender canon](docs/SET_RENDER_CANON.md)
- [2.9.1 release contract](docs/PLANE_CODE_2.9.1.md)
- [Example SetPlan](plans/example%20render.SPL)

## Runtime at a glance

```text
SetLang.Data --validate--> compile once --> immutable Object Plan --┐
SetData.Data ----------------------------------------------live-----> Renderer
SetRender.Data --------------------------------------------scene---> Renderer
```

P.Code has exactly three physical panel layers:

```text
BasePanel -> SimplePanel -> ActivePanel
```

`AggregateActivePanel` is a special ActivePanel on the Active layer, not a fourth layer. Visible text and pictures are emitted through `Container` objects.

## Repository layout

```text
release/   Released Set objects used by the working web build
runtime/   Compiler, validators, renderer, and runtime helpers
plans/     Example .SPL SetPlans
docs/      Current reference, canons, and historical release notes
web/       Browser/PWA entry point and service worker
```

## Run

The released browser build is served as a static web application (including GitHub Pages). `web/main.js` is the current integration entry point.

## Documentation rule

Current behavior is described by the reference documents above and by comments beside the implementation. Historical `PLANE_CODE_*.md` files record earlier releases; they are not a substitute for the current reference.
