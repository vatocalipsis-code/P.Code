# PlaneCode Editor

Status: MVP on `feature/container-layout-trial`.

`editor/` is a browser authoring surface for PlaneCode. It is not part of the production runtime contract.

## Architecture

```text
mutable authored project
-> validate SetLang / SetRender
-> compile fresh private Object Plan
-> render preview
```

Production RuntimeHandle immutability is unchanged. Every editor structural/property mutation creates a new preview compilation.

## MVP capabilities

- structure tree for panels, Groups and Containers;
- recursive Group/Container nesting;
- drag reorder / reparent in the tree;
- add/delete/move Group and Container items;
- live property inspector;
- independent FillHorizontal / FillVertical editing;
- Group Orientation editing;
- Container content alignment, Order, typography and data editing;
- live validation and PlaneCode preview;
- optional outlines for invisible Groups;
- project JSON import/export;
- SetLang copy to clipboard.

## Non-goals of the MVP

The editor does not make CSS the source of truth. It edits the authored PlaneCode model. Browser DOM/CSS is preview implementation only.

Direct manipulation resize handles, SPL text parsing/serialization, undo/redo history and richer asset management are next-layer editor features.
