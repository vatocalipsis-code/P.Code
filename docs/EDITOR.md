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


## Live numeric controls

Continuous numeric visual properties use a range slider together with a precise number field. Slider movement updates the P.Code preview immediately.

The slider is an editor convenience, not a new PLang constraint. For finite values outside the convenience range, the precise numeric field remains authoritative and the slider expands to include the current value. Canonical limits are preserved where the contract defines them, including transparency `0..1` and FontWeight `1..1000`.

Current slider-backed properties include border widths, Width/Height, Padding, Gap, FontSize, FontWeight, Parallax, PanelTransparency, Shadow, PanelSpacing, Transparency, TextTransparency and PictureTransparency.

## Font family/resources decision gate

The current main PLang canon states that `Container.Font` exists but its exact grammar is **NOT YET SPECIFIED**. The current SPL contract also defines no portable binary/resource section for embedded fonts or small assets.

Therefore this editor does not invent a font-family selector, font-resource manifest, base64 blob syntax, resource path table, or other new SPL representation. FontSize and FontWeight remain editable now; font family selection and self-contained font/icon packaging require an explicit canonical representation first.
