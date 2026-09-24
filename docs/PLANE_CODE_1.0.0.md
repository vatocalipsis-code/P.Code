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

A `Container` has the common entity property `Name` and may additionally define content properties.

Canonical Container properties:

```text
Container.Name
Container.Type
Container.Text
Container.Picture
Container.Font
```

`Container.Type` defines the content kind and currently supports exactly:

```text
Text
Picture
```

For a text container:

```text
Container.Name = CashboxAmount
Container.Type = Text
Container.Text = C("87 200.00")
Container.Font = ...
```

For a picture container:

```text
Container.Name = CashboxIcon
Container.Type = Picture
Container.Picture = ...
```

`Container.Text` is used when `Container.Type = Text`.
`Container.Picture` is used when `Container.Type = Picture`.

The exact value grammar of `Container.Font` and `Container.Picture` is NOT YET SPECIFIED.

## Container data

Dynamic Container content may be supplied by `SetData` and addressed by the Container `id`.

## Validation

`Validator` runs before rendering.

For every Container used by the composition, its SetData item must:
- exist;
- have type `Text` or `Picture`;
- have a non-empty string value.

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
