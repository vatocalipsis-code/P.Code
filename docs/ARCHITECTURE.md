# PlaneCode architecture

## Contracts

PlaneCode keeps four responsibilities separate:

- **PLang / SetLang** describes concrete interface objects and their object-specific properties.
- **SetData** supplies live visible values to Containers.
- **SetRender** describes only the global scene/render environment.
- **Renderer** consumes the compiled Object Plan plus SetData and SetRender. It does not define PLang semantics.

A `.SPL` SetPlan packages the three Set objects without merging their responsibilities.

## Set object envelope

Every Set is a first-class system object with peer properties:

```text
SetLang   = { Name, Version, Data }
SetData   = { Name, Version, Data }
SetRender = { Name, Version, Data }
```

`Data` is the payload. `Name` and `Version` describe the Set object and are not fields inside that payload.

## Three physical panel layers

There are exactly three physical panel layers in the current PlaneCode generation:

```text
BasePanel -> SimplePanel -> ActivePanel
```

The typed SetLang shape is:

```text
BasePanel
├── Properties
├── Containers
└── SimplePanels

SimplePanel
├── Properties
│   └── AggregateActivePanels [0..1]
├── Containers
└── ActivePanels

ActivePanel
├── Properties
└── Containers
```

`AggregateActivePanel` is a special ActivePanel owned by a SimplePanel. It occupies the same physical Active layer as ordinary ActivePanels and does not create a fourth layer.

A Container may live directly on BasePanel, SimplePanel, ActivePanel, or AggregateActivePanel through the corresponding typed `Containers` collection.

## Runtime lifecycle

```text
SetLang.Data -> validate -> compile once -> immutable Object Plan
SetData.Data -> live Container values -> patch without recompiling SetLang
SetRender.Data -> global scene values -> Renderer
```

SetLang is intentionally kept out of the hot SetData update path.

## Ownership test

```text
property of one concrete interface object -> SetLang
live visible value                        -> SetData
global scene/render value                 -> SetRender
not defined by the contract               -> NOT YET SPECIFIED
```

Do not create an intermediate `Visual` layer. Object properties live in the typed `Properties` block of their SetLang object.

## Compatibility inside one engine generation

The structural grammar is fixed for one PlaneCode engine generation. Properties may evolve independently.

```text
known property   -> apply it
missing property -> inherit / use its defined default
unknown property -> ignore it
```

A new structural object type is not a property extension. It belongs to a new PlaneCode engine generation.

## Identity and visible content

`Login` is identity only and is never rendered by itself. SetData addresses Containers by `Container.Login`. Visible content is emitted through `SourceText` and `SourcePicture`.

## Current implementation boundary

The current browser integration compiles SetLang before rendering and then patches SetData directly into bound Container slots. The current parallax input is pointer movement. Device-orientation input for iPhone tilt is not implemented in 2.9.0.
