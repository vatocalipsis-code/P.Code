# PlaneCode 2.2.0

Status: RELEASED / CURRENT

PlaneCode is the project.
PLang is the language used by PlaneCode to describe interface entities and their relations.

## Architecture

```text
PLang
  ↓
Validator
  ↓
Compositor
  ↓
Renderer
```

PLang answers what exists.
Compositor answers what participates and in what order.
SetRender describes physical and visual presentation.
Renderer calculates geometry, motion and pixels from the composed structure and SetRender.

## PLang hierarchy

```text
BasePanel
└── SimplePanel
    └── ActivePanel
        └── Container
```

No Row, Column, Card, Section, PrimaryText, SecondaryText or parallel semantic visual types are introduced.

Every PLang entity has a required unique `Login`.

## Container sources

`Container.Type` does not exist.

A Container may have:

```text
Container.SourceText
Container.SourcePicture
```

An absent source does not participate in composition and reserves no space.

A single present source is centered.

When both sources are present:

```text
Orientation = Positive
Picture → Text
```

```text
Orientation = Negative
Text → Picture
```

`Container.Font` exists; its exact PLang value grammar remains NOT YET SPECIFIED.

## SourcePicture

SourcePicture references a PNG file only.

```text
Container.SourcePicture = "icons/chevron.png"
```

PNG intrinsic alpha is preserved.
JPG, JPEG, WEBP, SVG, GIF, data URLs, network URI schemes, resource objects and binary objects are not canonical SourcePicture values.

## SetRender addressing

SetRender never creates new entities.
It addresses existing PLang entities only through Login.

`SetRender.Elements` is optional.
Each `Elements[Login]` entry is optional and contains only explicit visual/physical overrides.

A PLang entity may have no SetRender entry.

## Global render properties

```text
SetRender.PanelSpacing
SetRender.BackgroundColor
SetRender.PanelColor
SetRender.BorderColor
SetRender.TextColor
SetRender.Transparency
SetRender.TextTransparency
SetRender.PictureTransparency
SetRender.Parallax
```

Current PanelSpacing is 20 logical pixels.

Transparency ranges from 0 to 1:
- 0 = opaque
- 1 = fully transparent

Structural Transparency applies to structural geometry, including Background and Border.
It does not propagate into SourceText or SourcePicture.
Nested structural elements do not multiply Transparency.

TextTransparency and PictureTransparency control their source content independently.

Global Parallax is optional. Its value is a signed number of logical pixels representing maximum displacement at the edge of the render surface:
- 0 = no parallax
- positive = follows pointer displacement
- negative = moves opposite pointer displacement

A per-Login Parallax overrides the global Parallax for that entity.

## Per-Login render properties

All properties below are optional:

```text
Elements[Login].Background

Elements[Login].BorderColor
Elements[Login].BorderWidth

Elements[Login].BorderLeftColor
Elements[Login].BorderLeftWidth
Elements[Login].BorderRightColor
Elements[Login].BorderRightWidth
Elements[Login].BorderTopColor
Elements[Login].BorderTopWidth
Elements[Login].BorderBottomColor
Elements[Login].BorderBottomWidth

Elements[Login].TextColor
Elements[Login].FontSize
Elements[Login].FontWeight

Elements[Login].PictureTint

Elements[Login].Width
Elements[Login].Height
Elements[Login].Padding
Elements[Login].Gap
Elements[Login].Alignment
Elements[Login].Distribution
Elements[Login].Direction

Elements[Login].Parallax
```

## Background semantics

Background is optional.

If Background is present, the entity has its own fill.
If Background is absent, the entity has no fill and is visually transparent.

Absence of Background is not equivalent to `Transparency = 1` and does not invent or inherit an arbitrary fill.

## Border semantics

Border widths are non-negative logical pixels.

A side-specific border value overrides the corresponding general border value.

Side-specific color and width allow visual marks such as a colored left strip without introducing an Accent entity or Accent semantic type.

## Text semantics

Text appearance is addressed through the Login of the Container carrying SourceText.

No PrimaryText, SecondaryText, AmountText or other text role types exist.

`FontSize` is a non-negative logical-pixel value.
`FontWeight` is an integer from 1 to 1000.

## Picture semantics

PictureTint is an optional visual tint applied to SourcePicture while preserving PNG alpha shape.

PictureTransparency remains independent from structural Transparency.

## Geometry ownership

Geometry belongs to SetRender / Renderer, not Compositor.

The following are render properties:

```text
Width
Height
Padding
Gap
Alignment
Distribution
Direction
```

Width, Height, Padding and Gap are non-negative logical-pixel values.

Direction:
- Horizontal
- Vertical

Alignment:
- Start
- Center
- End
- Stretch

Distribution:
- Start
- Center
- End
- Between
- Around
- Evenly

Renderer calculates final physical coordinates.
Absolute X/Y coordinates are not part of this canon.

Compositor remains responsible for presence, absence, parent/child structure and source order.

## Parallax ownership

Parallax belongs entirely to the Render layer.

Compositor does not know or change because of parallax.

The current WebRenderer derives normalized pointer position from the render surface and translates only entities whose effective Parallax is non-zero.

The pointer handler is requestAnimationFrame-throttled.
Repeated render calls replace the previous parallax binding rather than stacking listeners.

## Validator

Validator checks:
- required unique PLang Login;
- valid Container Orientation;
- SourceText string when present;
- SourcePicture PNG-file reference when present;
- Transparency values in the 0..1 range;
- SetRender.Elements object shape when present;
- every Elements key refers to an existing Login;
- optional color/string properties are non-empty strings;
- optional size/width properties are non-negative finite numbers;
- FontWeight is an integer from 1 to 1000;
- Alignment, Distribution and Direction use canonical values;
- global and per-Login Parallax are finite numbers.

Validator does not require:
- SetRender.Elements;
- an entry for every Login;
- Background;
- Border;
- geometry;
- parallax.

## Current SetRender example

```js
export const setRender = {
  PanelSpacing: 20,

  BackgroundColor: "#f2f2f2",
  PanelColor: "#f2f2f2",
  BorderColor: "#555555",
  TextColor: "#1f1f1f",

  Transparency: 0,
  TextTransparency: 0,
  PictureTransparency: 0,
  Parallax: 0,

  Elements: {
    Cashbox1: {
      Background: "#15263C",
      BorderLeftColor: "#48A0F7",
      BorderLeftWidth: 4,
      Padding: 12,
      Gap: 8,
      Direction: "Vertical",
      Parallax: 2
    },

    Cashbox1Amount: {
      TextColor: "#FFFFFF",
      FontSize: 28,
      FontWeight: 600
    }
  }
};
```

## Release layout

- `runtime/compositor.js` — PLang Compositor.
- `runtime/validator.js` — PLang, SetData and SetRender validation.
- `runtime/web-renderer.js` — WebRenderer.
- `runtime/renderer.css` — web rendering rules.
- `release/p-lang.js` — released PLang composition.
- `release/set-data.js` — released data instance.
- `release/set-render.js` — released render parameters.
- `web/` — browser entry point.

This document defines PlaneCode 2.2.0.
