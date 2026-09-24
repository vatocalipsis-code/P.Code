# Runtime reference

## Current browser pipeline

`web/main.js` wires the current release as follows:

```text
release Set objects
      |
      v
validatePLang + validateSetRender
      |
      v
compileSetLang(SetLang.Data)
      |
      v
immutable Object Plan
      |
      + SetData.Data + SetRender.Data
      v
renderPlaneCode(...)
```

## SetLang compiler

`runtime/setlang-compiler.js` converts the typed SetLang model into the internal immutable Object Plan. The internal plan may use `children` for fast rendering; this does not make `children` part of SetLang or SPL grammar.

The compiler also turns a Container Login into its runtime `dataSlot`.

## Validation

`runtime/validator.js` validates unique Logins, typed panel arrays, AggregateActivePanels cardinality 0..1, known property value shapes, SetData references, and SetRender's scene-only boundary.

Validation does not transfer semantics between the three Sets.

## Rendering

`runtime/web-renderer.js` renders the Object Plan into DOM nodes. It reads object rules from the compiled plan, visible values from SetData, and scene defaults from SetRender.

### Live SetData updates

`patchSetData(...)` replaces only the visible content of already-bound Container slots. It does not re-read or recompile SetLang.

### Parallax

The renderer resolves parallax in this order:

```text
object Properties.Parallax
        -> otherwise SetRender.Data.Parallax
        -> otherwise 0
```

In 2.9.0 the browser input is `pointermove`, normalized to the render root and applied with `requestAnimationFrame`. iPhone device-orientation input is not implemented yet.

## Current integration entry point

`web/main.js` is the authoritative browser wiring for 2.9.0. It also owns the current PWA service-worker registration, horizontal BasePanel navigation, and pull-to-refresh behavior.

## Earlier utilities

`runtime/compositor.js` represents an earlier composition path and is not imported by the current `web/main.js`. Do not infer the current SetLang grammar from its generic `children` traversal.

`runtime/render-bindings.js` is currently a no-op integration placeholder.
