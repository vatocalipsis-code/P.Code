# PlaneCode 1.0.0

Status: CANON

PlaneCode is a minimal declarative language for composing panel-based interfaces.

## Core grammar

```text
BasePanel
├── SimplePanel
└── Spacer
    └── Orientation: Vertical OR Horizontal

SimplePanel
├── ActivePanel
└── Spacer
    └── Orientation: Vertical OR Horizontal

ActivePanel
├── ActivePanel.Aggregate
├── ActivePanel
├── Container: Text OR Image
└── Spacer
    └── Orientation: Vertical OR Horizontal
```

## BasePanel

`BasePanel` is the invisible root of a composition.

Allowed children:
- `SimplePanel`
- `Spacer`

## SimplePanel

`SimplePanel` is a panel that may contain interactive panels.

Allowed children:
- `ActivePanel`
- `Spacer`

## ActivePanel

`ActivePanel` is an interactive panel.

Allowed children:
- `ActivePanel.Aggregate`
- `ActivePanel`
- `Container`
- `Spacer`

An `ActivePanel` may contain another `ActivePanel`. Nesting depth is not fixed by the grammar.

## ActivePanel.Aggregate

`ActivePanel.Aggregate` is a distinct child entity of `ActivePanel` for an aggregate name or aggregate function.

Its explicit dimensions are not defined by the grammar.

Its size is automatic and follows its content.

## Container

`Container` displays exactly one content type:

```text
Container: Text OR Image
```

`Text` and `Image` are alternatives, not simultaneous sequential content types.

## Spacer

`Spacer` is one reusable spacing entity used at every level where the grammar permits it.

Its orientation is exactly one of:

```text
Vertical
OR
Horizontal
```

## Scope

PlaneCode defines composition grammar only.

It does not define application meaning, business entities, visual styling, physical depth, rendering technology, input technology, fixed dimensions, or a target device.

Those concerns belong to the system that interprets a PlaneCode composition.

## Invariants

1. `BasePanel` is invisible.
2. `BasePanel` contains only `SimplePanel` and `Spacer`.
3. `SimplePanel` contains only `ActivePanel` and `Spacer`.
4. `ActivePanel` contains only `ActivePanel.Aggregate`, `ActivePanel`, `Container`, and `Spacer`.
5. `Container` contains exactly one of `Text` or `Image`.
6. `Spacer` is the same entity wherever it is used.
7. `Spacer` orientation is `Vertical` or `Horizontal`.
8. `ActivePanel` nesting depth is not fixed by the grammar.
9. `ActivePanel.Aggregate` uses automatic content-driven sizing.
10. Anything not defined by this specification is outside PlaneCode 1.0.0.
