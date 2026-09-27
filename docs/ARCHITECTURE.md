# P.Code architecture

Status: P.Code 2.11.0 release candidate.

## Contracts

P.Code keeps its responsibilities separate:

- **PLang / SetLang** describes concrete interface objects, hierarchy, layout, geometry, and object-specific visual properties.
- **SetData** supplies live visible/application values to addressable slots.
- **SetRender** describes only the global scene/render environment.
- **Renderer** consumes the compiled Object Plan plus SetData and SetRender; it does not define PLang semantics.
- Optional top-level **Resources** packages portable font and PNG bytes for an SPL. Resources is not a Set object.

A `.SPL` SetPlan still contains exactly three independent Set objects: SetLang, SetData, and SetRender. Optional Resources does not merge or replace those contracts.

## Set object envelope

Every Set is a first-class system object with peer properties:

```text
SetLang   = { Name, Version, Data }
SetData   = { Name, Version, Data }
SetRender = { Name, Version, Data }
```

`Data` is the payload. `Name` and `Version` describe the Set object and are not fields inside that payload.

## Generation and physical hierarchy

The 2.11.0 runtime descriptor is:

```text
ComponentVersion = 2.11.0
GenerationId = pcode.layout-group.v1
SupportedSerializationVersions = [1]
Capabilities = [pcode.editable-input.v1]
```

There are exactly three physical panel layers:

```text
BasePanel -> SimplePanel -> ActivePanel
```

`AggregateActivePanel` is a special ActivePanel on the Active physical layer, not a fourth layer.

The current authored SetLang shape is:

```text
BasePanel
├── Properties
├── Layout[]
└── SimplePanels[]

SimplePanel
├── Properties
│   └── AggregateActivePanels [0..1]
├── Layout[]
└── ActivePanels[]

ActivePanel / AggregateActivePanel
├── Properties
└── Layout[]
```

`Layout[]` preserves authored order. It may contain Container and recursive invisible Group nodes. When the optional `pcode.editable-input.v1` capability is negotiated, EditableInput may also appear in Layout. None of these create another physical panel layer.

Legacy typed `Containers[]` input remains accepted by the current compatibility layer, but new authored 2.11.0 SetLang uses ordered `Layout[]`.

## Runtime lifecycle

```text
SetLang.Data -> validate -> compile once -> immutable Object Plan
SetData.Data -> live values -> patch without recompiling SetLang
SetRender.Data -> global scene values -> Renderer
Resources? -> validated portable bytes -> Renderer
```

SetLang stays out of the hot SetData update path. Structural or object-property changes require a new compiled Object Plan / RuntimeHandle.

## Resources v1

Resources is optional top-level packaging, not a fourth Set:

- `Resources.Fonts`: 0..2 WOFF2 resources with base64 payload.
- `Resources.Pictures`: 0..N PNG resources with base64 payload.
- `Container.Font = "<name>"` references a packaged font.
- `SourcePicture = "res:<name>"` references a packaged PNG.
- Missing references are validation errors; no silent fallback is allowed.
- SPL without Resources remains valid.

## Ownership test

```text
property of one concrete interface object -> SetLang
live visible/application value             -> SetData
global scene/render value                  -> SetRender
portable font/PNG bytes                    -> Resources
not defined by the contract                -> NOT YET SPECIFIED
```

Do not create an intermediate visual contract between these responsibilities.

## Compatibility inside one engine generation

The structural grammar is fixed for one P.Code engine generation. A structural change belongs to a different GenerationId rather than being smuggled in as a property extension.

The 2.11.0 `pcode.layout-group.v1` generation is therefore a legitimate generation transition from the older mainline 2.9.1 typed-container generation. That transition does not erase the accepted ownership boundaries above.

## Identity and visible content

`Login` is identity only and is never rendered by itself. SetData addresses Containers by Container Login. Visible text and pictures come from their data sources. Group has no Login and no SetData slot.

## Current implementation boundary

Host code uses only `runtime/public-runtime.js`. The browser integration consumes that boundary; `runtime/public-runtime-core.js` remains an internal implementation/test seam. Client navigation, pull-to-refresh, and service-worker wiring remain integration concerns outside PLang.

P.Code contains no Cash-specific business semantics.
