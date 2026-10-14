# P.Code

When P.Code is packaged for U.Cash, follow the [U.Cash release policy](/home/tot/projects/ucash-monobank-20261008/docs/canon/RELEASE-POLICY.md): the exact P.Code commit is part of one approved immutable artifact for all U.Cash clients. See [AGENTS.md](AGENTS.md).

P.Code is a standalone declarative interface engine. Applications describe an interface with an .SPL SetPlan; P.Code validates and compiles the static interface model, binds live data, and renders the resulting Object Plan.

**Former name:** `PlaneCode` (retained only in historical release records and compatibility-sensitive identifiers).

Current target release: 2.15.0

## Start here

- [Documentation index](docs/README.md)
- [Architecture](docs/ARCHITECTURE.md)
- [SPL reference](docs/SPL_REFERENCE.md)
- [Runtime reference](docs/RUNTIME_REFERENCE.md)
- [Browser Host adapter](docs/HOST_ADAPTER.md)
- [PLang / SetLang canon](docs/PLANG_CANON.md)
- [SetRender canon](docs/SET_RENDER_CANON.md)
- [2.11.0 release delta](docs/PLANE_CODE_2.11.0.md)
- [2.12.0 layout delta](docs/PLANE_CODE_2.12.0.md)
- [2.15.0 tilt parallax delta](docs/PLANE_CODE_2.15.0.md)

## Public runtime

Host code imports only PlaneCodeEngine from runtime/public-runtime.js. The frozen v1 flow is:

`host/browser-host.js` is an optional, product-neutral browser adapter for
SPL download, identity checks, caching, capability negotiation, and runtime
preparation. Hosts inject their P.Code engine and SPL parser. Data binding,
business actions, authentication, and navigation remain application-owned.

1. getDescriptor or connect with pcode.layout-group.v1 and serialization version 1; require `pcode.editable-input.v1` when editable controls are needed.
2. prepare complete SetLang, SetData, and SetRender envelopes, with optional top-level Resources v1 packaging.
3. mount a RuntimeHandle, attach an EventSink when event tokens exist, and enable interaction.
4. apply full SetData or SetRender replacements, then disable or dispose.
5. close the connection to drain all runtimes.

SetLang compiles once per RuntimeHandle. Hot SetData replacement does not reparse or recompile SetLang.

## Structure

P.Code has exactly three physical panel layers: BasePanel, SimplePanel, and ActivePanel. AggregateActivePanel is a special ActivePanel, not a fourth layer. Ordered recursive Group/Layout structure stays inside SetLang. Visible text and PNG pictures are emitted through Container objects.

## Repository layout

- release/: complete Set envelopes used by the client screen
- runtime/: public boundary, internal lifecycle, compiler, validators, and renderer
- host/: optional browser adapter for applications using the public boundary
- tests/: Public Runtime API contract tests
- plans/: example .SPL SetPlans
- docs/: current reference, canons, and release history
- web/: browser/PWA integration and packaged PNG assets
- editor/: working Theme/Skin authoring surface for the target generation

The Theme/Skin Editor is an authoring workflow over the same contracts. It does not change production runtime immutability or the Host-facing boundary.

## Editable input example

See [examples/editable-input.js](examples/editable-input.js) for capability negotiation, editable SetLang/SetData, value-bearing events, and submission without a DOM overlay outside P.Code.

### Semantic accessibility (2.23)

`pcode.semantic-accessibility.v1` adds SPL `PressedSource` (boolean model path)
for `aria-pressed` and `LabelSource` with optional `LabelTemplate` for an
accessible name. Both use the existing semantic model; templates interpolate
scalar fields as text. Model patches update existing controls, including
repeated controls, without application DOM writes. `EnabledSource` continues
to control whether a semantic action may be emitted. These attributes do not
introduce product permissions or actions into the renderer.

`pcode.decimal-unit-layout.v1` allows Decimal `Format.UnitPlacement = "Outside"`
to render the unit after the number body, with a separate intervening text
space. Default placement remains inside. This applies to composite formats too;
SPL owns the typography of number, fraction and unit. Values are not changed.

### Skin-local format libraries and vectors (2.24)

`pcode.format-library.v1` allows `SetLang.Formats { Name { Kind = ... } }`.
A source container references a declaration with `FormatRef = "Name"`. Picot
resolves references once before validation and compilation; shared definitions
are immutable and local to that skin. Unknown names, inline overrides and
missing capability negotiation fail preparation. Models cannot supply formats.

`pcode.vector.v1` adds a static `Vector` declaration to a Container. `ViewBox`,
`Fill`, `Stroke`, `StrokeWidth`, `LineCap`, `LineJoin` and named `Elements`
(`Shape = "Path"` with `D`, or `Shape = "Circle"` with `CX`, `CY`, `R`)
produce native SVG nodes without parsing markup. Colors can reference skin CSS
variables. Scripts, events, remote resources and arbitrary SVG attributes are
not accepted. Vectors neither inspect application entities nor perform commands.

Semantic `VisibleSource` now enforces hidden state with an inline important
rule, so a skin's important display rule cannot expose an unavailable component.

`pcode.panel-composition.v1` enables nested SimplePanels (depth bounded to 32),
repeated SimplePanels with semantic item identity inherited by their actions,
and SPL `Sequence { Source, Key, Part }`. Sequence reads an ordered list of
semantic identifiers; its grouping into visual pieces remains authored in SPL.
Missing keys clear the visual order; duplicate identities fail validation.

NativeButton may declare static `Text` instead of a child Layout. This preserves
native text layout and avoids decorative DOM for plain action labels. Field
Groups may bind `VisibleSource`, so captions and inputs share one visibility
owner. Model-only updates apply native enabled/read-only/error state even when
the input value still uses a SetData slot; they do not overwrite unsaved text.
