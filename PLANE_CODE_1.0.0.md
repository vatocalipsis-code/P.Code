# PlaneCode 1.0.0

Status: RELEASED / CURRENT

PlaneCode 1.0.0 is the released working state of the PlaneCode visual and tactile interface runtime.

## Current structure

A PlaneCode composition in this release uses:

```text
BasePanel
└── SimplePanel
    └── ActivePanel
        └── Container
```

The current implementation supports one or more root `BasePanel` surfaces.

Every element may have an `id`.

## Container data

Container content is supplied by `SetData` and is addressed by the Container `id`.

Supported data types:

```text
Text
Image
```

A Container displays one supplied data item.

## Validation

`Validator` runs before rendering.

For every Container used by the composition, its SetData item must:
- exist;
- have type `Text` or `Image`;
- have a non-empty string value.

Invalid SetData stops rendering.

## Rendering

`WebRenderer` consumes:
- PlaneCode composition;
- validated SetData;
- SetRender.

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

## Current implementation files

- `plane-code.js`
- `set-data.js`
- `set-render.js`
- `validator.js`
- `web-renderer.js`
- `renderer.css`
- `main.js`
- `index.html`

This document describes PlaneCode 1.0.0 only.
