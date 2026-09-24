# PLang Canon

Status: CURRENT

PLang is the declarative language inside PlaneCode.

PLang defines interface entities, their identity and their structural relations. It does not define visual appearance, geometry, motion, colors, borders, typography, parallax or renderer layout rules.

## Canonical hierarchy

```text
BasePanel
└── SimplePanel
    ├── AggregateActivePanel
    │   └── Container
    └── ActivePanel
        └── Container
```

No Row, Column, Card, Section or renderer-specific entity type is part of PLang.

Every PLang entity has a required unique `Login`.

`Login` is stable identity. It is never visible content and is never rendered by itself. Other PlaneCode subsystems may reference that identity, but their rules do not become PLang rules.

## AggregateActivePanel

AggregateActivePanel is a child of SimplePanel and may contain Container. It represents an aggregate action or aggregate state of its parent SimplePanel, while ActivePanel represents an individual item within that SimplePanel. ActivePanel and AggregateActivePanel expose the same two event properties:

```text
OnPress
OffPress
```

When an event property exists but its value has not yet been defined, its canonical value is `NOT_YET_SPECIFIED`. Procedure binding and business-action semantics remain NOT YET SPECIFIED. AggregateActivePanel and ActivePanel share the same visual/render behavior and the same visual property capabilities. They may differ only in placement and dimensions. This parity does not merge their PLang roles or hierarchy.

No additional AggregateActivePanel properties are specified.

## Container

Visible content is emitted only through Container. Container may resolve independent data sources through SetData:

```text
SourceText
SourcePicture
```

An absent source does not participate and reserves no space.

One present source is centered.

When both are present:

```text
Orientation = Positive
Picture → Text

Orientation = Negative
Text → Picture
```

`Container.Font` exists; its exact grammar remains NOT YET SPECIFIED.

## SourcePicture

SourcePicture references a PNG file only. Intrinsic PNG alpha is preserved.

This canon intentionally contains no SetRender properties.


## SetLang serialization in SPL

Inside a `.SPL` SetLang block, PLang uses nested entity blocks. Nesting is the structural parent-child relation; no duplicate Parent/Child property is required. Properties use `Name = Value` syntax. Strings are quoted. `NOT_YET_SPECIFIED` is the canonical token for an existing property whose value is not yet defined.
