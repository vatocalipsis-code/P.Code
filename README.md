# P.Code

P.Code is a standalone declarative interface engine. Applications describe an interface with an .SPL SetPlan; P.Code validates and compiles the static interface model, binds live data, and renders the resulting Object Plan.

Current target release: 2.11.0

## Start here

- [Documentation index](docs/README.md)
- [Architecture](docs/ARCHITECTURE.md)
- [SPL reference](docs/SPL_REFERENCE.md)
- [Runtime reference](docs/RUNTIME_REFERENCE.md)
- [PLang / SetLang canon](docs/PLANG_CANON.md)
- [SetRender canon](docs/SET_RENDER_CANON.md)
- [2.11.0 release delta](docs/PLANE_CODE_2.11.0.md)

## Public runtime

Host code imports only PlaneCodeEngine from runtime/public-runtime.js. The frozen v1 flow is:

1. getDescriptor or connect with pcode.layout-group.v1 and serialization version 1; require `pcode.editable-input.v1` when editable controls are needed.
2. prepare complete SetLang, SetData, and SetRender envelopes.
3. mount a RuntimeHandle, attach an EventSink when event tokens exist, and enable interaction.
4. apply full SetData or SetRender replacements, then disable or dispose.
5. close the connection to drain all runtimes.

SetLang compiles once per RuntimeHandle. Hot SetData replacement does not reparse or recompile SetLang.

## Structure

P.Code has exactly three physical panel layers: BasePanel, SimplePanel, and ActivePanel. AggregateActivePanel is a special ActivePanel, not a fourth layer. Ordered recursive Group/Layout structure stays inside SetLang. Visible text and PNG pictures are emitted through Container objects.

## Repository layout

- release/: complete Set envelopes used by the client screen
- runtime/: public boundary, internal lifecycle, compiler, validators, and renderer
- tests/: Public Runtime API contract tests
- plans/: example .SPL SetPlans
- docs/: current reference, canons, and release history
- web/: browser/PWA integration and packaged PNG assets
- editor/: preserved experimental authoring surface for the target generation

The feature editor is preserved as a separate authoring workflow. It does not change production runtime immutability or the Host-facing boundary.

## Editable input example

See [examples/editable-input.js](examples/editable-input.js) for capability negotiation, editable SetLang/SetData, value-bearing events, and submission without a DOM overlay outside P.Code.
