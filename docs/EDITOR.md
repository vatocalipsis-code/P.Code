# P.Code Theme/Skin Editor

Status: working editor surface on `feature/theme-skin-editor-v1`.

`editor/` is a human-facing authoring surface over existing P.Code/SPL contracts. It is not a new runtime contract and does not create a separate Skin semantic layer.

## User loop

1. Open an `.SPL` file.
2. See the rendered P.Code result.
3. Select a rendered object with the mouse or choose any layer in the Layers tree.
4. Edit only properties already defined by PLang/SetLang or scene-global SetRender.
5. Resize a selected rendered object with the corner handle, which writes canonical `Width` / `Height`.
6. Change order inside an existing canonical collection with Earlier/Later controls.
7. Save a complete themed `.SPL`, or export/import a skin payload containing only `{SetLang, SetRender}`.

SetData is never edited by the Theme/Skin Editor. The editor checks this invariant before rendering.

## SPL support

`editor/spl.js` parses and serializes the current three-Set SPL envelope: SetLang, SetData and SetRender.

It accepts current `Layout[]`/Group authoring and the existing legacy typed `Containers[]` form accepted by the runtime compatibility boundary. Legacy sibling `AggregateActivePanels[]` is normalized to the current `SimplePanel.Properties.AggregateActivePanels` representation on import.

## Property boundary

Object-specific visual/layout properties remain SetLang. Global scene properties remain SetRender. SetData remains live visible/application data.

The editor does not invent absolute position properties. Arbitrary X/Y positioning is **NOT YET SPECIFIED** in PLang. Existing layout controls, collection order, Width/Height, Fill, alignment, distribution, direction, padding and gap are used where defined.

## Runtime model

Every visual edit validates SetLang/SetRender, compiles a fresh private Object Plan, and renders the preview. Production runtime immutability is unchanged.
