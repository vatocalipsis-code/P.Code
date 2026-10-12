# SPL value formatting and control feedback

Runtime capability additions in 2.19.0:

- `pcode.composite-format.v1`: text maps, conditional composite parts, trimmed fractions, and decimal text input.
- `pcode.control-feedback.v1`: a single SPL-authored control-feedback scene per runtime.

## Semantic values

Application values remain JSON. A decimal quantity is `{units: string, scale: integer, precision?: integer, unit?: string}`. Decimal strings are accepted by `Kind = "Decimal"` and converted with string operations and BigInt. No stored value is rounded or mutated. Formatting controls presentation only.

`Format.Kind = "Composite"` takes an ordered `Parts` map. Each part is either `{Text: string}` or `{Source: semanticPath, Format: ...}`. `@.` addresses the composite's source value; `$.` addresses the complete model. Nested composites establish their own local value. A part may use `When` with a boolean path, `When` with `Equals` for scalar equality, or `Unless` with a boolean path. Composites are bounded to 64 parts per level and eight nested levels.

Text maps translate opaque scalar values into authored labels/glyphs. `Fallback`, `Prefix`, and `Suffix` belong to SPL. DateTime options and locale belong to SPL. DateTime formatters share a bounded cache of 64 instances.

Adjacent text segments are coalesced before DOM creation. This preserves glyph shaping and subpixel spacing when formatted numbers are interleaved with text. Numeric markup exposes `data-plane-number`, whole/fraction/unit, and sign attributes; SPL controls their typography. Nothing in these APIs depends on a particular product or financial lifecycle.

## Feedback scene

A BasePanel may declare `Properties.Feedback`:

```
Feedback {
  Scope = "Document"
  Target = "button,[role=button]"
  KeyboardExclude = "input,textarea,select,[contenteditable]"
  PressedClass = "pressed"
  HaloClass = "tap-halo"
  MinWidth = 72
  MinHeight = 40
  ReleaseDelay = 150
  HaloTimeout = 450
}
```

`Scope` is `Root` or `Document`. Document scope supports applications containing detached overlays while their migration is in progress; it does not grant those overlays architectural acceptance. Only the active runtime reacts. CSS, class names, dimensions, selectors, and durations come from SPL. The scene never emits domain commands.

The renderer owns listeners, pressed-state lifetime, halo creation, measured bounds, reduced-motion handling, and disposal. Disabling interaction cancels outstanding feedback. Replacing/disposal of a runtime aborts listeners, clears timers, and removes transient nodes. Declaration multiplicity and capability negotiation are validated before mounting.
