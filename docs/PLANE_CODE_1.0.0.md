# PlaneCode 1.0.0

Status: RELEASED / CURRENT

PlaneCode 1.0.0 is the released working state of the PlaneCode visual and tactile interface runtime.

## Current structure

```text
BasePanel
└── SimplePanel
    └── ActivePanel
        └── Container
```

The implementation supports one or more root `BasePanel` surfaces.

Every element may have an `id`.

## Entity names

Every PlaneCode entity has a `Name` property.

`Name` identifies the concrete entity in the application model. It does not create a new PlaneCode entity type.

Examples:

```text
SimplePanel.Name = Operations
ActivePanel.Name = AllOperations
Container.Name = CashboxAmount
```

## Container properties

A `Container` has the common entity property `Name` and may additionally define content-source and rendering properties.

Canonical Container properties currently identified:

```text
Container.Name
Container.sourceText
Container.sourcePicture
Container.Orientation
Container.Font
```

A Container may carry text, a picture, or both at the same time.

`Container.Type` is removed because content kind is already expressed by the presence of `sourceText` and/or `sourcePicture`.

`Container.Orientation` controls which source is placed first when both are present:

```text
Container.Orientation = Positive
Picture → Text

Container.Orientation = Negative
Text → Picture
```

Examples:

```text
Container.Name = CashboxSummary
Container.sourceText = "87 200.00"
Container.sourcePicture = Picture
Container.Orientation = Positive
```

renders the picture first and the text after it.

```text
Container.Name = CashboxSummary
Container.sourceText = "87 200.00"
Container.sourcePicture = Picture
Container.Orientation = Negative
```

renders the text first and the picture after it.

If only one source exists, Orientation does not change the visible content.

The exact representation/reference grammar of `sourcePicture` is NOT YET SPECIFIED.
The exact value grammar of `Container.Font` is NOT YET SPECIFIED.

Because text and picture may coexist in one Container, `Container.Type` is not a mutually exclusive content selector. Its exact semantics are NOT YET SPECIFIED.

## Container data

Dynamic Container content may be supplied by `SetData` and addressed by the Container `id`.

The data model must allow both text and picture sources to be present for the same Container.

## Validation

`Validator` runs before rendering.

For every Container used by the composition, its SetData item must:
- exist;
- provide at least one non-empty source: `sourceText` or `sourcePicture`;
- allow both sources simultaneously.

Invalid SetData stops rendering.

## Rendering

`WebRenderer` consumes the PlaneCode composition, validated SetData and SetRender.

Current SetRender parameters:
- `PanelSpacing`;
- `BackgroundColor`;
- `PanelColor`;
- `BorderColor`;
- `TextColor`.

Current `PanelSpacing`: **20 px**.

The current web rendering uses visible borders and physical panel depth for SimplePanel and ActivePanel.

The relative rendering order/placement of simultaneous text and picture sources inside one Container is NOT YET SPECIFIED.

## Multiple BasePanel surfaces

Multiple root BasePanel surfaces are rendered as separate full-screen surfaces.

The current web runtime supports horizontal pointer/touch movement between adjacent BasePanel surfaces:
- surfaces follow horizontal pointer movement;
- a 40 px release threshold changes the current surface;
- releasing below the threshold returns the surfaces to their current position.

## Release layout

- `runtime/` — WebRenderer, Validator and renderer CSS.
- `release/` — released PlaneCode composition, SetData and SetRender.
- `web/` — browser entry point.

This document describes PlaneCode 1.0.0 only.
