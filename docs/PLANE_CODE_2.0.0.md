# PlaneCode 2.0.0

Status: RELEASED / CURRENT

PlaneCode is the project.
PLang is the language used by PlaneCode to describe interface entities and their relations.

## Project architecture

```text
PlaneCode
├── PLang
├── Compositor
├── Validator
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

No Row, Column, Card, Section or other layout entity types are introduced by this version.

## Login

Every PLang entity has a required `Login`.

`Login` is the working identity under which the entity participates in composition.

```text
BasePanel.Login
SimplePanel.Login
ActivePanel.Login
Container.Login
```

Application-domain identities are expressed through `Login`; they do not create new PLang entity types.

Examples:

```text
SimplePanel.Login = Operations
ActivePanel.Login = AllOperations
Container.Login = CashboxAmount
```

`Name` is not part of PLang 2.0.0.

Within one composition, every Login must be unique.

## Container sources

`Container.Type` does not exist in PLang 2.0.0.

A Container may receive two independent sources:

```text
Container.SourceText
Container.SourcePicture
```

The sources are independent. A Container may have:
- only SourceText;
- only SourcePicture;
- both SourceText and SourcePicture;
- neither source.

An absent source does not participate in composition at all:
- it reserves no place;
- it creates no placeholder;
- it creates no divider;
- it creates no offset;
- it has no effect on the position of a present source.

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

If zero or one source is present, Orientation has no visible effect.

## Container font

```text
Container.Font
```

The property exists in PLang.
Its exact value grammar is NOT YET SPECIFIED.

## Picture source

```text
Container.SourcePicture
```

The property exists in PLang.
Its canonical reference/value grammar is NOT YET SPECIFIED.

The current WebRenderer accepts a non-empty string as the runtime picture source.

## SetData

Dynamic source values are supplied through SetData and are addressed by Container Login.

Example:

```text
Container.Login = CashboxSummary
```

```js
setData = {
  CashboxSummary: {
    SourceText: "87 200.00",
    SourcePicture: "..."
  }
}
```

Missing source fields are treated as absent sources, not as empty slots.

## Compositor

The Compositor is a first-class PlaneCode component.

Responsibilities:
- consume validated PLang and SetData;
- identify entities by Login;
- include only sources that are actually present;
- center a single present source;
- order two present sources according to Container.Orientation;
- emit a concrete composition for the Renderer.

The Compositor does not render visual output.

## Validator

Validator checks:
- every PLang entity has a non-empty Login;
- Logins are unique within the composition;
- Container.Orientation, when present, is Positive or Negative;
- provided SourceText is valid for the runtime;
- provided SourcePicture is valid for the current Renderer transport.

Missing SourceText or SourcePicture is valid.

## Renderer

Renderer consumes the concrete composition emitted by Compositor.

Renderer does not infer missing entities or reserve space for absent sources.

For the current WebRenderer:
- one source is centered;
- absent sources generate no rendered node;
- Picture and Text are rendered in Compositor order.

## SetRender

Current SetRender parameters remain:
- `PanelSpacing`;
- `BackgroundColor`;
- `PanelColor`;
- `BorderColor`;
- `TextColor`.

Current `PanelSpacing`: **20 px**.

## Multiple BasePanel surfaces

Multiple root BasePanel surfaces remain supported as separate full-screen surfaces.

The current web runtime retains horizontal pointer/touch movement between adjacent BasePanel surfaces.

## Release layout

- `runtime/compositor.js` — PLang Compositor.
- `runtime/validator.js` — PLang/SetData validation.
- `runtime/web-renderer.js` — WebRenderer.
- `runtime/renderer.css` — current web rendering rules.
- `release/p-lang.js` — released PLang composition.
- `release/set-data.js` — released data instance.
- `release/set-render.js` — released render parameters.
- `web/` — browser entry point.

This document defines PlaneCode 2.0.0.
