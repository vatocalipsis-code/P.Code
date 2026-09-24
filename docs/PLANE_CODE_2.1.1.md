# PlaneCode 2.1.1

Status: RELEASED / CURRENT

PlaneCode is the project.
PLang is the language used by PlaneCode to describe interface entities and their relations.

## Project architecture

```text
PlaneCode
├── PLang
├── Validator
├── Compositor
├── SetData
├── SetRender
└── Renderer
```

Canonical execution path:

```text
PLang
  ↓
Validator
  ↓
Compositor
  ↓
Renderer
```

The Renderer displays the composition produced by the Compositor.

## PLang entity hierarchy

The canonical entity hierarchy remains:

```text
BasePanel
└── SimplePanel
    └── ActivePanel
        └── Container
```

No Row, Column, Card, Section or other layout entity types are introduced.

## Login

Every PLang entity has a required unique `Login`.

`Login` is the working identity under which the entity participates in composition and under which SetRender can address that rendered entity.

```text
BasePanel.Login
SimplePanel.Login
ActivePanel.Login
Container.Login
```

`Name` is not part of PLang.

## Container sources

`Container.Type` does not exist.

A Container may receive two independent sources:

```text
Container.SourceText
Container.SourcePicture
```

A Container may have either source, both sources, or neither source.

An absent source does not participate in composition at all. It reserves no place, creates no placeholder, divider, gap or offset, and has no effect on the position of a present source.

A single present source is composed as the sole content of the Container and is centered in the Container.

## Container orientation

`Container.Orientation` controls source order only when both sources are present.

```text
Container.Orientation = Positive
Picture → Text
```

```text
Container.Orientation = Negative
Text → Picture
```

With zero or one source, Orientation has no visible effect.

## Container font

```text
Container.Font
```

The property exists in PLang.
Its exact value grammar is NOT YET SPECIFIED.

## Canonical picture source

`Container.SourcePicture` references a PNG file only.

Canonical example:

```text
Container.SourcePicture = "icons/chevron.png"
```

JPG, JPEG, WEBP, SVG, GIF, data URLs, network URI schemes, resource objects and binary objects are not canonical SourcePicture values.

The PNG file keeps its intrinsic alpha channel. Transparent PNG pixels remain transparent.

## SetData

Dynamic source values are supplied through SetData and are addressed by Container Login.

```js
setData = {
  CashboxSummary: {
    SourceText: "87 200.00",
    SourcePicture: "icons/cashbox.png"
  }
}
```

Missing source fields are absent sources, not empty slots.

## Compositor

The Compositor is a first-class PlaneCode component.

It:
- consumes validated PLang and SetData;
- identifies entities by Login;
- includes only sources that are present;
- centers a single present source;
- orders two present sources according to Container.Orientation;
- emits a concrete composition for the Renderer.

The Compositor does not render visual output.

## Render model

SetRender controls visual representation.

SetRender does not create new entity types or semantic visual classes. It addresses existing PLang entities only through their Login.

`SetRender.Elements` is optional. Each `Elements[Login]` entry is an optional set of explicit visual overrides.

```js
SetRender.Elements = {
  Operations: {
    Background: "#0C2238"
  }
}
```

A PLang entity may have no SetRender entry at all.

`Background` is optional. If Background is present, the entity has its own fill. If Background is absent, the entity has no fill and is visually transparent.

Absence of Background is not equivalent to `Transparency = 1` and does not cause an arbitrary fill to be inherited.

SetRender introduces no parallel semantic or layout type system.

## Structural transparency

```text
SetRender.Transparency
```

Transparency is global for the structural interface and inherited by structural entities.

Range:

```text
0 = opaque
1 = fully transparent
```

Structural Transparency applies to the visual structure of BasePanel, SimplePanel, ActivePanel and Container, including their Background and Border.

Structural Transparency does not propagate into SourceText or SourcePicture.

It is applied once as one global value. Nested entities do not multiply the value through the hierarchy.

## Text transparency

```text
SetRender.TextTransparency
```

TextTransparency controls SourceText independently of structural Transparency.

Range:

```text
0 = opaque
1 = fully transparent
```

## Picture transparency

```text
SetRender.PictureTransparency
```

PictureTransparency controls SourcePicture independently of structural Transparency.

Range:

```text
0 = opaque
1 = fully transparent
```

PictureTransparency is applied in addition to the PNG file's own alpha channel. It does not replace or flatten intrinsic PNG transparency.

## Current SetRender shape

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

  Elements: {
    SomeLogin: {
      Background: "#f2f2f2"
    }
  }
};
```

`BackgroundColor`, `PanelColor`, `BorderColor` and `TextColor` remain available as current renderer-wide values. `Elements[Login]` contains only explicit per-Login overrides. `Background`, when present, gives that entity its own fill; when absent, that entity has no fill.

Current `PanelSpacing`: **20 px**.

## Validator

Validator checks:
- every PLang entity has a non-empty unique Login;
- Container.Orientation is Positive or Negative when present;
- SourceText is a string when present;
- SourcePicture is a canonical PNG file reference when present;
- Transparency, TextTransparency and PictureTransparency are numbers from 0 to 1;
- SetRender.Elements is an object when present;
- each SetRender.Elements key refers to an existing PLang Login;
- Background is a non-empty string when explicitly present.

Validator does not require SetRender.Elements, a render entry for every Login, or Background on every render entry.

Missing SourceText or SourcePicture is valid.

## Renderer

Renderer consumes the concrete composition emitted by Compositor.

For the current WebRenderer:
- absent sources generate no rendered node;
- one source is centered;
- two sources are rendered in Compositor order;
- an entity uses its Login-addressed Background only when that Background is explicitly present;
- an entity without Background has no fill;
- structural Transparency affects structure without fading Text or Picture content;
- TextTransparency and PictureTransparency are applied independently;
- PNG intrinsic alpha is preserved.

## Multiple BasePanel surfaces

Multiple root BasePanel surfaces remain supported as separate full-screen surfaces.

The current web runtime retains horizontal pointer/touch movement between adjacent BasePanel surfaces.

## Release layout

- `runtime/compositor.js` — PLang Compositor.
- `runtime/validator.js` — PLang, SetData and SetRender validation.
- `runtime/web-renderer.js` — WebRenderer.
- `runtime/renderer.css` — current web rendering rules.
- `release/p-lang.js` — released PLang composition.
- `release/set-data.js` — released data instance.
- `release/set-render.js` — released render parameters.
- `web/` — browser entry point.

This document defines PlaneCode 2.1.1.
