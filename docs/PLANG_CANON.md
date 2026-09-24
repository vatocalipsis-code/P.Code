# PLang Canon

Status: CURRENT

PLang is the declarative language inside PlaneCode.

PLang defines interface entities, their identity and their structural relations. It does not define visual appearance, geometry, motion, colors, borders, typography, parallax or renderer layout rules.

## Canonical hierarchy

```text
BasePanel
└── SimplePanel
    └── ActivePanel
        └── Container
```

No Row, Column, Card, Section or renderer-specific entity type is part of PLang.

Every PLang entity has a required unique `Login`.

`Login` is stable identity. Other PlaneCode subsystems may reference that identity, but their rules do not become PLang rules.

## Container

Container may resolve independent data sources through SetData:

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
